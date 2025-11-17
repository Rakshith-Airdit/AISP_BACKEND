// const cds = require('@sap/cds');

// module.exports = async (srv) =>
// {
//     // Using CDS API
//     const ZP_AISP_SESVIM_HEAD_BND = await cds.connect.to("ZP_AISP_SESVIM_HEAD_BND");
//       srv.on('READ', 'ZI_AISP_SESVIM_DETAILS', req => ZP_AISP_SESVIM_HEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_AISP_SESVIM_HEAD', req => ZP_AISP_SESVIM_HEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_AISP_SESVIM_ITEM', req => ZP_AISP_SESVIM_HEAD_BND.run(req.query));
// }

//-----------custom CAP code

const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");
const cron = require("node-cron");
const fileType = require("file-type");
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const { GetNextNumber } = require("./Library/Utility");
const lib_email = require("./Library/Email");
const emailTemplates = require("./Library/EmailTemplate");
const { BlobServiceClient } = require("@azure/storage-blob");
const { sendPostPayloadToSAPforSESVim } = require("./Library/sapBatchUtils");
const { status } = require("express/lib/response");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { parse } = require("tough-cookie");
const { mongoRead } = require("./Library/helper");
const { Decimal128 } = require("mongodb");

const connectionString =
  cds.env.requires.azure_storage?.connectionString;
const containerName = cds.env.requires.azure_storage?.container_name;

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

function toDecimal(value) {
  if (value === null || value === undefined || value === "")
    return Decimal128.fromString("0");
  return Decimal128.fromString(String(value));
}

//new00------------------
cron.schedule("*/5 * * * *", async () => {
  try {
    // Call functions directly without db parameter
    await fetchAndStoreSESHead();
    await fetchAndStoreSESItem();
    await fetchAndStoreSESDetails();
  } catch (error) {
    console.error("[CRON] Error during SES VIM data sync:", error.message);
  }
});

const COLLECTION_HEAD = "SES_VIM_HEAD_API";
const COLLECTION_ITEM = "SES_VIM_ITEM_API";
const COLLECTION_DETAILS = "SES_VIM_DETAILS_API";

// Fetch and Store data from ABAP API - SES Head
async function fetchAndStoreSESHead() {
  let db;
  try {
    // Connect to the database
    db = await cds.connect.to("ZP_AISP_SESVIM_HEAD_BND");

    const { database } = await getConnection();
    const collection = database.collection("SES_VIM_HEAD_API");

    await collection.createIndex({ Ebeln: 1 }, { unique: true });

    const limit = 1000;
    let skip = 0;

    while (true) {
      const page = await db.run(
        `ZP_AISP_SESVIM_HEAD?$top=${limit}&$skip=${skip}`
      );
      if (!page || page.length === 0) break;

      const ops = page.map((item) => {
        // Convert fields as per requirements
        item.Amount = new Decimal128(item.Amount || "0"); // Convert Decimal to Integer
        item.Lastchangedatetime = convertSAPDate(item.Lastchangedatetime); // Convert Date
        item.Bedat = convertSAPDate(item.Bedat); // Convert Date
        item.Dppct = new Decimal128(item.Dppct || "0");
        item.Dpdat = convertSAPDate(item.Dpdat);
        item.Dpamt = new Decimal128(item.Dpamt || "0");
        item.Bedat = convertSAPDate(item.Bedat);
        item.Aedat = convertSAPDate(item.Aedat);

        return {
          updateOne: {
            filter: { Ebeln: String(item.Ebeln).trim() },
            update: { $set: item },
            upsert: true,
          },
        };
      });

      if (ops.length) await collection.bulkWrite(ops, { ordered: false });
      if (page.length < limit) break;
      skip += limit;
    }
  } catch (error) {
    console.error(
      "[ERROR] Failed to fetch and store SES Head data:",
      error.message
    );
  }
}

async function fetchAndStoreSESItem() {
  let db;
  try {
    // Connect to the database
    db = await cds.connect.to("ZP_AISP_SESVIM_HEAD_BND");

    const { database } = await getConnection();
    const collection = database.collection("SES_VIM_ITEM_API");

    await collection.createIndex({ Lblni: 1, Ebeln: 1 }, { unique: true });

    const limit = 1000;
    let skip = 0;

    while (true) {
      const page = await db.run(
        `ZP_AISP_SESVIM_ITEM?$top=${limit}&$skip=${skip}`
      );
      if (!page || page.length === 0) break;

      const ops = page.map((item) => {
        // Convert fields as per requirements
        item.Lwert = new Decimal128(item.Lwert); // Convert Decimal to Integer
        item.Uwert = new Decimal128(item.Uwert); // Convert Decimal to Integer
        item.Unplv = new Decimal128(item.Unplv); // Convert Decimal to Integer
        item.Pwwe = new Decimal128(item.Pwwe); // Convert Decimal to Integer
        item.Pwfr = new Decimal128(item.Pwfr); // Convert Decimal to Integer
        item.Netwr = new Decimal128(item.Netwr); // Convert Decimal to Integer
        item.Lzvon = convertSAPDate(item.Lzvon); // Convert Date
        item.Lzbis = convertSAPDate(item.Lzbis); // Convert Date
        item.Bldat = convertSAPDate(item.Bldat); // Convert Date
        item.Budat = convertSAPDate(item.Budat); // Convert Date
        item.Aedat = convertSAPDate(item.Budat); // Convert Date
        item.Erdat = convertSAPDate(item.Erdat); // Convert Date

        return {
          updateOne: {
            filter: {
              Lblni: String(item.Lblni).trim(),
              Ebeln: String(item.Ebeln).trim(),
            },
            update: { $set: item },
            upsert: true,
          },
        };
      });

      if (ops.length) await collection.bulkWrite(ops, { ordered: false });
      if (page.length < limit) break;
      skip += limit;
    }
  } catch (error) {
    console.error(
      "[ERROR] Failed to fetch and store SES Item data:",
      error.message
    );
  }
}

async function fetchAndStoreSESDetails() {
  let db;
  try {
    // Connect to the database
    db = await cds.connect.to("ZP_AISP_SESVIM_HEAD_BND");

    const { database } = await getConnection();
    const collection = database.collection("SES_VIM_DETAILS_API");

    await collection.createIndex(
      { Packno: 1, Introw: 1, Extrow: 1 },
      { unique: true }
    );

    const limit = 1000;
    let skip = 0;

    while (true) {
      const page = await db.run(
        `ZI_AISP_SESVIM_DETAILS?$top=${limit}&$skip=${skip}`
      );
      if (!page || page.length === 0) break;

      const ops = page.map((item) => {
        // Convert fields as per requirements
        item.Menge = toDecimal(item.Menge);
        item.Uebto = toDecimal(item.Uebto);
        item.Peinh = toDecimal(item.Peinh);
        item.Unitprice = toDecimal(item.Unitprice);
        item.Itemtotalprice = toDecimal(item.Itemtotalprice);
        item.ActMenge = toDecimal(item.ActMenge);
        item.ActWert = toDecimal(item.ActWert);
        item.KntWert = toDecimal(item.KntWert);
        item.KntMenge = toDecimal(item.KntMenge);
        item.Zielwert = toDecimal(item.Zielwert);
        item.UngWert = toDecimal(item.UngWert);
        item.UngMenge = toDecimal(item.UngMenge);
        item.Tbtwr = toDecimal(item.Tbtwr);
        item.Navnw = toDecimal(item.Navnw);
        item.Baswr = toDecimal(item.Baswr);
        item.IntWork = toDecimal(item.IntWork);
        item.ActWork = toDecimal(item.ActWork);

        item.Sdate = convertSAPDate(item.Sdate); // Convert Date
        item.Begtime = convertSAPDate(item.Begtime); // Convert Time
        item.Endtime = convertSAPDate(item.Endtime); // Convert Time
        item.Txdat = convertSAPDate(item.Txdat); // Convert Date
        item.Budat = convertSAPDate(item.Budat); // Convert Date
        item.Insdt = convertSAPDate(item.Insdt); // Convert Date

        return {
          updateOne: {
            filter: {
              Packno: String(item.Packno).trim(),
              Introw: String(item.Introw).trim(),
              Extrow: String(item.Extrow).trim(),
            },
            update: { $set: item },
            upsert: true,
          },
        };
      });

      if (ops.length) await collection.bulkWrite(ops, { ordered: false });
      if (page.length < limit) break;
      skip += limit;
    }
  } catch (error) {
    console.error(
      "[ERROR] Failed to fetch and store SES Details data:",
      error.message
    );
  }
}

function convertSAPDate(dateString) {
  if (typeof dateString === "string" && dateString.startsWith("/Date(")) {
    const timestamp = parseInt(
      dateString.match(/\/Date\((\d+)([+-]\d+)?\)\//)[1]
    );
    return new Date(timestamp).toISOString();
  }
  return dateString;
}

function convertDatesInObject(obj) {
  const result = {};
  for (const key in obj) {
    const val = obj[key];
    if (typeof val === "string" && val.startsWith("/Date(")) {
      result[key] = convertSAPDate(val);
    } else {
      result[key] = val;
    }
  }
  return result;
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
        console.log(
          `Successfully inserted document into ${collectionName}:`,
          result.insertedId
        );
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
    console.log("No attachments to process.");
    return;
  }

  const collection = database.collection(collectionName);

  // === 1. Fetch and delete old Azure files
  const existingAttachments = await collection.find({ REQUEST_NO }).toArray();
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  for (const att of existingAttachments) {
    if (att.IMAGEURL && att.IMAGEURL.startsWith("https://")) {
      try {
        const blobName = att.IMAGEURL.split("/").pop();
        await containerClient.deleteBlob(blobName);
        console.log(`Deleted old blob: ${blobName}`);
      } catch (err) {
        console.warn(
          `⚠️ Failed to delete blob: ${att.IMAGEURL} → ${err.message}`
        );
      }
    }
  }

  // === 2. Delete old DB records
  await collection.deleteMany({ REQUEST_NO });

  // === 3. Upload new attachments to Azure and insert into DB
  const attachmentDataArray = [];

  const uploadPromises = attachments.map(async (attachment, index) => {
    try {
      const { IMAGEURL, IMAGE_FILE_NAME, ...otherFields } = attachment;

      if (!IMAGEURL || !IMAGE_FILE_NAME) {
        throw new Error(
          `Attachment at index ${index} missing IMAGEURL or IMAGE_FILE_NAME.`
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
        STATUS: "Pending",
        ATTACHMENT_ID: uniqueId,
        COMMENT: "-",
      };

      attachmentDataArray.push(attachmentData);
    } catch (error) {
      console.error(
        `❌ Upload failed for attachment at index ${index}:`,
        error.message
      );
    }
  });

  await Promise.all(uploadPromises);

  if (attachmentDataArray.length > 0) {
    try {
      const result = await collection.insertMany(attachmentDataArray);
      console.log(
        `✅ ${result.insertedCount} new attachments inserted successfully.`
      );
    } catch (dbError) {
      console.error("❌ DB insertion failed for attachments:", dbError.message);
    }
  } else {
    console.log("⚠️ No new valid attachments to insert.");
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
  } else {
    console.log(`Collection ${collectionName} already exists.`);
  }
}

module.exports = async (srv) => {
  srv.on("PostSESData", async (req) => {
    const {
      action,
      REQUEST_NO,
      SESHead,
      SESItems,
      SESDetails,
      SESAttachments,
    } = req.data;
    if (action === "CREATE") {
      const { client, database } = await getConnection();

      try {
        const { COMPANY_CODE, PO_NUMBER } = SESHead[0];

        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "SES_VIM",
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

        const SESVimRequestInfoData = database.collection("SES_VIM_HEAD_DATA");
        const SES_AISP_VIM_PO_HEAD = database.collection("SES_VIM_HEAD_API");
        const SES_VIM_ITEM_OVERRIDES = database.collection(
          "SES_VIM_ITEM_STATUS_OVERRIDES"
        );

        let REQUEST_NO;
        let returnMessage;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);
        REQUEST_NO = await GetNextNumber("NVIR");

        const newRequestInfo = {
          ...SESHead[0],
          TOTAL_AMOUNT: new Decimal128(SESHead[0].TOTAL_AMOUNT),
          DOWNPAYMENT_AMOUNT: new Decimal128(SESHead[0].DOWNPAYMENT_AMOUNT),
          REQUEST_NO,
          STATUS: 4, // In Progress
          LAST_UPDATED_ON: new Date(),
          CREATED_ON: new Date(),
          PROCESS_LEVEL: "SES_VIM",
          APPROVER_ROLE: approverDetails.APPROVER_ROLE,
          REQUESTER_ID: req.user.id,
          APPROVER_LEVEL: 1,
          CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
          STATUS_DESC: `In-Process ${approverDetails.APPROVER_ROLE}`,
          VENDOR_STATUS: "Invoice In-Approval",
        };

        await database.collection("SES_VIM_APPROVAL_LOGS").insertOne({
          REQUEST_NO: REQUEST_NO,
          APPROVAL_LEVEL: 0,
          APPROVER_ID: "vendor@gmail.com",
          APPROVER_ROLE: "VENDOR",
          ACTION: "CREATE",
          COMMENT: "Invoice submitted by vendor.",
          TIMESTAMP: new Date(),
        });

        await Promise.all(
          SESItems.map((item) =>
            SES_VIM_ITEM_OVERRIDES.updateOne(
              { Ebeln: item.PO_NUMBER, Lblni: item.SES_NO },
              {
                $set: {
                  Status: "Invoice In-Approval",
                  REQUEST_NO,
                  UPDATED_ON: new Date(),
                },
              },
              { upsert: true }
            )
          )
        );

        // Insert the new request info into the database
        await Promise.all([
          SESVimRequestInfoData.insertOne(newRequestInfo),
          database
            .collection("SES_ApprovalNo")
            .insertOne({ REQUEST_NO, ApprovalLevel: 1 }),
        ]);

        returnMessage = `Invoice request created successfully and sent for approval`;

        // Insert Vim item data and attachments
        const SES_VIM_ITEM_INSERT = SESItems?.length
          ? insertData(
              client,
              database,
              "SES_VIM_ITEM_DATA",
              SESItems.map((data) => ({
                ...data,
                SES_AMOUNT: new Decimal128(data.SES_AMOUNT),
                REQUEST_NO,
              }))
            )
          : Promise.resolve("No Vim item data to insert");

        // Insert SESCVim DETSILA data and attachments
        const SES_VIM_DETAILS_INSERT = SESDetails?.length
          ? insertData(
              client,
              database,
              "SES_VIM_DETAILS_DATA",
              SESDetails.map((data) => ({
                ...data,
                UNIT_PRICE: new Decimal128(data.UNIT_PRICE),
                TOTAL_PRICE: new Decimal128(data.TOTAL_PRICE),
                REQUEST_NO,
              }))
            )
          : Promise.resolve("No Vim destils data to insert");

        const SES_VIM_Attachment = SESAttachments?.length
          ? handleAttachments(
              SESAttachments,
              "SES_VIM_ATTACHMENTS",
              REQUEST_NO,
              database
            )
          : Promise.resolve("No attachments to insert");

        // Run insert operations in parallel
        await Promise.all([
          SES_VIM_ITEM_INSERT,
          SES_VIM_DETAILS_INSERT,
          SES_VIM_Attachment,
        ]);

        // =======================
        // Send Email Notification
        // =======================
        const emailSubject = `Action Required: Approval Pending for SES_VIM Request ${REQUEST_NO}`;
        const emailBody = emailTemplates.ApproverMailBody(
          approverDetails.CURRENT_ASSIGNEE
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
      const APPROVED_COMMENT = req.data.SESHead?.[0]?.APPROVED_COMMENT;

      //Step 1: Validate
      if (!APPROVED_COMMENT || APPROVED_COMMENT.trim() === "") {
        return req.error(400, "Approval comment is required.");
      }

      try {
        const SESVimRequestInfoData = database.collection("SES_VIM_HEAD_DATA");
        const SESVIMItemInfoData = database.collection("SES_VIM_ITEM_DATA");
        const SESVIM_Attachments = database.collection("SES_VIM_ATTACHMENTS");

        // Update the status to Approved (status 4)
        await SESVimRequestInfoData.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { STATUS: 4, LAST_UPDATED_ON: new Date() } }
        );

        // Find the maximum approver level for FIC approvals
        const approvalHierarchyCollection = database.collection(
          "APPROVAL_HIERARCHY_FE"
        );
        const requestInfo = await SESVimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });
        const { COMPANY_CODE } = requestInfo;
        const maxApproverLevelDoc = await approvalHierarchyCollection
          .find({ APPR_TYPE: "SES_VIM", COMPANY_CODE })
          .sort({ APPROVER_LEVEL: -1 })
          .limit(1)
          .toArray();

        const maxApproverLevel = maxApproverLevelDoc.length
          ? maxApproverLevelDoc[0].APPROVER_LEVEL
          : 0;

        const SESApprovalNo = database.collection("SES_ApprovalNo");
        const result = await SESApprovalNo.findOne({ REQUEST_NO: RNumber });

        const currentApprovalLevel = result?.ApprovalLevel || 1;

        //  Insert current approver's log before moving to next level
        const currentApproverLog = await approvalHierarchyCollection.findOne({
          APPROVER_LEVEL: currentApprovalLevel,
          APPR_TYPE: "SES_VIM",
          COMPANY_CODE,
        });

        if (currentApproverLog) {
          await database.collection("SES_VIM_APPROVAL_LOGS").insertOne({
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
            const { sapMessages } = await sendPostPayloadToSAPforSESVim(
              RNumber
            );
            console.log(sapMessages);

            const errorMsg = sapMessages.find(
              (msg) => msg.severity === "error"
            );
            if (errorMsg) {
              console.log(
                ` SAP Error for REQUEST_NO ${RNumber}:`,
                errorMsg.message
              );
              return req.error(400, `SAP Error: ${errorMsg.message}`);
            }

            //Extract invoice number from success message
            const successMsg = sapMessages.find(
              (msg) =>
                msg.severity === "success" &&
                msg.message?.includes("Invoice with number")
            );

            console.log(successMsg);
            const invoiceNoMatch = successMsg?.message?.match(/\d{10}/);
            const invoiceNumber = invoiceNoMatch ? invoiceNoMatch[0] : "";

            console.log(invoiceNumber);

            if (!invoiceNumber) {
              return req.error(
                400,
                "Invoice creation succeeded, but invoice number could not be parsed."
              );
            }

            const finalApprover = await approvalHierarchyCollection.findOne({
              APPROVER_LEVEL: maxApproverLevel,
              APPR_TYPE: "SES_VIM",
              COMPANY_CODE,
            });

            if (finalApprover) {
              await SESVimRequestInfoData.updateOne(
                { REQUEST_NO: RNumber },
                {
                  $set: {
                    APPROVER_ROLE: finalApprover.USER_ROLE,
                    APPROVER_LEVEL: maxApproverLevel,
                    STATUS: 5,
                    COMPANY_CODE: finalApprover.COMPANY_CODE,
                    CURRENT_ASSIGNEE: finalApprover.USER_ID,
                    STATUS_DESC: "Invoice Created",
                    LAST_UPDATED_ON: new Date(),
                    MAX_APPROVER_LEVEL: maxApproverLevel,
                    VENDOR_STATUS: "Invoice Created",
                    SAP_INVOICE_NUMBER: invoiceNumber,
                  },
                }
              );

              //update in item as well
              await SESVIMItemInfoData.updateOne(
                { REQUEST_NO: RNumber },
                { $set: { STATUS: "Invoice Done" } }
              );

              //update in Attachments as well
              await SESVIM_Attachments.updateOne(
                { REQUEST_NO: RNumber },
                { $set: { STATUS: "Completed" } }
              );

              return `Invoice created  ${invoiceNumber} successfully.`;
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
              APPR_TYPE: "SES_VIM",
              COMPANY_CODE,
            });
            if (currentApprover) {
              await SESApprovalNo.updateOne(
                { REQUEST_NO: RNumber },
                { $set: { ApprovalLevel: nextApprovalLevel } }
              );

              await SESVimRequestInfoData.updateOne(
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

              const emailSubject = `Action Required: Approval Pending for SES VIM Request ${RNumber}`;
              const emailBody = emailTemplates.ApproverMailBody(
                currentApprover.USER_ID
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
      const REJECTED_COMMENT = req.data.SESHead?.[0]?.REJECTED_COMMENT;
      const attachmentId = req.data.Attachment?.[0]?.ATTACHMENT_ID;

      try {
        const SESVimRequestInfoData = database.collection("SES_VIM_HEAD_DATA");
        const SES_VIM_HEAD_API = database.collection("SES_VIM_HEAD_API");
        const SESVIMAttachment = database.collection("SES_VIM_ATTACHMENTS");
        const SESAPPROVALNO = database.collection("SESApprovalNo");
        const SESVimHeadData = await SESVimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });
        const { APPROVER_LEVEL, APPROVER_ROLE, CURRENT_ASSIGNEE, PO_NUMBER } =
          SESVimHeadData;
        const { Email } = SES_VIM_HEAD_API; //VendorEmail

        // Update the status to "Rejected" (status 3)
        await SESVimRequestInfoData.updateOne(
          { REQUEST_NO: RNumber },
          {
            $set: {
              STATUS: 3,
              LAST_UPDATED_ON: new Date(),
              STATUS_DESC: "REJECTED",
              REJECTED_COMMENT: REJECTED_COMMENT,
              VENDOR_STATUS: "Invoice Rejected",
            },
          }
        );

        await database.collection("SES_VIM_APPROVAL_LOGS").insertOne({
          REQUEST_NO: RNumber,
          APPROVAL_LEVEL: APPROVER_LEVEL,
          APPROVER_ID: CURRENT_ASSIGNEE,
          APPROVER_ROLE: APPROVER_ROLE,
          ACTION: "REJECT",
          COMMENT: REJECTED_COMMENT,
          TIMESTAMP: new Date(),
        });

        await SESVIMAttachment.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { STATUS: "Rejected", COMMENT: REJECTED_COMMENT } }
        );

        await SESAPPROVALNO.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { ApprovalLevel: 0 } }
        );
        // Find the request information
        const requestInfo = await SESVimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });

        // Send rejection email to the requester
        const emailSubject = `VIM Request Rejected`;
        const emailBody = emailTemplates.RejectedInvoiceMail();

        await lib_email.sendEmail(
          Email, //vendorMail
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
      const RNumber = req.data.REQUEST_NO;
      const { SESHead, SESItems, SESDetails, SESAttachments } = req.data;

      try {
        const SESVimRequestInfoData = database.collection("SES_VIM_HEAD_DATA");
        // const ZAISP_VIM_PO_HEAD = database.collection('ZP_AISP_POVIM_HEAD');
        const SESVIMAttachment = database.collection("SES_VIM_ATTACHMENTS");
        const SESAPPROVALNO = database.collection("SES_ApprovalNo");

        // Fetch the first approver for the company code
        const fetchApprover = async (companyCode) => {
          const approver = await approvalHierarchyCollection.findOne({
            COMPANY_CODE: companyCode,
            APPR_TYPE: "SES_VIM",
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
        const requestInfo = await SESVimRequestInfoData.findOne({
          REQUEST_NO: RNumber,
        });
        const { COMPANY_CODE } = requestInfo;

        // Get approver details
        const approverDetails = await fetchApprover(COMPANY_CODE);

        // Step 1: Update the fields in the VIM_HEAD_DATA collection (e.g., Vimhead)
        if (SESHead) {
          await SESVimRequestInfoData.updateOne(
            { REQUEST_NO: RNumber },
            {
              $set: {
                ...SESHead[0], // Update the fields in Vimhead
                TOTAL_AMOUNT: new Decimal128(SESHead[0].TOTAL_AMOUNT),
                DOWNPAYMENT_AMOUNT: new Decimal128(
                  SESHead[0].DOWNPAYMENT_AMOUNT
                ),
                LAST_UPDATED_ON: new Date(),
                STATUS: 4, // Set status to In Progress
                APPROVER_ROLE: approverDetails.APPROVER_ROLE,
                APPROVER_LEVEL: 1,
                CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
                STATUS_DESC: `In-process ${approverDetails.APPROVER_ROLE}`,
                VENDOR_STATUS: "Invoice In-Approval",
              },
            }
          );
        }

        await database.collection("SES_VIM_APPROVAL_LOGS").insertOne({
          REQUEST_NO: RNumber,
          APPROVAL_LEVEL: 0,
          APPROVER_ID: "vendorupdated@gamil.com",
          APPROVER_ROLE: "VENDOR",
          ACTION: "RE_SUBMIT",
          COMMENT: "Resubmitted and send for approval",
          TIMESTAMP: new Date(),
        });

        // Step 3: Handle new or updated attachments
        if (
          SESAttachments &&
          Array.isArray(SESAttachments) &&
          SESAttachments.length > 0
        ) {
          await UpdateAttachments(
            SESAttachments,
            "SES_VIM_ATTACHMENTS",
            RNumber,
            database
          );
        }

        await SESAPPROVALNO.updateOne(
          { REQUEST_NO: RNumber },
          { $set: { ApprovalLevel: 1 } }
        );

        // Step 5: Send an email notification to the approver
        const emailSubject = `Action Required: Approval Pending for  SES VIM Request ${RNumber} (Edited and Resubmitted)`;
        const emailBody = emailTemplates.ApproverMailBody(
          approverDetails.CURRENT_ASSIGNEE
        );

        await lib_email.sendEmail(
          approverDetails.CURRENT_ASSIGNEE,
          "vaibhavdesai220@gmail.com", // CC to the admin or responsible person
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

  //FOR F4 HELP
  //STATUS
  srv.on("READ", "STATUS_FOR_VIM", async (req) => {
    const { client, database } = await getConnection();
    try {
      const data = await mongoRead("STATUS_FOR_VIM", req, []);
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

  //Vendor code
  srv.on("READ", "VENDOE_CODE", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("SES_VIM_HEAD_API"); // source collection

      const uniqueVendors = await collection.distinct("Lifnr");

      // Format the result
      const result = uniqueVendors
        .filter((v) => !!v) // Remove null or empty strings
        .map((lifnr) => ({ Lifnr: lifnr }));

      return result;
    } catch (error) {
      console.error("Error fetching unique vendor codes:", error);
      req.error(500, "Failed to fetch vendor codes");
    }
  });

  //COMPANY CODE
  srv.on("READ", "COMPANY_CODE", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("SES_VIM_HEAD_API");

      const uniqueCompanyCodes = await collection.distinct("Bukrs");

      const result = uniqueCompanyCodes
        .filter((code) => !!code)
        .map((code) => ({ Bukrs: code }));

      return result;
    } catch (error) {
      console.error("Error fetching unique company codes:", error);
      req.error(500, "Failed to fetch company codes");
    }
  });

  srv.on("READ", "SES_VIM_HEAD_API", async (req) => {
    const { database } = await getConnection();

    try {
      const data = await mongoRead("SES_VIM_HEAD_API", req, []);
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

  //For in SES_VIM_ITEM_API if we update ststus after 5 min it again fetch and chnage so we did showing , in db it will show pending but while rendering it will show In approval, if Invoice-Done in API then deleting that shodow instance
  srv.on("READ", "SES_VIM_ITEM_API", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("SES_VIM_ITEM_API");
    const overrides = database.collection("SES_VIM_ITEM_STATUS_OVERRIDES");

    // Build the MongoDB query from the CAP request
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);

    // Step 1: Fetch base items from API collection
    const items = await collection.find(filter).toArray();

    // Step 2: Build override map
    const overrideDocs = await overrides
      .find({
        $or: items.map((doc) => ({ Ebeln: doc.Ebeln, Lblni: doc.Lblni })),
      })
      .toArray();

    const overrideMap = {};

    overrideDocs.forEach((o) => {
      overrideMap[`${o.Ebeln}_${o.Lblni}`] = o;
    });

    // Step 3: Merge override status or clean up if status is now "Invoice done"
    const mergedItems = await Promise.all(
      items.map(async (item) => {
        const overrideKey = `${item.Ebeln}_${item.Lblni}`;
        const override = overrideMap[overrideKey];

        // If SAP has finalized it, remove override
        if (item.Status === "Invoice Done" && override) {
          await overrides.deleteOne({ Ebeln: item.Ebeln, Lblni: item.Lblni });
        }

        // Show override if available, else show actual
        if (override && item.Status !== "Invoice done") {
          item.Status = override.Status;
        }

        return convertDatesInObject(item);
      })
    );

    return mergedItems;
  });

  srv.on("READ", "SES_VIM_DETAILS_API", async (req) => {
    const { database } = await getConnection();

    try {
      const data = await mongoRead("SES_VIM_DETAILS_API", req, []);
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

  srv.on("READ", "SESVimHead", async (req) => {
    const { database } = await getConnection();

    const COLLECTION_HEAD = "SES_VIM_HEAD_DATA";
    const COLLECTION_ITEM = "SES_VIM_ITEM_DATA";
    const COLLECTION_DETAILS = "SES_VIM_DETAILS_DATA";
    const COLLECTION_ATTACHMENTS = "SES_VIM_ATTACHMENTS";

    try {
      const data = await mongoRead(COLLECTION_HEAD, req, [
        { SESVimItem: COLLECTION_ITEM },
        { SESVimAttachments: COLLECTION_ATTACHMENTS },
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

  //GET Handler for SESDetails - Fetch based on REQUEST_NO + SUBPACK_NO
  srv.on("READ", "SESDetails", async (req) => {
    const { database } = await getConnection();
    const COLLECTION_DETAILS = "SES_VIM_DETAILS_DATA";

    try {
      const data = await mongoRead("SES_VIM_DETAILS_DATA", req, []);
      if (!data) {
        return req.error({
          code: 404,
          message: `No data found!!`,
        });
      }
      return data;
    } catch (err) {
      console.error("Error reading SES Vim details:", err);
      req.error({ code: 500, message: err.message });
    }
  });
};
