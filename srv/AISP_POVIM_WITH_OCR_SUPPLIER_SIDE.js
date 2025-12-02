// const cds = require('@sap/cds');

// module.exports = async (srv) =>
// {
//     // Using CDS API
//     const ZP_AISP_POVIM_OCR_HD_BND = await cds.connect.to("ZP_AISP_POVIM_OCR_HD_BND");
//       srv.on('READ', 'ZP_AISP_POVIM_OCR_itm', req => ZP_AISP_POVIM_OCR_HD_BND.run(req.query));
//       srv.on('READ', 'ZP_AISP_POVIM_OCR_HD', req => ZP_AISP_POVIM_OCR_HD_BND.run(req.query));
//       srv.on('READ', 'SAP__UnitsOfMeasure', req => ZP_AISP_POVIM_OCR_HD_BND.run(req.query));
// }

//Custom Logic
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
const { status } = require("express/lib/response");
const { mongoRead } = require("./Library/helper");
const { Decimal128 } = require("mongodb");

const connectionString = process.env.AZURE_STORAGE_CONTAINER_STRING;
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

// Function to Detect MIME Type from Base64 String
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

function convertSAPDate(sapDate) {
  // Ensure sapDate is not null or undefined before calling match()
  if (!sapDate) {
    return null; // Or handle this case as per your requirement
  }

  // The OData format for dates/timestamps is /Date(timestamp)/
  const match = sapDate.match(/\/Date\((\d+)\)\//);
  if (match && match[1]) {
    const timestamp = parseInt(match[1], 10);
    return new Date(timestamp);
  }

  // If the match fails, return null. Note: This assumes only /Date()/ format for conversion.
  return null;
}

async function fetchAndStorePOOCRHead() {
  const db = await cds.connect.to("ZP_AISP_POVIM_OCR_HD_BND");

  try {
    const { database } = await getConnection();
    const collection = database.collection("VIM_API_PO_OCR_HEADER");

    await collection.createIndex({ Ebeln: 1 }, { unique: true });

    // Fetch all data at once
    const data = await db.run(`ZP_AISP_POVIM_OCR_HD`);

    if (!data || data.length === 0) {
      console.log(`[INFO] No PO OCR HEAD data found.`);
      return;
    }

    const bulkOps = [];

    for (let item of data) {
      const ebeln = String(item.Ebeln).trim();
      const Dpamt = parseInt(item.Dpamt);
      const Dppct = parseInt(item.Dppct);
      const Dpdat = convertSAPDate(item.Dpdat);

      bulkOps.push({
        updateOne: {
          filter: { Ebeln: ebeln },
          update: { $set: { ...item, Ebeln: ebeln, Dpamt, Dppct, Dpdat } },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      try {
        await collection.bulkWrite(bulkOps, { ordered: false });
      } catch (err) {
        console.warn(`⚠️ Bulk insert warning (header):`, err.message);
      }
    } else {
      console.log(`[INFO] No records to upsert.`);
    }
  } catch (err) {
    console.error(`[ERROR] Failed to sync PO OCR HEAD:`, err.message);
  }
}

// ==================
// PO_OCR_ITEM SYNC
// ==================
async function fetchAndStorePOOCRItem() {
  const db = await cds.connect.to("ZP_AISP_POVIM_OCR_HD_BND");

  try {
    const { database } = await getConnection();
    const collection = database.collection("VIM_API_PO_OCR_ITEM");

    await collection.createIndex({ Ebeln: 1, Ebelp: 1 }, { unique: true });

    // Fetch all data at once (no pagination)
    const data = await db.run(`ZP_AISP_POVIM_OCR_itm`);

    if (!data || data.length === 0) {
      console.log(`[INFO] No PO OCR ITEM data found.`);
      return;
    }

    const bulkOps = [];

    for (let item of data) {
      const ebeln = String(item.Ebeln).trim();
      const ebelp = String(item.Ebelp).trim();
      const Menge = new Decimal128(item.Menge);
      const Netpr = new Decimal128(item.Netpr);
      const Netwr = new Decimal128(item.Netwr);
      const GRN_QTY = parseInt(item.GRN_QTY);
      const TOTAL_AMT = new Decimal128(item.TOTAL_AMT);

      bulkOps.push({
        updateOne: {
          filter: { Ebeln: ebeln, Ebelp: ebelp },
          update: {
            $set: {
              ...item,
              Ebeln: ebeln,
              Ebelp: ebelp,
              Menge,
              Netpr,
              Netwr,
              GRN_QTY,
              TOTAL_AMT,
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      try {
        await collection.bulkWrite(bulkOps, { ordered: false });
      } catch (err) {
        console.warn(`⚠️ Bulk insert warning:`, err.message);
      }
    } else {
      console.log(`[INFO] No records to upsert.`);
    }
  } catch (err) {
    console.error(`[ERROR] Failed to sync PO OCR ITEM:`, err.message);
  }
}

module.exports = async (srv) => {
  cron.schedule("*/15 * * * *", async () => {
    await fetchAndStorePOOCRHead();
    await fetchAndStorePOOCRItem();
  });

  srv.on("PostPOVimDatawithOCR", async (req) => {
    const { action, PoVimhead, PoVimitem, Attachment } = req.data;

    if (action === "CREATE") {
      const { client, database } = await getConnection();

      try {
        const {
          COMPANY_CODE,
          INVOICE_NO,
          PO_NUMBER,
          INVOICE_DATE,
          INVOICE_AMOUNT,
        } = PoVimhead[0];

        const existingPO = await database
          .collection("VIM_API_PO_OCR_HEADER")
          .findOne({ Ebeln: PO_NUMBER });

        if (!existingPO) {
          req.error(
            400,
            `PO Number ${PO_NUMBER} not found in the system. Please verify.`
          );
          return;
        }

        // Fetch the approver for the specific company code
        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "FIC_PO_OCR",
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

        const VimRequestInfoDataFoPoBasedInvoice = database.collection(
          "VIM_PO_HEAD_DATA_WITH_OCR"
        );

        let REQUEST_NO;
        let returnMessage;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);
        REQUEST_NO = await GetNextNumber("NVIR");

        const NPoBasedRequestInfo = {
          ...PoVimhead[0],
          INVOICE_AMOUNT: parseFloat(PoVimhead[0].INVOICE_AMOUNT),
          DOWNPAYMENT_AMOUNT: parseFloat(PoVimhead[0].DOWNPAYMENT_AMOUNT),
          REQUEST_NO,
          STATUS: 25, // uploaded by vendor
          LAST_UPDATED_ON: new Date(),
          CREATED_ON: new Date(),
          PROCESS_LEVEL: "FIC",
          APPROVER_ROLE: approverDetails.APPROVER_ROLE,
          REQUESTER_ID: req.user.id,
          APPROVER_LEVEL: 1,
          CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
          STATUS_DESC: `In-Process ${approverDetails.APPROVER_ROLE}`,
          VENDOR_STATUS: "InProgress",
        };

        await database.collection("VIM_PO_APPROVAL_LOGS_WITH_OCR").insertOne({
          REQUEST_NO: REQUEST_NO,
          APPROVAL_LEVEL: 0,
          APPROVER_ID: "vendor@gmail.com",
          APPROVER_ROLE: "VENDOR",
          ACTION: "CREATE",
          COMMENT: "Invoice submitted by vendor for PO based with OCR.",
          TIMESTAMP: new Date(),
        });

        // Insert the new request info into the database
        await Promise.all([
          VimRequestInfoDataFoPoBasedInvoice.insertOne(NPoBasedRequestInfo),
          database
            .collection("FIC_PO_WITH_OCR_ApprovalNo")
            .insertOne({ REQUEST_NO, ApprovalLevel: 1 }),
        ]);

        returnMessage = `Invoice ${INVOICE_NO} submitted successfully , Request sent for Approval`;

        // Insert Vim item data and attachments
        const VIM_PO_ITEM_WITH_OCR_INSERT = PoVimitem?.length
          ? insertData(
              client,
              database,
              "VIM_PO_ITEM_DATA_WITH_OCR",
              PoVimitem.map((data) => ({
                ...data,
                TOTAL_PRICE: parseFloat(item.TOTAL_PRICE),
                INVOICED_PRICE: parseFloat(item.INVOICED_PRICE),
                REQUEST_NO,
              }))
            )
          : Promise.resolve("No Vim item data to insert");

        const VIM_Attachment = Attachment?.length
          ? handleAttachments(
              Attachment,
              "ATTACHMENTS_PO_VIM_WITH_OCR_DOC",
              REQUEST_NO,
              database
            )
          : Promise.resolve("No attachments to insert");

        // Run insert operations in parallel
        await Promise.all([VIM_PO_ITEM_WITH_OCR_INSERT, VIM_Attachment]);

        // =======================
        // Send Email Notification
        // =======================
        const emailSubject = `Action Required: Approval Pending for VIM Po Based Request ${REQUEST_NO}`;
        const emailBody =
          emailTemplates.ApproverMailBodyforPOBasedInvoiceWithOCR(
            approverDetails.CURRENT_ASSIGNEE,
            INVOICE_NO,
            PO_NUMBER,
            INVOICE_DATE,
            INVOICE_AMOUNT
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
      const APPROVED_COMMENT = req.data.PoVimhead?.[0]?.APPROVED_COMMENT;

      if (!APPROVED_COMMENT || APPROVED_COMMENT.trim() === "") {
        return req.error(400, "Approval comment is required.");
      }

      try {
        const VimRequestInfoData = database.collection(
          "VIM_PO_HEAD_DATA_WITH_OCR"
        );
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
        const { COMPANY_CODE, INVOICE_NO, INVOICE_DATE, TOTAL_AMOUNT } =
          requestInfo;
        const maxApproverLevelDoc = await approvalHierarchyCollection
          .find({ APPR_TYPE: "FIC_PO_OCR", COMPANY_CODE })
          .sort({ APPROVER_LEVEL: -1 })
          .limit(1)
          .toArray();
        const maxApproverLevel = maxApproverLevelDoc.length
          ? maxApproverLevelDoc[0].APPROVER_LEVEL
          : 0;

        const FICApprovalNo = database.collection("FIC_PO_WITH_OCR_ApprovalNo");
        const result = await FICApprovalNo.findOne({ REQUEST_NO: RNumber });

        const currentApprovalLevel = result?.ApprovalLevel || 1;

        // ✅ Insert current approver's log before moving to next level
        const currentApproverLog = await approvalHierarchyCollection.findOne({
          APPROVER_LEVEL: currentApprovalLevel,
          APPR_TYPE: "FIC_PO_OCR",
          COMPANY_CODE,
        });

        if (currentApproverLog) {
          await database.collection("VIM_PO_APPROVAL_LOGS_WITH_OCR").insertOne({
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
            const finalApprover = await approvalHierarchyCollection.findOne({
              APPROVER_LEVEL: maxApproverLevel,
              APPR_TYPE: "FIC_PO_OCR",
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
          } catch (err) {
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
              APPR_TYPE: "FIC_PO_OCR",
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
                emailTemplates.ApproverMailBodyforPOBasedInvoiceWithOCR(
                  currentApprover.USER_ID,
                  INVOICE_NO,
                  INVOICE_DATE,
                  TOTAL_AMOUNT
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
      //sedn mail to supplier need to get mail from Supplier Database by passing PO no.
      const { client, database } = await getConnection();
      const RNumber = req.data.REQUEST_NO;
      const REJECTED_COMMENT = req.data.PoVimhead?.[0]?.REJECTED_COMMENT;

      try {
        const VimRequestInfoData = database.collection(
          "VIM_PO_HEAD_DATA_WITH_OCR"
        );
        const FICAPPROVALNO = database.collection("FIC_PO_WITH_OCR_ApprovalNo");
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
          INVOICE_NO,
          INVOICE_AMOUNT,
          COMPANY_CODE,
          SUPPLIER_EMAIL,
        } = VimHeadData;

        await VimRequestInfoData.updateOne(
          { REQUEST_NO: RNumber },
          {
            $set: {
              STATUS: 3,
              LAST_UPDATED_ON: new Date(),
              VENDOR_STATUS: "Rejected",
              STATUS_DESC: "Rejected",
              REJECTED_COMMENT: REJECTED_COMMENT,
            },
          }
        );

        await database.collection("VIM_PO_APPROVAL_LOGS_WITH_OCR").insertOne({
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

        // Send rejection email to the Supplier
        const emailSubject = `VIM-Po Invoice Rejecte Request`;
        const emailBody = emailTemplates.RejectedInvoicePoBasedMailWithOCR(
          RNumber,
          INVOICE_NO,
          INVOICE_AMOUNT
        );

        await lib_email.sendEmail(
          SUPPLIER_EMAIL,
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
      //APPROVEL LVL 1 PEROSN DO OCR EXTRACTIONAND SEND FOR APPROVAL.
      const { client, database } = await getConnection();
      const RNumber = req.data.REQUEST_NO;
      const APPROVED_COMMENT = req.data.PoVimhead?.[0]?.APPROVED_COMMENT;
      // const CURRENT_ASSIGNEE = req.data.PoVimhead?.[0]?.CURRENT_ASSIGNEE;
      // const CURRENT_ASSIGNEE_ROLE = req.data.PoVimhead?.[0]?.CURRENT_ASSIGNEE_ROLE;

      if (!APPROVED_COMMENT || APPROVED_COMMENT.trim() === "") {
        return req.error(400, "Comment is required.");
      }

      const { PoVimhead, PoVimitem } = req.data;

      try {
        const VimRequestInfoDataForPoBasedInvoice = database.collection(
          "VIM_PO_HEAD_DATA_WITH_OCR"
        );

        const FIC_PO_APPROVAL_NO = database.collection(
          "FIC_PO_WITH_OCR_ApprovalNo"
        );

        // Fetch the first approver for the company code
        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "FIC",
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

        const requestInfo = await VimRequestInfoDataForPoBasedInvoice.findOne({
          REQUEST_NO: RNumber,
        });

        const { COMPANY_CODE, INVOICE_NO, INVOICE_DATE } = requestInfo;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);

        // Step 1: Update the fields in the VIM_HEAD_DATA collection (e.g., Vimhead)
        if (PoVimhead) {
          await VimRequestInfoDataForPoBasedInvoice.updateOne(
            { REQUEST_NO: RNumber },
            {
              $set: {
                ...PoVimhead[0], // Update the fields in Vimhead
                INVOICE_AMOUNT: parseFloat(PoVimhead[0].INVOICE_AMOUNT),
                DOWNPAYMENT_AMOUNT: parseFloat(PoVimhead[0].DOWNPAYMENT_AMOUNT),
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

        await database.collection("VIM_PO_APPROVAL_LOGS_WITH_OCR").insertOne({
          REQUEST_NO: RNumber,
          APPROVAL_LEVEL: 1,
          APPROVER_ID: approverDetails.CURRENT_ASSIGNEE,
          APPROVER_ROLE: approverDetails.APPROVER_ROLE,
          ACTION: "EDIT_RESUBMIT",
          COMMENT: APPROVED_COMMENT,
          TIMESTAMP: new Date(),
        });

        // Step 2: Update Vim item data (e.g., Vimitem)
        if (PoVimitem && Array.isArray(PoVimitem) && PoVimitem.length > 0) {
          const itemCollection = database.collection(
            "VIM_PO_ITEM_DATA_WITH_OCR"
          );

          // // 1. Delete old items for the REQUEST_NO
          // await itemCollection.deleteMany({ REQUEST_NO: RNumber });

          // 2. Prepare new items with the correct REQUEST_NO
          const newItems = PoVimitem.map((item) => ({
            ...item,
            TOTAL_PRICE: parseFloat(item.TOTAL_PRICE),
            INVOICED_PRICE: parseFloat(item.INVOICED_PRICE),
            REQUEST_NO: RNumber,
          }));

          // 3. Insert new items
          await itemCollection.insertMany(newItems);
        }

        await FIC_PO_APPROVAL_NO.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { ApprovalLevel: 2 } }
        );

        // Step 5: Send an email notification to the approver
        const emailSubject = `Action Required: Approval Pending for VIM Request ${RNumber} (Edited and Resubmitted)`;
        const emailBody =
          emailTemplates.ApproverMailBodyforPOBasedInvoiceWithOCR(
            approverDetails.CURRENT_ASSIGNEE,
            INVOICE_NO,
            INVOICE_DATE
          );

        await lib_email.sendEmail(
          approverDetails.CURRENT_ASSIGNEE,
          "zuheb@airditsoftware.com", // CC to the admin or responsible person
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
    } else if (action === "EDIT_RESUBMIT_BY_SUPPLIER") {
      //he will change documents here
      const { client, database } = await getConnection();
      const RNumber = req.data.REQUEST_NO;

      const { PoVimhead, PoVimitem } = req.data;

      try {
        const VimRequestInfoDataForPoBasedInvoice = database.collection(
          "VIM_PO_HEAD_DATA_WITH_OCR"
        );
        const FIC_PO_APPROVAL_NO = database.collection(
          "FIC_PO_WITH_OCR_ApprovalNo"
        );

        // Fetch the first approver for the company code
        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "FIC_PO_OCR",
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

        const requestInfo = await VimRequestInfoDataForPoBasedInvoice.findOne({
          REQUEST_NO: RNumber,
        });

        const { COMPANY_CODE, INVOICE_NO, INVOICE_DATE, SUPPLIER_EMAIL } =
          requestInfo;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);

        await VimRequestInfoDataForPoBasedInvoice.updateOne(
          { REQUEST_NO: RNumber },
          {
            $set: {
              ...PoVimhead[0],
              INVOICE_AMOUNT: parseFloat(PoVimhead[0].INVOICE_AMOUNT),
              DOWNPAYMENT_AMOUNT: parseFloat(PoVimhead[0].DOWNPAYMENT_AMOUNT),
              LAST_UPDATED_ON: new Date(),
              STATUS: 4,
              APPROVER_ROLE: approverDetails.APPROVER_ROLE,
              APPROVER_LEVEL: 1,
              CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
              VENDOR_STATUS: "In-Approval",
              STATUS_DESC: `In-process ${approverDetails.APPROVER_ROLE}`,
            },
          }
        );

        await database.collection("VIM_PO_APPROVAL_LOGS_WITH_OCR").insertOne({
          REQUEST_NO: RNumber,
          APPROVAL_LEVEL: 1,
          APPROVER_ID: SUPPLIER_EMAIL,
          APPROVER_ROLE: "Supplier",
          ACTION: "EDIT_RESUBMIT_BY_SUPPLIER",
          COMMENT: "Invoice Resubmitted",
          TIMESTAMP: new Date(),
          LAST_UPDATED_ON: new Date(),
        });

        await UpdateAttachments(
          Attachment,
          "ATTACHMENTS_PO_VIM_WITH_OCR_DOC",
          RNumber,
          database
        );

        await FIC_PO_APPROVAL_NO.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { ApprovalLevel: 1 } }
        );

        // Step 5: Send an email notification to the approver
        const emailSubject = `Action Required: Approval Pending for VIM Request ${RNumber} (Edited and Resubmitted)`;
        const emailBody =
          emailTemplates.ApproverMailBodyforPOBasedInvoiceWithOCR(
            approverDetails.CURRENT_ASSIGNEE,
            INVOICE_NO,
            INVOICE_DATE
          );

        await lib_email.sendEmail(
          approverDetails.CURRENT_ASSIGNEE,
          "zuheb@airditsoftware.com", // CC to the admin or responsible person
          "html",
          emailSubject,
          emailBody
        );

        return `VIM Po Based Request has been successfully edited and sent for approval `;
      } catch (error) {
        var iErrorCode = error.code ?? 500;
        req.error({
          code: iErrorCode,
          message: error.message ? error.message : error,
        });
      }
    }
  });

  srv.on("GET", "VIM_PO_OCR_HEAD", async (req) => {
    const { client, database } = await getConnection();

    const collection = database.collection("VIM_PO_HEAD_DATA_WITH_OCR");
    try {
      const data = await mongoRead("VIM_PO_HEAD_DATA_WITH_OCR", req, [
        { VIM_PO_OCR_ITEM: "VIM_PO_ITEM_DATA_WITH_OCR" },
        { Attachment_PO_VIM_OCR: "ATTACHMENTS_PO_VIM_WITH_OCR_DOC" },
      ]);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  //4&25
  srv.on("READ", "PendingTab", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("VIM_PO_HEAD_DATA_WITH_OCR");
    try {
      const data = await mongoRead("VIM_PO_HEAD_DATA_WITH_OCR", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  //5
  srv.on("READ", "ApprovedTab", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("VIM_PO_HEAD_DATA_WITH_OCR");
    try {
      const data = await mongoRead("VIM_PO_HEAD_DATA_WITH_OCR", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  //3
  srv.on("READ", "RejectedTab", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("VIM_PO_HEAD_DATA_WITH_OCR");
    try {
      const data = await mongoRead("VIM_PO_HEAD_DATA_WITH_OCR", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  //fetching DATA FROM API FOR FIRST LEVEL OF APPROVAL BY PASSING PO NO
  const HEAD_COLL = "VIM_API_PO_OCR_HEADER";
  const ITEM_COLL = "VIM_API_PO_OCR_ITEM";

  srv.on("READ", "VIM_PO_OCR_HEAD_API", async (req) => {
    const { database } = await getConnection();
    const filters = req.query.SELECT.where;

    // Extract PO number from filter
    let poNumber = null;
    if (filters) {
      for (let i = 0; i < filters.length; i++) {
        if (filters[i].ref?.[0] === "Ebeln") {
          poNumber = filters[i + 2]?.val;
          break;
        }
      }
    }

    const headers = poNumber
      ? await database.collection(HEAD_COLL).find({ Ebeln: poNumber }).toArray()
      : await database.collection(HEAD_COLL).find({}).toArray();

    const items = await database
      .collection(ITEM_COLL)
      .find(poNumber ? { Ebeln: poNumber } : {})
      .toArray();

    // Group items by Ebeln
    const groupedItems = {};
    for (const item of items) {
      const { _id, ...cleaned } = item;
      if (!groupedItems[cleaned.Ebeln]) groupedItems[cleaned.Ebeln] = [];
      groupedItems[cleaned.Ebeln].push(cleaned);
    }

    const result = headers.map((header) => {
      const { _id, to_ocritem, ...cleanedHeader } = header;
      return {
        ...cleanedHeader,
        TO_ITEMS: groupedItems[header.Ebeln] || [],
      };
    });

    return result;
  });
};

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
      console.error(`Error inserting document into ${collectionName}:`, error);
      // Rethrow the error to handle it in the service function
      throw error;
    }
  }
}

// Function to insert attachments into Database//NEW
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
      console.log(`${result.insertedCount} attachments inserted successfully.`);
    } catch (dbError) {
      console.error("Error inserting attachments into the database:", dbError);
      // Handle database insertion errors as needed
    }
  } else {
    console.log("No valid attachments to insert into the database.");
  }
}

async function UpdateAttachments(
  attachments,
  collectionName,
  REQUEST_NO,
  database
) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    console.log("No attachments to update.");
    return;
  }

  const newAttachment = attachments[0]; // Only one per REQUEST_NO
  const collection = database.collection(collectionName);

  // 1. Fetch existing record
  const existing = await collection.findOne({ REQUEST_NO });
  if (!existing) {
    console.warn(`No existing attachment found for REQUEST_NO ${REQUEST_NO}`);
    return;
  }

  // 2. Delete old blob from Azure if URL exists
  if (existing.IMAGEURL?.startsWith("https://")) {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = existing.IMAGEURL.split("/").pop();

    try {
      await containerClient.deleteBlob(blobName);
      console.log(`Deleted old blob: ${blobName}`);
    } catch (err) {
      console.warn(`⚠️ Failed to delete blob ${blobName}: ${err.message}`);
    }
  }

  // 3. Upload new base64 image to Azure
  const newAzureUrl = await uploadImageToAzure(
    REQUEST_NO,
    newAttachment.IMAGEURL,
    newAttachment.IMAGE_FILE_NAME
  );

  // 4. Update DB record
  await collection.updateOne(
    { REQUEST_NO },
    {
      $set: {
        IMAGEURL: newAzureUrl,
        IMAGE_FILE_NAME: newAttachment.IMAGE_FILE_NAME,
        DESCRIPTION: newAttachment.DESCRIPTION || "",
        COMMENT: newAttachment.COMMENT || "",
        STATUS: "Pending",
        LAST_UPDATED_ON: new Date(),
      },
    }
  );
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

//If No collection is there it will create new .
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
