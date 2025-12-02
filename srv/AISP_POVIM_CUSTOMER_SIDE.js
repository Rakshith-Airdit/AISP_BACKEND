const cds = require("@sap/cds");
const cron = require("node-cron");
const fileType = require("file-type");
const { v4: uuidv4 } = require("uuid");
const { getConnection } = require("./Library/DBConn");
const { GetNextNumber } = require("./Library/Utility");
const lib_email = require("./Library/Email");
const emailTemplates = require("./Library/EmailTemplate");
const { BlobServiceClient } = require("@azure/storage-blob");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { sendPostPayloadToSAPforCreateVim } = require("./Library/sapBatchUtils");
const { status } = require("express/lib/response");
const { log } = require("console");
const { mongoRead } = require("../srv/Library/helper");
const {
  sendPostPayloadToSAPforCreateVimWithOutOCR,
} = require("./Library/VIM_WITH_OCR");
const { Decimal128 } = require("mongodb");

const connectionString = process.env.AZURE_STORAGE_CONTAINER_STRING;
const containerName = process.env.AZURE_STORAGE_CONNECTION_NAME;

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
  srv.on("PostVimData", async (req) => {
    const { action, Vimhead, Vimitem, Attachment } = req.data;

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
          Zbd1t: new Decimal128(Vimhead[0].Zbd1t),
          Zbd2t: new Decimal128(Vimhead[0].Zbd2t),
          Zbd3t: new Decimal128(Vimhead[0].Zbd3t),
          Zbd1p: new Decimal128(Vimhead[0].Zbd1p),
          Zbd2p: new Decimal128(Vimhead[0].Zbd2p),
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
                menge: new Decimal128(data.menge),
                Asnqty: new Decimal128(data.Asnqty),
                ASNitamount: new Decimal128(data.ASNitamount),
                GRNitamount: new Decimal128(data.GRNitamount),
                Taxper: new Decimal128(data.Taxper),
                Taxval: new Decimal128(data.Taxval),
                Total: new Decimal128(data.Total),
                Mahnz: new Decimal128(data.Mahnz),
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
            "zuheb@airditsoftware.com", // CC recipient
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

      if (!APPROVED_COMMENT || APPROVED_COMMENT.trim() === "") {
        return req.error(400, "Approval comment is required.");
      }

      try {
        const VimRequestInfoData = database.collection("VIM_HEAD_DATA");
        const ZAISP_VIM_PO_HEAD = database.collection("ZP_AISP_POVIM_HEAD");

        await VimRequestInfoData.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { STATUS: 4, LAST_UPDATED_ON: new Date() } }
        );

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
          try {
            const { supplierInvoiceRefNo, error } =
              await sendPostPayloadToSAPforCreateVimWithOutOCR(RNumber);

            if (error) {
              // throw new{ error: `SAP invoice creation failed: ${error}` };
              throw new Error(`SAP invoice creation failed: ${error}`);
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
                    supplierInvoiceRefNo: supplierInvoiceRefNo,
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

              return `Invoice created with Invoice No : ${supplierInvoiceRefNo}`;
            }
          } catch (err) {
            var iErrorCode = err.code ?? 500;
            req.error({
              code: iErrorCode,
              message: err.message ? err.message : err,
            });
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
                "zuheb@airditsoftware.com",
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
                ASNamount: new Decimal128(Vimhead[0].ASNamount),
                Zbd1t: new Decimal128(Vimhead[0].Zbd1t),
                Zbd2t: new Decimal128(Vimhead[0].Zbd2t),
                Zbd3t: new Decimal128(Vimhead[0].Zbd3t),
                Zbd1p: new Decimal128(Vimhead[0].Zbd1p),
                Zbd2p: new Decimal128(Vimhead[0].Zbd2p),
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
          "zuheb@airditsoftware.com", // CC to the admin or responsible person
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

  srv.on("GET", "VIMAttachment", async (req) => {
    try {
      const { database } = await getConnection();

      const data = await mongoRead("ATTACHMENTS_VIM_DOC", req, []);

      if (!data) {
        return req.error({
          code: 404,
          message: `No Attachment found!!`,
        });
      }

      return data;
    } catch (err) {
      console.error("Error reading data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("GET", "VIM_APPROVAL_LOGS", async (req) => {
    const { client, database } = await getConnection();

    try {
      const data = await mongoRead("VIM_APPROVAL_LOGS", req, []);

      if (!data) {
        return req.error({
          code: 404,
          message: `No Logs found!!`,
        });
      }

      return data;
    } catch (err) {
      console.error("Error reading data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  //Main entity to get All association Data by passing Request no
  srv.on("GET", "VIMDATA", async (req) => {
    const { client, database } = await getConnection();

    try {
      const povimHeaderData = await mongoRead("VIM_HEAD_DATA", req, [
        { VIMPOItem: "VIM_ITEM_DATA" },
        { VIMAttachment: "ATTACHMENTS_VIM_DOC" },
      ]);

      if (!povimHeaderData) {
        return req.error({
          code: 404,
          message: `No PovimHeader found!!`,
        });
      }

      return povimHeaderData;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  //Pending Tab
  srv.on("GET", "VIMPOHead", async (req) => {
    const { client, database } = await getConnection();

    try {
      const data = await mongoRead("VIM_HEAD_DATA", req, []);

      if (!data) {
        return req.error({
          code: 404,
          message: `No PovimHeader found!!`,
        });
      }

      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    } finally {
      // Do not close client if using pooled connection
      // await client.close();
    }
  });

  //Rejected Tab for approver
  srv.on("GET", "RejectedTab", async (req) => {
    const { client, database } = await getConnection();

    const PovimHeaderCollection = database.collection("VIM_HEAD_DATA");

    try {
      const rejectedData = await mongoRead("VIM_HEAD_DATA", req, []);

      if (!rejectedData) {
        return req.error({
          code: 404,
          message: `No Data found!!`,
        });
      }

      return rejectedData;
    } catch (err) {
      console.error("Error reading data:", err);
      req.error({ code: 500, message: err.message });
    } finally {
      // client.close(); // Optional: if you're handling DB pool manually
    }
  });

  //ApprovedTab Tab for approver
  srv.on("GET", "ApprovedTab", async (req) => {
    const { client, database } = await getConnection();
    const PovimHeaderCollection = database.collection("VIM_HEAD_DATA");
    try {
      const data = await mongoRead("VIM_HEAD_DATA", req, []);

      if (!data) {
        return req.error({
          code: 404,
          message: `No Data found!!`,
        });
      }

      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    } finally {
      // client.close(); // Optional: if you're handling DB pool manually
    }
  });

  //Function to insert fields-data into Database
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
            result.insertedId
          );
        } else {
          console.error(
            `Failed to insert document into ${collectionName}:`,
            result
          );
          throw new Error(`Failed to insert document into ${collectionName}`);
        }
      } catch (error) {
        console.error(
          `Error inserting document into ${collectionName}:`,
          error
        );
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
        // Optionally, you can collect errors to handle them after all uploads
      }
    });

    // Wait for all uploads to finish
    await Promise.all(uploadPromises);

    if (attachmentDataArray.length > 0) {
      try {
        const result = await collection.insertMany(attachmentDataArray);
        console.log(
          `${result.insertedCount} attachments inserted successfully.`
        );
      } catch (dbError) {
        console.error(
          "Error inserting attachments into the database:",
          dbError
        );
        // Handle database insertion errors as needed
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
    // console.log(dataArray,'DARAARRAY')
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
};
