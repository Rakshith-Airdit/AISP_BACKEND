const cds = require("@sap/cds");
const cron = require("node-cron");
const fileType = require("file-type");
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const { getConnection } = require("./Library/DBConn");
const { GetNextNumber } = require("./Library/Utility");
const lib_email = require("./Library/Email");
const emailTemplates = require("./Library/EmailTemplate");
const { BlobServiceClient } = require("@azure/storage-blob");
const { sendPostPayloadToSAPforCreateVim } = require("./Library/sapBatchUtils");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { status } = require("express/lib/response");
const res = require("express/lib/response");
const { mongoRead } = require("./Library/helper");
const { Decimal128 } = require("mongodb");

// const connectionString =
//   cds.env.requires.azure_storage?.connectionString;
const connectionString = cds.env.requires.azure_storage?.connectionString;
// const containerName = cds.env.requires.azure_storage?.container_name;
const containerName = cds.env.requires.azure_storage?.container_name;

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
      } else {
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

      const attachmentData = {
        ...otherFields,
        IMAGE_FILE_NAME,
        IMAGEURL: azureImageUrl,
        REQUEST_NO,
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
    } catch (dbError) {
      console.error("Error inserting attachments into the database:", dbError);
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

module.exports = async (srv) => {
  srv.on("PostNPOVimData", async (req) => {
    const { action, NPoVimhead, NPoVimitem, Attachment } = req.data;
    if (action === "CREATE") {
      const { client, database } = await getConnection();

      try {
        const { COMPANY_CODE, INVOICE_NUMBER, TOTAL_AMOUNT, INVOICE_DATE } =
          NPoVimhead[0];

        // Fetch the approver for the specific company code
        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "FIC_NonPo",
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
        const VimRequestInfoDataForNonPoBasedInvoice =
          database.collection("VIM_NPO_HEAD_DATA");

        let REQUEST_NO;
        let returnMessage;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);
        REQUEST_NO = await GetNextNumber("NVIR");

        const NPoBasedRequestInfo = {
          ...NPoVimhead[0],
          TOTAL_AMOUNT: new Decimal128(NPoVimhead[0].TOTAL_AMOUNT),
          REQUEST_NO,
          STATUS: 25, // uploaded by vendor
          LAST_UPDATED_ON: new Date(),
          CREATED_ON: new Date(),
          PROCESS_LEVEL: "FIC_NonPo",
          APPROVER_ROLE: approverDetails.APPROVER_ROLE,
          REQUESTER_ID: req.user.id,
          APPROVER_LEVEL: 1,
          CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
          STATUS_DESC: `In-Process ${approverDetails.APPROVER_ROLE}`,
          VENDOR_STATUS: "Uploaded",
        };

        await database.collection("VIM_NPO_APPROVAL_LOGS").insertOne({
          REQUEST_NO: REQUEST_NO,
          APPROVAL_LEVEL: 0,
          APPROVER_ID: "vendor@gmail.com",
          APPROVER_ROLE: "VENDOR",
          ACTION: "CREATE",
          COMMENT: "Invoice submitted by vendor for Non PO based.",
          TIMESTAMP: new Date(),
        });

        // Insert the new request info into the database
        await Promise.all([
          VimRequestInfoDataForNonPoBasedInvoice.insertOne(NPoBasedRequestInfo),
          database
            .collection("FIC_NPo_ApprovalNo")
            .insertOne({ REQUEST_NO, ApprovalLevel: 1 }),
        ]);

        returnMessage = `Invoice ${INVOICE_NUMBER} submitted successfully , Request sent for Approval`;

        // Insert Vim item data and attachments
        const VIM_NPO_ITEM_INSERT = NPoVimitem?.length
          ? insertData(
              client,
              database,
              "VIM_NPO_ITEM_DATA",
              Vimitem.map((data) => ({
                ...data,
                PRICE: new Decimal128(data.PRICE),
                REQUEST_NO,
              }))
            )
          : Promise.resolve("No Vim item data to insert");

        const VIM_Attachment = Attachment?.length
          ? handleAttachments(
              Attachment,
              "ATTACHMENTS_NPO_VIM_DOC",
              REQUEST_NO,
              database
            )
          : Promise.resolve("No attachments to insert");

        // Run insert operations in parallel
        await Promise.all([VIM_NPO_ITEM_INSERT, VIM_Attachment]);

        // =======================
        // Send Email Notification
        // =======================
        const emailSubject = `Action Required: Approval Pending for VIM Non-Po Based Request ${REQUEST_NO}`;
        const emailBody = emailTemplates.ApproverMailBodyforNPOBasedInvoice(
          approverDetails.CURRENT_ASSIGNEE,
          INVOICE_NUMBER,
          INVOICE_DATE,
          TOTAL_AMOUNT
        );

        // Send email to approver
        await lib_email
          .sendEmail(
            approverDetails.CURRENT_ASSIGNEE,
            "vaibhavdesai220@gmail.com", // CC recipient
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
      const APPROVED_COMMENT = req.data.NPoVimhead?.[0]?.APPROVED_COMMENT;

      if (!APPROVED_COMMENT || APPROVED_COMMENT.trim() === "") {
        return req.error(400, "Approval comment is required.");
      }

      try {
        const VimRequestInfoData = database.collection("VIM_NPO_HEAD_DATA");
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
        const { COMPANY_CODE, INVOICE_NUMBER, INVOICE_DATE, TOTAL_AMOUNT } =
          requestInfo;
        const maxApproverLevelDoc = await approvalHierarchyCollection
          .find({ APPR_TYPE: "FIC_NonPo", COMPANY_CODE })
          .sort({ APPROVER_LEVEL: -1 })
          .limit(1)
          .toArray();
        const maxApproverLevel = maxApproverLevelDoc.length
          ? maxApproverLevelDoc[0].APPROVER_LEVEL
          : 0;

        const FICApprovalNo = database.collection("FIC_NPo_ApprovalNo");
        const result = await FICApprovalNo.findOne({ REQUEST_NO: RNumber });

        const currentApprovalLevel = result?.ApprovalLevel || 1;

        // ✅ Insert current approver's log before moving to next level
        const currentApproverLog = await approvalHierarchyCollection.findOne({
          APPROVER_LEVEL: currentApprovalLevel,
          APPR_TYPE: "FIC_NonPo",
          COMPANY_CODE,
        });

        if (currentApproverLog) {
          await database.collection("VIM_NPO_APPROVAL_LOGS").insertOne({
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
          // ===>  SAP batch trigger FINAL POSTING PENDING
          try {
            const finalApprover = await approvalHierarchyCollection.findOne({
              APPROVER_LEVEL: maxApproverLevel,
              APPR_TYPE: "FIC_NonPo",
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
                    STATUS_DESC: "Approved",
                    VENDOR_STATUS: "Approved",
                    LAST_UPDATED_ON: new Date(),
                    MAX_APPROVER_LEVEL: maxApproverLevel,
                  },
                }
              );
              return `Invoice created and VIM Request ${RNumber} approved successfully.`;
            }
          } catch (senerr) {
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
              APPR_TYPE: "FIC_NonPo",
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
                    STATUS_DESC: `In-process ${currentApprover.USER_ROLE}`,
                  },
                }
              );

              const emailSubject = `Action Required: Approval Pending for VIM Non-PO Based Invoice Request ${RNumber}`;
              const emailBody =
                emailTemplates.ApproverMailBodyforNPOBasedInvoice(
                  currentApprover.USER_ID,
                  INVOICE_NUMBER,
                  INVOICE_DATE,
                  TOTAL_AMOUNT
                );

              await lib_email.sendEmail(
                currentApprover.USER_ID,
                "vaibhavdesai220@gmail.com",
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
      const REJECTED_COMMENT = req.data.NPoVimhead?.[0]?.REJECTED_COMMENT;

      try {
        const VimRequestInfoData = database.collection("VIM_NPO_HEAD_DATA");
        const FICAPPROVALNO = database.collection("FIC_NPO_APPROVAL_NO");
        const approvalHierarchyCollection = database.collection(
          "APPROVAL_HIERARCHY_FE"
        );
        const VimHeadData = await VimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });
        const {
          APPROVER_LEVEL,
          APPROVER_ROLE,
          CURRENT_ASSIGNEE,
          INVOICE_NUMBER,
          TOTAL_AMOUNT,
          COMPANY_CODE,
        } = VimHeadData;

        // Fetch the first approver for the company code
        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "FIC_NonPo",
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

        const approverDetails = await fetchApprover(COMPANY_CODE);
        // Update the status to "Rejected" (status 3)
        await VimRequestInfoData.updateOne(
          { REQUEST_NO: RNumber },
          {
            $set: {
              STATUS: 3,
              LAST_UPDATED_ON: new Date(),
              STATUS_DESC: "Rejected",
              APPROVER_ROLE: approverDetails.APPROVER_ROLE,
              CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
              REJECTED_COMMENT: REJECTED_COMMENT,
            },
          }
        );

        await database.collection("VIM_NPO_APPROVAL_LOGS").insertOne({
          REQUEST_NO: RNumber,
          APPROVAL_LEVEL: APPROVER_LEVEL,
          APPROVER_ID: CURRENT_ASSIGNEE,
          APPROVER_ROLE: APPROVER_ROLE,
          ACTION: "REJECT",
          COMMENT: REJECTED_COMMENT,
          TIMESTAMP: new Date(),
        });

        await FICAPPROVALNO.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { ApprovalLevel: 1 } }
        );

        // Send rejection email to the CODER
        const emailSubject = `VIM-Non Po Invoice Rejecte Request`;
        const emailBody = emailTemplates.RejectedInvoiceNonPoBasedMail(
          RNumber,
          INVOICE_NUMBER,
          TOTAL_AMOUNT
        );

        await lib_email.sendEmail(
          CURRENT_ASSIGNEE,
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
      //CODER WILL DO EDIT AND SUBMIT FOR APPROVAL
      const { client, database } = await getConnection();
      const RNumber = req.data.REQUEST_NO;
      const APPROVED_COMMENT = req.data.NPoVimhead?.[0]?.APPROVED_COMMENT;
      const CURRENT_ASSIGNEE = req.data.NPoVimhead?.[0]?.CURRENT_ASSIGNEE;
      const CURRENT_ASSIGNEE_ROLE =
        req.data.NPoVimhead?.[0]?.CURRENT_ASSIGNEE_ROLE;

      if (!APPROVED_COMMENT || APPROVED_COMMENT.trim() === "") {
        return req.error(400, "Comment is required.");
      }
      const { NPoVimhead, NPoVimitem } = req.data;

      try {
        const VimRequestInfoDataForNonPoBasedInvoice =
          database.collection("VIM_NPO_HEAD_DATA");
        const FIC_NPO_APPROVAL_NO = database.collection("FIC_NPo_ApprovalNo");

        // Fetch the first approver for the company code
        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "FIC_NonPo",
            APPROVER_LEVEL: 2,
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
        const requestInfo =
          await VimRequestInfoDataForNonPoBasedInvoice.findOne({
            REQUEST_NO: RNumber,
          });
        const { COMPANY_CODE, INVOICE_NUMBER, INVOICE_DATE, TOTAL_AMOUNT } =
          requestInfo;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);

        // Step 1: Update the fields in the VIM_HEAD_DATA collection (e.g., Vimhead)
        if (NPoVimhead) {
          await VimRequestInfoDataForNonPoBasedInvoice.updateOne(
            { REQUEST_NO: RNumber },
            {
              $set: {
                ...NPoVimhead[0], // Update the fields in Vimhead
                TOTAL_AMOUNT: new Decimal128(NPoVimhead[0].TOTAL_AMOUNT),
                LAST_UPDATED_ON: new Date(),
                STATUS: 4, // Set status to In Progress
                APPROVER_ROLE: approverDetails.APPROVER_ROLE,
                APPROVER_LEVEL: 2,
                CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
                VENDOR_STATUS: "In-Approval",
                STATUS_DESC: `In-process ${approverDetails.APPROVER_ROLE}`,
              },
            }
          );
        }

        await database.collection("VIM_NPO_APPROVAL_LOGS").insertOne({
          REQUEST_NO: RNumber,
          APPROVAL_LEVEL: 1,
          APPROVER_ID: CURRENT_ASSIGNEE,
          APPROVER_ROLE: CURRENT_ASSIGNEE_ROLE,
          ACTION: "EDIT_RESUBMIT",
          COMMENT: APPROVED_COMMENT,
          TIMESTAMP: new Date(),
        });

        // Step 2: Update npo Vim item data (e.g., Vimitem)
        if (NPoVimitem && Array.isArray(NPoVimitem) && NPoVimitem.length > 0) {
          const itemCollection = database.collection("VIM_NPO_ITEM_DATA");

          // 1. Delete old items for the REQUEST_NO
          await itemCollection.deleteMany({ REQUEST_NO: RNumber });

          // 2. Prepare new items with the correct REQUEST_NO
          const newItems = NPoVimitem.map((item) => ({
            ...item,
            PRICE: new Decimal128(item.PRICE.toString()),
            REQUEST_NO: RNumber,
          }));

          // 3. Insert new items
          await itemCollection.insertMany(newItems);
        }

        await FIC_NPO_APPROVAL_NO.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { ApprovalLevel: 2 } }
        );

        // Step 5: Send an email notification to the approver
        const emailSubject = `Action Required: Approval Pending for VIM Request ${RNumber} (Edited and Resubmitted)`;
        const emailBody = emailTemplates.ApproverMailBodyforNPOBasedInvoice(
          approverDetails.CURRENT_ASSIGNEE,
          INVOICE_NUMBER,
          INVOICE_DATE,
          TOTAL_AMOUNT
        );

        await lib_email.sendEmail(
          approverDetails.CURRENT_ASSIGNEE,
          "vaibhavdesai220@gmail.com", // CC to the admin or responsible person
          "html",
          emailSubject,
          emailBody
        );

        return `VIM-Non Po Based Request ${RNumber} has been successfully submitted , next approval is ${approverDetails.CURRENT_ASSIGNEE}`;
      } catch (error) {
        var iErrorCode = error.code ?? 500;
        req.error({
          code: iErrorCode,
          message: error.message ? error.message : error,
        });
      }
    }
  });

  srv.on("READ", "SupplierNo", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("VIM_NPO_HEAD_DATA");

    try {
      // Fetch distinct SUPPLIER_NUMBER values
      const result = await collection.distinct("SUPPLIER_NUMBER");

      // Ensure each result is returned as an object with the key SUPPLIER_NUMBER
      const formattedResult = result.map((supplierNo) => ({
        SUPPLIER_NUMBER: supplierNo,
      }));

      // Return the result in the correct OData response format
      return formattedResult;
    } catch (err) {
      console.error("Error fetching unique SUPPLIER_NUMBERs:", err);
      req.error(500, err.message || "Error fetching unique supplier numbers");
    }
  });

  srv.on("READ", "SourceType", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("SOURCE_TYPE");
    try {
      const result = await collection.find({}).toArray();
      return result;
    } catch (err) {
      console.error("Error fetching unique SUPPLIER_NUMBERs:", err);
      req.error(500, err.message || "Error fetching unique supplier numbers");
    }
  });

  //For detail view information
  srv.on("READ", "CODERHEAD", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("VIM_NPO_HEAD_DATA");
    try {
      const data = await mongoRead("VIM_NPO_HEAD_DATA", req, [
        { NPoVimItem: "VIM_NPO_ITEM_DATA" },
        { NPoVimAttachments: "ATTACHMENTS_NPO_VIM_DOC" },
      ]);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "NPoVimHead", async (req) => {
    try {
      const data = await mongoRead("VIM_NPO_HEAD_DATA", req, [
        { NPoVimItem: "VIM_NPO_ITEM_DATA" },
        { NPoVimAttachments: "ATTACHMENTS_NPO_VIM_DOC" },
      ]);

      if (!data) {
        return req.error(
          404,
          `No invoice found for filter ${JSON.stringify(filter)}`
        );
      }

      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error(500, err.message || "Error fetching invoice detail");
    }
  });

  srv.on("READ", "RejectedTabForIU", async (req) => {
    const { database } = await getConnection();
    try {
      const data = await mongoRead("VIM_NPO_HEAD_DATA", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  // GET Cost Object Types
  srv.on("READ", "CostObjectTypes", async (req) => {
    const { database } = await getConnection();
    return await database
      .collection("COST_OBJECT_TYPE_NPO")
      .find({}, { projection: { _id: 0 } })
      .toArray();
  });

  srv.on("READ", "CostObjects", async (req) => {
    try {
      const data = await mongoRead("COST_OBJECT_NPO", req, []);

      if (!data) {
        return req.error(
          404,
          `No invoice found for filter ${JSON.stringify(filter)}`
        );
      }

      return data;
    } catch (err) {
      console.error("Error applying TYPE filter: " + err.message);
      req.error(500, "Error applying TYPE filter: " + err.message);
    }
  });

  srv.on("READ", "GL_ACCOUNT", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("GL_ACCOUNT_MASTER_NPO");

    try {
      const result = await collection
        .find({}, { projection: { _id: 0 } })
        .toArray();
      return result;
    } catch (err) {
      req.error(500, err.message || "Error fetching GL Accounts");
    }
  });

  srv.on("triggerOCR", async (req) => {
    const fileUrl = req.data.fileUrl;

    try {
      // 1. Download PDF from Azure Blob (stream)
      const fileStream = await axios.get(fileUrl, { responseType: "stream" });

      // 2. Build multipart/form-data payload
      const form = new FormData();
      form.append("file", fileStream.data, {
        filename: "invoice.pdf",
        contentType: "application/pdf",
      });

      // 3. POST to OCR service
      const ocrResponse = await axios.post(
        "https://airdit-inv.cfapps.ap10.hana.ondemand.com/text/",
        form,
        {
          headers: {
            accept: "application/json",
            "X-Internal-API-Key": "cohFH@B;]`BwPL$T3Jv_|3R=?U|F5tRN",
            ...form.getHeaders(),
          },
        }
      );

      const ocrData = ocrResponse.data;
      console.log(ocrData, "data coming from airdit-inv service");

      // 4. Extract invoiceDetails
      const invoiceDetails = ocrData?.invoiceDetails;

      if (!invoiceDetails) {
        return {
          totalInvoiceAmount: "",
          igst: "",
          cgst: "",
          sgst: "",
          other: "",
          items: [],
          status: "FAILED",
          rawJson: JSON.stringify(ocrData),
        };
      }

      // 5. Direct mapping — only if field exists, else empty string
      return {
        totalInvoiceAmount: invoiceDetails.totalInvoiceAmount ?? "",
        igst: invoiceDetails.igst ?? "", // only if
        cgst: invoiceDetails.cgst ?? "",
        sgst: invoiceDetails.sgst ?? "",
        other: invoiceDetails.other_charges ?? "",
        items: invoiceDetails.items ?? [],
        status: "SUCCESS",
      };
    } catch (error) {
      console.error("OCR Extraction Failed:", error.message);
      console.error("Full error:", error);
      return {
        totalInvoiceAmount: "",
        igst: "",
        cgst: "",
        sgst: "",
        other: "",
        items: [],
        status: "FAILED",
      };
    }
  });

  srv.on("READ", "CostObjects", async (req) => {
    try {
      const data = await mongoRead("ATTACHMENTS_NPO_VIM_DOC", req, []);

      if (!data) {
        return req.error(
          404,
          `No attachments found for filter ${JSON.stringify(filter)}`
        );
      }

      return data;
    } catch (err) {
      console.error("Error fetching attachments:", err);
      req.error(500, err.message || "Error fetching invoice attachments");
    }
  });
};
