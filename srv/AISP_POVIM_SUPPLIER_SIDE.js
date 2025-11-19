// const cds = require('@sap/cds');

// module.exports = async (srv) =>
// {
//     // Using CDS API
//     const ZP_AISP_POVIM_HEAD_BND = await cds.connect.to("ZP_AISP_POVIM_HEAD_BND");
//       srv.on('READ', 'SAP__UnitsOfMeasure', req => ZP_AISP_POVIM_HEAD_BND.run(req.query));
//       srv.on('READ', 'SAP__Currencies', req => ZP_AISP_POVIM_HEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_AISP_POVIM_HEAD', req => ZP_AISP_POVIM_HEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_AISP_POVIM_ITEM', req => ZP_AISP_POVIM_HEAD_BND.run(req.query));
// }

const cds = require("@sap/cds");
const cron = require("node-cron");
const fileType = require("file-type");
const { v4: uuidv4 } = require("uuid");
const { getConnection } = require("./Library/DBConn");
const { GetNextNumber } = require("./Library/Utility");
const lib_email = require("./Library/Email");
const emailTemplates = require("./Library/EmailTemplate");
const { BlobServiceClient } = require("@azure/storage-blob");
const { sendPostPayloadToSAPforCreateVim } = require("./Library/sapBatchUtils");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { status } = require("express/lib/response");
const { mongoRead } = require("../srv/Library/helper");
const { Decimal128 } = require("mongodb");

const connectionString =
  process.env.AZURE_STORAGE_CONTAINER_STRING;
const containerName = process.env.AZURE_STORAGE_CONNECTION_NAME;

// Allowed MIME Types and Extensions
const mimeToExtensionMap = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
  "application/vnd.ms-outlook": "msg",
  "application/x-cfb": "msg",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

async function getMimeTypeFromBase64(base64String) {
  const buffer = Buffer.from(base64String, "base64");
  const fileTypeResult = await fileType.fromBuffer(buffer);

  if (fileTypeResult) {
    // Handle specific cases
    if (fileTypeResult.mime === "application/x-cfb") {
      // Assume it's an .msg file if CFB format is detected
      return "application/vnd.ms-outlook";
    }
    return fileTypeResult.mime;
  } else {
    // Fallback for Outlook .msg files based on signature
    const outlookSignature = buffer.slice(0, 4).toString("hex"); // Detect .msg signature
    if (outlookSignature === "d0cf11e0") {
      return "application/vnd.ms-outlook";
    }
    throw new Error("Unable to determine MIME type.");
  }
}

async function uploadImageToAzure(REQUEST_NO, IMAGEURL, IMAGE_FILE_NAME) {
  try {
    // If IMAGEURL is already a URL (starts with http or https), return it directly
    if (IMAGEURL.startsWith("http://") || IMAGEURL.startsWith("https://")) {
      return IMAGEURL; // Return the existing URL (no need to upload again)
    }

    // Initialize Azure Blob Service Client
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Detect MIME type
    const mimeType = await getMimeTypeFromBase64(IMAGEURL);

    // Validate MIME type
    if (!mimeToExtensionMap[mimeType]) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }

    // Get file extension
    const extension = mimeToExtensionMap[mimeType];

    // Generate a unique file name for Azure
    const uniqueFilePath = `${REQUEST_NO}_${IMAGE_FILE_NAME}.${extension}`;

    // Get Block Blob Client
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFilePath);

    // Convert Base64 string to Buffer
    const buffer = Buffer.from(IMAGEURL, "base64");

    // Upload File
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });

    return blockBlobClient.url; // Return the new Azure Blob URL
  } catch (error) {
    console.error(
      `Error uploading file to Azure Blob Storage: ${error.message}`
    );
    throw error;
  }
}

module.exports = async (srv) => {
  //Supplier Open Tab item click
  srv.on("READ", "ZP_AISP_POVIM_HEAD", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_AISP_POVIM_HEAD");

    // Build the MongoDB query from the CAP request
    const { filter, select, sort, skip, limit } = buildMongoQuery(req);

    const cursor = collection.find(filter);
    if (select) cursor.project(select);
    if (sort) cursor.sort(sort);
    if (skip) cursor.skip(skip);
    if (limit) cursor.limit(limit);

    // Data for this page
    try {
      const data = await cursor.toArray();
      return data;
    } catch (error) {
      req.error({
        code: 500,
        message: error.message || "Error fetching RejectedTab data",
      });
    }

    const totalCount = await collection.countDocuments(query);
    data["$count"] = totalCount;

    return data;
  });

  //Supplier Open Tab item click
  srv.on("READ", "ZP_AISP_POVIM_ITEM", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_AISP_POVIM_ITEM");

    // Build the MongoDB query from CAP request
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);

    // Ensure filter is set for REQUEST_NO
    if (filter.REQUEST_NO) {
      console.log("REQUEST_NO in filter:", filter.REQUEST_NO); // Check the REQUEST_NO value
    } else {
      console.error("REQUEST_NO is missing in filter");
    }

    const cursor = collection.find(filter);
    if (select) cursor.project(select);
    if (sort) cursor.sort({ ...sort, Bedat: -1 });
    if (skip) cursor.skip(skip);
    if (limit) cursor.limit(limit);

    // Data for this page
    let data = await cursor.toArray();

    const totalCount = await collection.countDocuments(filter);
    data["$count"] = totalCount;

    return data;
  });

  srv.on("GET", "VIMAttachment", async (req) => {
    try {
      const { database } = await getConnection();
      const attachmentVimCollection = database.collection(
        "ATTACHMENTS_VIM_DOC"
      );

      const data = await mongoRead("ATTACHMENTS_VIM_DOC", req, []);

      if (!data) {
        return req.error({
          code: 404,
          message: `No Logs found!!`,
        });
      }

      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  //VENDOR PENDING TAB
  srv.on("READ", "ZP_AISP_POVIM_HEAD_Pending", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_AISP_POVIM_HEAD");

    // Build the MongoDB query from the CAP request
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);

    filter = {
      ...filter,
      Status: { $in: ["Invoice Pending", "Invoice Rejected"] }, // Apply $in on Status field
    };

    let cursor = collection.find(filter);
    if (select) cursor.project(select);
    if (sort) cursor.sort({ Bedat: -1 });
    if (skip) cursor.skip(skip);
    if (limit) cursor.limit(limit);

    // Data for this page
    let data = await cursor.toArray();

    const totalCount = await collection.countDocuments(filter);
    data["$count"] = totalCount;

    return data;
  });

  //VENDOR SUBMITTED TAB
  srv.on("READ", "ZP_AISP_POVIM_HEAD_Submitted", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_AISP_POVIM_HEAD");

    // Build the MongoDB query from the CAP request
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);

    // Add the $or condition to filter for "Approved" or "In-process"
    filter.$or = [
      { Status: "Approved" },
      { Status: { $regex: /^In-process/, $options: "i" } },
    ];

    const cursor = collection.find(filter);
    if (select) cursor.project(select);
    if (sort) cursor.sort({ Bedat: -1 });
    if (skip) cursor.skip(skip);
    if (limit) cursor.limit(limit);

    // Data for this page
    let data = await cursor.toArray();

    // Add total count
    const totalCount = await collection.countDocuments(filter);
    data["$count"] = totalCount;

    return data;
  });

  //ApprovedTab Tab for approver
  srv.on("GET", "ApprovedTab", async (req) => {
    const { client, database } = await getConnection();
    const PovimHeaderCollection = database.collection("VIM_HEAD_DATA");
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);
    // const currentUser = 'ramchandra@airditsoftware.com'
    try {
      filter = {
        ...filter,
        STATUS: 5,
        // CURRENT_ASSIGNEE: currentUser
      };
      const cursor = collection.find(filter);
      if (select) cursor.sort(select);
      if (sort) cursor.project({ ...sort, CREATED_ON: -1 });
      if (skip) cursor.skip(skip);
      if (limit) cursor.limit(limit);

      const data = await cursor.toArray();

      if (!data) {
        return req.error({
          code: 404,
          message: `No data found!!`,
        });
      }

      const totalCount = await collection.countDocuments(filter);
      data["$count"] = totalCount;

      return data;
    } catch (error) {
      req.error({
        code: 500,
        message: error.message || "Error fetching RejectedTab data",
      });
    } finally {
      // client.close(); // Optional: if you're handling DB pool manually
    }
  });

  //Rejected Tab for approver
  srv.on("GET", "RejectedTab", async (req) => {
    const { client, database } = await getConnection();
    // Build the MongoDB query from the CAP request
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);
    const PovimHeaderCollection = database.collection("VIM_HEAD_DATA");

    try {
      filter = {
        ...filter,
        STATUS: 3,
        // CURRENT_ASSIGNEE: currentUser
      };
      const cursor = collection.find(filter);
      if (select) cursor.sort(select);
      if (sort) cursor.project({ ...sort, CREATED_ON: -1 });
      if (skip) cursor.skip(skip);
      if (limit) cursor.limit(limit);

      const data = await cursor.toArray();

      if (!data) {
        return req.error({
          code: 404,
          message: `No data found!!`,
        });
      }

      const totalCount = await collection.countDocuments(filter);
      data["$count"] = totalCount;

      return data;
    } catch (error) {
      req.error({
        code: 500,
        message: error.message || "Error fetching RejectedTab data",
      });
    } finally {
      // client.close(); // Optional: if you're handling DB pool manually
    }
  });

  //Supplier Submitted Tab
  srv.on("GET", "VIMDATA", async (req) => {
    const { client, database } = await getConnection();
    const PovimHeaderCollection = database.collection("VIM_HEAD_DATA");
    const PovimItemCollection = database.collection("VIM_ITEM_DATA");
    const AttachmentCollection = database.collection("ATTACHMENTS_VIM_DOC");

    try {
      const data = await mongoRead("VIM_HEAD_DATA", req, [
        { VIMPOItem: "VIM_ITEM_DATA" },
        { VIMAttachment: "ATTACHMENTS_VIM_DOC" },
      ]);

      if (!data) {
        return req.error({
          code: 404,
          message: `No data found!!`,
        });
      }
      return data;
    } catch (err) {
      console.error("Error reading data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("PostVimData", async (req) => {
    const { action, Vimhead, Vimitem, Attachment } = req.data;
    const safeDecimal = (val, fallback = "0") => {
      if (val === undefined || val === null || val === "")
        return new Decimal128(fallback);
      if (val instanceof Decimal128) return val;
      if (typeof val === "number") {
        return isNaN(val)
          ? new Decimal128(fallback)
          : new Decimal128(val.toString());
      }
      const s = String(val).trim();
      if (/^-?\d+(\.\d+)?$/.test(s)) {
        return new Decimal128(s);
      }
      return new Decimal128(fallback);
    };

    if (action === "CREATE") {
      const { client, database } = await getConnection();

      try {
        const { COMPANY_CODE, Ebeln, Vbeln, TotalAmount } = Vimhead[0];

        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "FIC",
            APPROVER_LEVEL: 1,
          });

          if (!approver)
            throw new Error(
              `No Approver found for COMPANY_CODE: ${companyCode}.`
            );
          return {
            CURRENT_ASSIGNEE: approver.USER_ID,
            APPROVER_ROLE: approver.USER_ROLE,
          };
        };

        const approvalHierarchyCollection = database.collection(
          "APPROVAL_HIERARCHY_FE"
        );
        const VimRequestInfoData = database.collection("VIM_HEAD_DATA");
        const ZAISP_VIM_PO_HEAD = database.collection("ZP_AISP_POVIM_HEAD");

        let REQUEST_NO;
        let returnMessage;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);
        REQUEST_NO = await GetNextNumber("NVIR");

        const newRequestInfo = {
          ...Vimhead[0],
          ASNamount: new Decimal128(Vimhead[0].ASNamount),
          Zbd1t: safeDecimal(Vimhead[0].Zbd1t),
          Zbd2t: safeDecimal(Vimhead[0].Zbd2t),
          Zbd3t: safeDecimal(Vimhead[0].Zbd3t),
          Zbd1p: safeDecimal(Vimhead[0].Zbd1p),
          Zbd2p: safeDecimal(Vimhead[0].Zbd2p),
          REQUEST_NO,
          STATUS: 4, // In Progress
          LAST_UPDATED_ON: new Date(),
          CREATED_ON: new Date(),
          PROCESS_LEVEL: "FIC",
          APPROVER_ROLE: approverDetails.APPROVER_ROLE,
          REQUESTER_ID: req.user.id,
          APPROVER_LEVEL: 1,
          CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
          Status: `In-Process ${approverDetails.APPROVER_ROLE}`,
        };

        await database.collection("VIM_APPROVAL_LOGS").insertOne({
          REQUEST_NO: REQUEST_NO,
          APPROVAL_LEVEL: 0,
          APPROVER_ID: "vendor@gmail.com",
          APPROVER_ROLE: "VENDOR",
          ACTION: "CREATE",
          COMMENT: "Invoice submitted by vendor.",
          TIMESTAMP: new Date(),
        });

        // Update the status in ZP_AISP_POVIM_HEAD for vendor
        await ZAISP_VIM_PO_HEAD.updateOne(
          { Ebeln: Ebeln, Vbeln: Vbeln }, // Use the proper filter
          {
            $set: {
              Status: `In-process ${approverDetails.APPROVER_ROLE}`,
              REQUEST_NO: REQUEST_NO,
            },
          } // Correct the update object
        );

        // Insert the new request info into the database
        await Promise.all([
          VimRequestInfoData.insertOne(newRequestInfo),
          database
            .collection("FICApprovalNo")
            .insertOne({ REQUEST_NO, ApprovalLevel: 1 }),
        ]);

        returnMessage = `Inserted data successfully, Request sent for Approval`;

        // Insert Vim item data and attachments
        const VIM_ITEM_INSERT = Vimitem?.length
          ? insertData(
              client,
              database,
              "VIM_ITEM_DATA",

              Vimitem.map((data) => ({
                ...data,
                menge: safeDecimal(data.menge),
                Asnqty: safeDecimal(data.Asnqty),
                ASNitamount: safeDecimal(data.ASNitamount),
                GRNitamount: safeDecimal(data.GRNitamount),
                Taxper: safeDecimal(data.Taxper),
                Taxval: safeDecimal(data.Taxval),
                Total: safeDecimal(data.Total),
                Mahnz: safeDecimal(data.Mahnz),
                REQUEST_NO,
              }))
            )
          : Promise.resolve("No Vim item data to insert");

        const VIM_Attachment = Attachment?.length
          ? handleAttachments(
              Attachment,
              "ATTACHMENTS_VIM_DOC",
              REQUEST_NO,
              database
            )
          : Promise.resolve("No attachments to insert");

        // Run insert operations in parallel
        await Promise.all([VIM_ITEM_INSERT, VIM_Attachment]);

        // =======================
        // Send Email Notification
        // =======================
        const emailSubject = `Action Required: Approval Pending for VIM Request ${REQUEST_NO}`;
        const emailBody = emailTemplates.ApproverMailBody(
          approverDetails.CURRENT_ASSIGNEE,
          Ebeln,
          Vbeln,
          TotalAmount
        );

        // Send email to approver
        await lib_email
          .sendEmail(
            approverDetails.CURRENT_ASSIGNEE,
            "vaibhavdesai9913@gmail.com", // CC recipient
            "html",
            emailSubject,
            emailBody
          )
          .catch((err) => console.error(`❌ Email sending failed:`, err));

        return returnMessage;
      } catch (error) {
        var iErrorCode = error.code ?? 500;
        req.error({
          code: iErrorCode,
          message: error.message ? error.message : error,
        });
      } finally {
        // await //client.close();
      }
    } else if (action === "APPROVE") {
      const { client, database } = await getConnection();
      const RNumber = req.data.REQUEST_NO;
      const APPROVED_COMMENT = req.data.Vimhead?.[0]?.APPROVED_COMMENT;

      //Step 1: Validate
      if (!APPROVED_COMMENT || APPROVED_COMMENT.trim() === "") {
        return req.error(400, "Approval comment is required.");
      }

      try {
        const VimRequestInfoData = database.collection("VIM_HEAD_DATA");
        const ZAISP_VIM_PO_HEAD = database.collection("ZP_AISP_POVIM_HEAD");

        // Update the status to Approved (status 4)
        await VimRequestInfoData.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { STATUS: 4, LAST_UPDATED_ON: new Date() } }
        );

        // Find the maximum approver level for FIC approvals
        const approvalHierarchyCollection = database.collection(
          "APPROVAL_HIERARCHY_FE"
        );
        const requestInfo = await VimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });
        const { COMPANY_CODE, Ebeln, Vbeln, TotalAmount } = requestInfo;
        const maxApproverLevelDoc = await approvalHierarchyCollection
          .find({ APPR_TYPE: "FIC", COMPANY_CODE })
          .sort({ APPROVER_LEVEL: -1 })
          .limit(1)
          .toArray();

        const maxApproverLevel = maxApproverLevelDoc.length
          ? maxApproverLevelDoc[0].APPROVER_LEVEL
          : 0;

        const FICApprovalNo = database.collection("FICApprovalNo");
        const result = await FICApprovalNo.findOne({ REQUEST_NO: RNumber });

        const currentApprovalLevel = result?.ApprovalLevel || 1;

        // ✅ Insert current approver's log before moving to next level
        const currentApproverLog = await approvalHierarchyCollection.findOne({
          APPROVER_LEVEL: currentApprovalLevel,
          APPR_TYPE: "FIC",
          COMPANY_CODE,
        });

        if (currentApproverLog) {
          await database.collection("VIM_APPROVAL_LOGS").insertOne({
            REQUEST_NO: RNumber,
            APPROVAL_LEVEL: currentApprovalLevel,
            APPROVER_ID: currentApproverLog.USER_ID,
            APPROVER_ROLE: currentApproverLog.USER_ROLE,
            ACTION: "APPROVE",
            COMMENT: APPROVED_COMMENT,
            TIMESTAMP: new Date(),
          });
        }

        if (result && result.ApprovalLevel === maxApproverLevel) {
          // ===>  SAP batch trigger
          try {
            const { sapMessages, sapErrors } =
              await sendPostPayloadToSAPforCreateVim(RNumber);
            
            if (sapErrors.length > 0) {
              // Log and fail
              await database.collection("VIM_BATCH_LOGS").insertOne({
                REQUEST_NO: RNumber,
                STATUS: "SAP_ERROR",
                sapErrors,
                timestamp: new Date(),
              });

              // ✅ Update approval log with SAP failure info
              await database.collection("VIM_APPROVAL_LOGS").updateOne(
                {
                  REQUEST_NO: RNumber,
                  APPROVAL_LEVEL: maxApproverLevel,
                  ACTION: "APPROVE",
                },
                {
                  $set: {
                    S4Response: "FAILED",
                    S4ErrorMessage: sapErrors.join("; "),
                    UPDATED_ON: new Date(),
                  },
                }
              );

              return req.error({
                code: 500,
                message: `SAP invoice creation failed: ${sapErrors.join("; ")}`,
              });
            }

            const finalApprover = await approvalHierarchyCollection.findOne({
              APPROVER_LEVEL: maxApproverLevel,
              APPR_TYPE: "FIC",
              COMPANY_CODE,
            });

            if (finalApprover) {
              await VimRequestInfoData.updateOne(
                { REQUEST_NO: RNumber },
                {
                  $set: {
                    APPROVER_ROLE: finalApprover.USER_ROLE,
                    APPROVER_LEVEL: maxApproverLevel,
                    STATUS: 5,
                    COMPANY_CODE: finalApprover.COMPANY_CODE,
                    CURRENT_ASSIGNEE: finalApprover.USER_ID,
                    Status: "Invoice Created",
                    LAST_UPDATED_ON: new Date(),
                    MAX_APPROVER_LEVEL: maxApproverLevel,
                  },
                }
              );

              await ZAISP_VIM_PO_HEAD.updateOne(
                { Ebeln: Ebeln, Vbeln: Vbeln },
                { $set: { Status: `Approved`, REQUEST_NO: RNumber } }
              );

              return `Invoice created and VIM Request ${RNumber} approved successfully.`;
            }
          } catch (err) {
            console.error(
              `[❌ SAP ERROR] Failed batch call for REQUEST_NO ${RNumber}:`,
              err.message
            );

            await VimRequestInfoData.updateOne(
              { REQUEST_NO: RNumber },
              {
                $set: {
                  STATUS: 99,
                  Status: "SAP Integration Failed",
                  LAST_UPDATED_ON: new Date(),
                },
              }
            );

            await database.collection("VIM_BATCH_LOGS").insertOne({
              REQUEST_NO: RNumber,
              STATUS: "SAP_BATCH_FAILED",
              error: err.message,
              timestamp: new Date(),
            });

            req.error({
              code: 500,
              message: `SAP invoice creation failed: ${err.message}`,
            });
            return;
          }
        } else {
          // Send email to the next approver level
          const nextApprovalLevel = result ? result.ApprovalLevel + 1 : 1;
          if (nextApprovalLevel <= maxApproverLevel) {
            const currentApprover = await approvalHierarchyCollection.findOne({
              APPROVER_LEVEL: nextApprovalLevel,
              APPR_TYPE: "FIC",
              COMPANY_CODE,
            });
            if (currentApprover) {
              await FICApprovalNo.updateOne(
                { REQUEST_NO: RNumber },
                { $set: { ApprovalLevel: nextApprovalLevel } }
              );

              await VimRequestInfoData.updateOne(
                { REQUEST_NO: RNumber },
                {
                  $set: {
                    APPROVER_ROLE: currentApprover.USER_ROLE,
                    APPROVER_LEVEL: nextApprovalLevel,
                    CURRENT_ASSIGNEE: currentApprover.USER_ID,
                    MAX_APPROVER_LEVEL: maxApproverLevel,
                    Status: `In-process ${currentApprover.USER_ROLE}`,
                  },
                }
              );

              await ZAISP_VIM_PO_HEAD.updateOne(
                { Ebeln: Ebeln, Vbeln: Vbeln },
                { $set: { Status: `In-process ${currentApprover.USER_ROLE}` } }
              );

              const emailSubject = `Action Required: Approval Pending for VIM Request ${RNumber}`;
              const emailBody = emailTemplates.ApproverMailBody(
                currentApprover.USER_ID,
                Ebeln,
                Vbeln,
                TotalAmount
              );

              await lib_email.sendEmail(
                currentApprover.USER_ID,
                "vaibhavdesai510@gmail.com",
                "html",
                emailSubject,
                emailBody
              );

              return `Request ${RNumber} approval process continued to the next level, next approver user ID: ${currentApprover.USER_ID}.`;
            }
          }
        }
      } catch (error) {
        var iErrorCode = error.code ?? 500;
        req.error({
          code: iErrorCode,
          message: error.message ? error.message : error,
        });
      } finally {
        // await //client.close();
      }
    } else if (action === "REJECT") {
      const { client, database } = await getConnection();
      const RNumber = req.data.REQUEST_NO;
      const REJECTED_COMMENT = req.data.Vimhead?.[0]?.REJECTED_COMMENT;
      const attachmentId = req.data.Attachment?.[0]?.ATTACHMENT_ID;

      try {
        const VimRequestInfoData = database.collection("VIM_HEAD_DATA");
        const ZAISP_VIM_PO_HEAD = database.collection("ZP_AISP_POVIM_HEAD");
        const VIMAttachment = database.collection("ATTACHMENTS_VIM_DOC");
        const FICAPPROVALNO = database.collection("FICApprovalNo");
        const VimHeadData = await VimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });
        const { APPROVER_LEVEL, APPROVER_ROLE, CURRENT_ASSIGNEE } = VimHeadData;

        // Update the status to "Rejected" (status 3)
        await VimRequestInfoData.updateOne(
          { REQUEST_NO: RNumber },
          {
            $set: {
              STATUS: 3,
              LAST_UPDATED_ON: new Date(),
              Status: "REJECTED",
            },
          }
        );

        await database.collection("VIM_APPROVAL_LOGS").insertOne({
          REQUEST_NO: RNumber,
          APPROVAL_LEVEL: APPROVER_LEVEL,
          APPROVER_ID: CURRENT_ASSIGNEE,
          APPROVER_ROLE: APPROVER_ROLE,
          ACTION: "REJECT",
          COMMENT: REJECTED_COMMENT,
          TIMESTAMP: new Date(),
        });

        await VIMAttachment.updateOne(
          { ATTACHMENT_ID: attachmentId },
          { $set: { STATUS: "Rejected", COMMENT: REJECTED_COMMENT } }
        );

        await FICAPPROVALNO.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { ApprovalLevel: 0 } }
        );
        // Find the request information
        const requestInfo = await VimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });
        const { Ebeln, Vbeln, TotalAmount } = requestInfo;

        // Update the status in ZP_AISP_POVIM_HEAD to "Rejected"
        await ZAISP_VIM_PO_HEAD.updateOne(
          { Ebeln: Ebeln, Vbeln: Vbeln },
          {
            $set: {
              Status: `Invoice Rejected`,
              REQUEST_NO: RNumber,
              REJECTED_COMMENT: REJECTED_COMMENT,
            },
          }
        );

        // Send rejection email to the requester
        const emailSubject = `VIM Request Rejected`;
        const emailBody = emailTemplates.RejectedInvoiceMail(
          Ebeln,
          Vbeln,
          TotalAmount
        );

        await lib_email.sendEmail(
          "vaibhavdesai510@gmailcom",
          "vaibhavdesai510@gmailcom", // CC to the admin or responsible person
          "html",
          emailSubject,
          emailBody
        );

        return `VIM Request ${RNumber} has been rejected successfully.`;
      } catch (error) {
        var iErrorCode = error.code ?? 500;
        req.error({
          code: iErrorCode,
          message: error.message ? error.message : error,
        });
      }
    } else if (action === "EDIT_RESUBMIT") {
      const { client, database } = await getConnection();
      const RNumber = req.data.REQUEST_NO; // The REQUEST_NO is passed to identify which request to edit and resubmit
      const { Vimhead, Vimitem, Attachment } = req.data; // Extract Vimhead, Vimitem, and Attachment

      try {
        const VimRequestInfoData = database.collection("VIM_HEAD_DATA");
        const ZAISP_VIM_PO_HEAD = database.collection("ZP_AISP_POVIM_HEAD");
        const VIMAttachment = database.collection("ATTACHMENTS_VIM_DOC");
        const FICAPPROVALNO = database.collection("FICApprovalNo");

        // Fetch the first approver for the company code
        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "FIC",
            APPROVER_LEVEL: 1,
          });

          if (!approver)
            throw new Error(
              `No Approver found for COMPANY_CODE: ${companyCode}.`
            );
          return {
            CURRENT_ASSIGNEE: approver.USER_ID,
            APPROVER_ROLE: approver.USER_ROLE,
          };
        };

        const approvalHierarchyCollection = database.collection(
          "APPROVAL_HIERARCHY_FE"
        );
        const requestInfo = await VimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });
        const { COMPANY_CODE, Ebeln, Vbeln, TotalAmount } = requestInfo;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);

        // Step 1: Update the fields in the VIM_HEAD_DATA collection (e.g., Vimhead)
        if (Vimhead) {
          await VimRequestInfoData.updateOne(
            { REQUEST_NO: RNumber },
            {
              $set: {
                ...Vimhead[0], // Update the fields in Vimhead
                ASNamount: safeDecimal(Vimhead[0].ASNamount),
                Zbd1t: safeDecimal(Vimhead[0].Zbd1t),
                Zbd2t: safeDecimal(Vimhead[0].Zbd2t),
                Zbd3t: safeDecimal(Vimhead[0].Zbd3t),
                Zbd1p: safeDecimal(Vimhead[0].Zbd1p),
                Zbd2p: safeDecimal(Vimhead[0].Zbd2p),
                LAST_UPDATED_ON: new Date(),
                STATUS: 4, // Set status to In Progress
                APPROVER_ROLE: approverDetails.APPROVER_ROLE,
                APPROVER_LEVEL: 1,
                CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
                Status: `In-process ${approverDetails.APPROVER_ROLE}`,
              },
            }
          );
        }

        await database.collection("VIM_APPROVAL_LOGS").insertOne({
          REQUEST_NO: RNumber,
          APPROVAL_LEVEL: 0,
          APPROVER_ID: "vendorupdated@gamil.com",
          APPROVER_ROLE: "VENDOR",
          ACTION: "RE_SUBMIT",
          COMMENT: "Resubmitted and send for approval",
          TIMESTAMP: new Date(),
        });

        // Step 2: Update Vim item data (e.g., Vimitem)
        if (Vimitem && Array.isArray(Vimitem) && Vimitem.length > 0) {
          await updateData(client, database, "VIM_ITEM_DATA", Vimitem, RNumber); // Use the existing function to update item data
        }

        // Step 3: Handle new or updated attachments
        if (Attachment && Array.isArray(Attachment) && Attachment.length > 0) {
          await handleAttachments(
            Attachment,
            "ATTACHMENTS_VIM_DOC",
            RNumber,
            database
          );
        }

        await FICAPPROVALNO.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { ApprovalLevel: 1 } }
        );

        const ebeln = String(Ebeln).trim();
        const vbeln = String(Vbeln).trim();
        await ZAISP_VIM_PO_HEAD.updateOne(
          { Ebeln: ebeln, Vbeln: vbeln }, // Match based on PO and Inbound Delivery
          {
            $set: {
              Status: `In-process ${approverDetails.APPROVER_ROLE}`,
              REQUEST_NO: RNumber,
            },
          } // Update status or other relevant fields
        );

        // Step 5: Send an email notification to the approver
        const emailSubject = `Action Required: Approval Pending for VIM Request ${RNumber} (Edited and Resubmitted)`;
        const emailBody = emailTemplates.ApproverMailBody(
          approverDetails.CURRENT_ASSIGNEE,
          Ebeln,
          Vbeln,
          TotalAmount
        );

        await lib_email.sendEmail(
          approverDetails.CURRENT_ASSIGNEE,
          "vaibhavdesai510@gmail.com", // CC to the admin or responsible person
          "html",
          emailSubject,
          emailBody
        );

        return `VIM Request ${RNumber} has been successfully edited and resubmitted for approval.`;
      } catch (error) {
        var iErrorCode = error.code ?? 500;
        req.error({
          code: iErrorCode,
          message: error.message ? error.message : error,
        });
      }
    }
  });
};

function convertSAPDate(sapDate) {
  // Ensure sapDate is not null or undefined before calling match()
  if (!sapDate) {
    return null; // Or handle this case as per your requirement
  }

  const match = sapDate.match(/\/Date\((\d+)\)\//);
  if (match && match[1]) {
    const timestamp = parseInt(match[1], 10);
    return new Date(timestamp);
  }

  return null; // If the match fails, return null or handle it as needed
}

cron.schedule("*/15 * * * *", async () => {
  try {
    // Fetch and store data from ZP_AISP_POVIM_HEAD with pagination
    await fetchAndStoreHeadData();
    await fetchAndStoreItemData();
  } catch (error) {
    console.error("[ERROR] Cron job failed:", error.message);
  }
});

// General function to fetch and store data for ZP_AISP_POVIM_HEAD
async function fetchAndStoreHeadData() {
  let skip = 0;
  const limit = 100; // Adjust this according to the API limit
  let moreData = true;
  let page = 1;

  while (moreData) {
    // Fetch data with pagination
    const data = await fetchDataWithPagination(skip, limit);

    if (data.length > 0) {
      // Store data in MongoDB
      await storeHeadData(data);
      skip += limit; // Move to the next page
      page++;
    } else {
      moreData = false; // No more data, stop fetching
    }
  }
}

async function fetchAndStoreItemData() {
  let skip = 0;
  const limit = 500000; // Adjust this according to the API limit
  let moreData = true;
  let page = 1;

  while (moreData) {
    // Fetch data with pagination
    const data = await fetchDataWithPaginationforItem(skip, limit);

    if (data.length > 0) {
      // Store data in MongoDB
      await storeItemData(data);
      skip += limit; // Move to the next page
      page++;
    } else {
      moreData = false; // No more data, stop fetching
    }
  }
}

// Function to fetch data with pagination for ZP_AISP_POVIM_HEAD
async function fetchDataWithPagination(skip, top) {
  try {
    const db = await cds.connect.to("ZP_AISP_POVIM_HEAD_BND");

    // Query with OData pagination (skip and top are handled by OData)
    const query = `ZP_AISP_POVIM_HEAD?$skip=${skip}&$top=${top}`;

    // Fetch data using the OData query
    const data = await db.run(query);

    if (!data || data.length === 0) {
      console.log("[INFO] No more ZP_AISP_POVIM_HEAD records found.");
      return [];
    }

    return data;
  } catch (error) {
    console.error(
      "[ERROR] Failed to fetch ZP_AISP_POVIM_HEAD data:",
      error.message
    );
    return [];
  }
}

async function fetchDataWithPaginationforItem(skip, top) {
  try {
    const db = await cds.connect.to("ZP_AISP_POVIM_HEAD_BND");

    // Query with OData pagination (skip and top are handled by OData)
    const query = `ZP_AISP_POVIM_ITEM?$skip=${skip}&$top=${top}`;

    // Fetch data using the OData query
    const data = await db.run(query);

    if (!data || data.length === 0) {
      console.log("[INFO] No more ZP_AISP_POVIM_ITEM records found.");
      return [];
    }

    return data;
  } catch (error) {
    console.error(
      "[ERROR] Failed to fetch ZP_AISP_POVIM_ITEM data:",
      error.message
    );
    return [];
  }
}

async function storeHeadData(data) {
  const { client, database } = await getConnection();
  const collectionHead = database.collection("ZP_AISP_POVIM_HEAD");

  const bulkOps = [];
  const currentTimestamp = new Date();

  for (const head of data) {
    // Normalize and trim fields
    const ebeln = String(head.Ebeln || head.EBELN).trim();
    const vbeln = String(head.vbeln || head.Vbeln).trim();
    const invoicenumber = head.Invoicenumber?.trim() || null;
    const deleteMc = Boolean(head.Delete_mc);
    const updateMc = Boolean(head.Update_mc);
    const toPovimitmOc = Boolean(head.to_povimitm_oc);
    const kufix = Boolean(head.Kufix);
    const autlf = Boolean(head.Autlf);
    const weakt = Boolean(head.Weakt);
    const asnAmount = head.ASNamount ? new Decimal128(head.ASNamount) : null;
    const zbd1t = head.Zbd1t ? new Decimal128(head.Zbd1t) : null;
    const zbd2t = head.Zbd2t ? new Decimal128(head.Zbd2t) : null;
    const zbd3t = head.Zbd3t ? new Decimal128(head.Zbd3t) : null;
    const zbd1p = head.Zbd1p ? new Decimal128(head.Zbd1p) : null;
    const zbd2p = head.Zbd2p ? new Decimal128(head.Zbd2p) : null;
    const bedat = convertSAPDate(head.Bedat);
    const aedat = convertSAPDate(head.Aedat);
    const lastChangeDatetime = convertSAPDate(head.Lastchangedatetime);
    const asndate = convertSAPDate(head.asndate);
    const bnddt = convertSAPDate(head.Bnddt);
    const gwldt = convertSAPDate(head.Gwldt);
    const ihran = convertSAPDate(head.Ihran);

    // Construct the record to be inserted or updated
    const headRecord = {
      ...head,
      Ebeln: ebeln,
      Vbeln: vbeln,
      Invoicenumber: invoicenumber,
      Delete_mc: deleteMc,
      Update_mc: updateMc,
      to_povimitm_oc: toPovimitmOc,
      Kufix: kufix,
      Autlf: autlf,
      Weakt: weakt,
      ASNamount: asnAmount,
      Zbd1t: zbd1t,
      Zbd2t: zbd2t,
      Zbd3t: zbd3t,
      Zbd1p: zbd1p,
      Zbd2p: zbd2p,
      Bedat: bedat,
      Aedat: aedat,
      Lastchangedatetime: lastChangeDatetime,
      asndate: asndate,
      Bnddt: bnddt,
      Gwldt: gwldt,
      Ihran: ihran,
      LAST_SYNCED_FROM_ODATA: currentTimestamp,
    };

    // Check if the record already exists in MongoDB
    const exists = await collectionHead.findOne({ Ebeln: ebeln, Vbeln: vbeln });

    if (!exists) {
      // If record doesn't exist, push it for insertion or update
      bulkOps.push({
        updateOne: {
          filter: { Ebeln: ebeln, Vbeln: vbeln },
          update: { $set: headRecord },
          upsert: true, // Insert if the record doesn't exist, update if it does
        },
      });
    } else {
      // console.log(
      //   `[INFO] Record already exists for Ebeln: ${ebeln}, Vbeln: ${vbeln}`
      // );
    }
  }

  if (bulkOps.length > 0) {
    try {
      // Bulk write to MongoDB
      await collectionHead.bulkWrite(bulkOps);
      console.log(`[INFO] Successfully stored ${bulkOps.length} HEAD records.`);
    } catch (error) {
      console.error("[ERROR] Failed to insert HEAD data:", error.message);
    }
  } else {
    console.log("[INFO] No new HEAD records to insert.");
  }
}

async function storeItemData(data) {
  const { client, database } = await getConnection();
  const collectionItem = database.collection("ZP_AISP_POVIM_ITEM");

  const bulkOps = [];
  const currentTimestamp = new Date();

  for (const item of data) {
    // Ensure Ebeln, Vbeln, and Ebelp are trimmed and in the correct format
    const ebeln = String(item.Ebeln || "").trim();
    const vbeln = String(item.Vbeln || "").trim(); // Use vbeln in lowercase as per your specification
    const ebelp = String(item.Ebelp || "").trim(); // Item Number for each purchasing document
    const Eindt = convertSAPDate(item.Eindt);
    const Erdat = convertSAPDate(item.Erdat);
    const menge = item.menge ? new Decimal128(item.menge) : null;
    const asnqty = item.Asnqty ? new Decimal128(item.Asnqty) : null;
    const ASNitamount = item.ASNitamount
      ? new Decimal128(item.ASNitamount)
      : null;
    const GRNitamount = item.GRNitamount
      ? new Decimal128(item.GRNitamount)
      : null;
    const Taxper = item.Taxper ? new Decimal128(item.Taxper) : null;
    const Taxval = item.Taxval ? new Decimal128(item.Taxval) : null;
    const Total = item.Total ? new Decimal128(item.Total) : null;
    const Mahnz = item.Mahnz ? new Decimal128(item.Mahnz) : null;

    // Record to be inserted or updated
    const itemRecord = {
      ...item,
      Ebeln: ebeln,
      Vbeln: vbeln,
      Ebelp: ebelp,
      Eindt,
      Erdat,
      menge,
      Asnqty: asnqty,
      ASNitamount,
      GRNitamount,
      Taxper,
      Taxval,
      Total,
      Mahnz,
      LAST_SYNCED_FROM_ODATA: currentTimestamp,
    };

    // Check if record already exists in MongoDB
    const exists = await collectionItem.findOne({
      Ebeln: ebeln,
      Vbeln: vbeln,
      Ebelp: ebelp,
    });

    if (!exists) {
      // Only push to bulk operation if the record doesn't exist
      bulkOps.push({
        updateOne: {
          filter: { Ebeln: ebeln, Vbeln: vbeln, Ebelp: ebelp },
          update: { $set: itemRecord },
          upsert: true, // Insert if not exists, else update
        },
      });
    } else {
      // console.log(
      //   `[INFO] Record already exists for Ebeln: ${ebeln}, Vbeln: ${vbeln}, Ebelp: ${ebelp}`
      // );
    }
  }

  if (bulkOps.length > 0) {
    try {
      await collectionItem.bulkWrite(bulkOps);
    } catch (error) {
      console.error("[ERROR] Failed to insert ITEM data:", error.message);
    }
  } else {
    console.log("[INFO] No new ITEM records to insert.");
  }
}

//---------------------------
async function insertData(
  client,
  database,
  collectionName,
  dataArray,
  REQUEST_NO
) {
  await createCollectionIfNotExists(database, collectionName);
  const collection = database.collection(collectionName);

  for (const data of dataArray) {
    try {
      const document = {
        REQUEST_NO,
        ...data,
      };

      const result = await collection.insertOne(document);

      // Check result and log success/failure details
      if (result.acknowledged && result.insertedId) {
        console.log(
          `Successfully inserted document into ${collectionName}:`,
          result
        );
      } else {
        console.error(
          `Failed to insert document into ${collectionName}:`,
          result
        );
        throw new Error(`Failed to insert document into ${collectionName}`);
      }
    } catch (error) {
      console.error(`Error inserting document into ${collectionName}:`, error);
      // Rethrow the error to handle it in the service function
      throw error;
    }
  }
}

async function handleAttachments(
  attachments,
  collectionName,
  REQUEST_NO,
  database
) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    console.log("No attachments to process.");
    return;
  }

  const collection = database.collection(collectionName);
  const attachmentDataArray = [];

  // Process all attachments in parallel
  const uploadPromises = attachments.map(async (attachment, index) => {
    try {
      const { IMAGEURL, IMAGE_FILE_NAME, ...otherFields } = attachment;

      if (!IMAGEURL || !IMAGE_FILE_NAME) {
        throw new Error(
          `Attachment at index ${index} is missing IMAGEURL or IMAGE_FILE_NAME.`
        );
      }

      const azureImageUrl = await uploadImageToAzure(
        REQUEST_NO,
        IMAGEURL,
        IMAGE_FILE_NAME
      );

      const uniqueId = uuidv4();
      // If BASE64DATA is intended to store the Azure URL, consider renaming it for clarity
      const attachmentData = {
        ...otherFields,
        IMAGE_FILE_NAME,
        IMAGEURL: azureImageUrl,
        REQUEST_NO,
        STATUS: "Pending",
        ATTACHMENT_ID: uniqueId,
      };

      attachmentDataArray.push(attachmentData);
    } catch (error) {
      console.error(`Error processing attachment at index ${index}:`, error);
    }
  });

  // Wait for all uploads to finish
  await Promise.all(uploadPromises);

  if (attachmentDataArray.length > 0) {
    try {
      const result = await collection.insertMany(attachmentDataArray);
      console.log(`${result.insertedCount} attachments inserted successfully.`);
    } catch (dbError) {
      console.error("Error inserting attachments into the database:", dbError);
    }
  } else {
    console.log("No valid attachments to insert into the database.");
  }
}

const isBase64 = (str) => {
  // If it doesn't start with "http://" or "https://", assume it's Base64.
  return !(str.startsWith("http://") || str.startsWith("https://"));
};

async function updateData(
  client,
  database,
  collectionName,
  dataArray,
  REQUESTNO
) {
  const collection = database.collection(collectionName);
  for (const data of dataArray) {
    const { REQUEST_NO, ...updateFields } = data; // Assuming each data object has an _id field for update
    await collection.updateOne(
      { REQUEST_NO: REQUESTNO }, // Update condition
      { $set: updateFields } // Set new fields
    );
  }
}

async function createCollectionIfNotExists(database, collectionName) {
  const collections = await database
    .listCollections({ name: collectionName })
    .toArray();
  if (collections.length === 0) {
    await database.createCollection(collectionName);
    console.log(`Collection ${collectionName} created.`);
  } else {
    console.log(`Collection ${collectionName} already exists.`);
  }
}
