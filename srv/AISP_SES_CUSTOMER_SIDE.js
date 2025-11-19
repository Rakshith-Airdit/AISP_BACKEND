// const cds = require('@sap/cds');

// module.exports = async (srv) =>
// {
//     // Using CDS API
//     const ZP_AISP_SES_UPSES_SRB = await cds.connect.to("ZP_AISP_SES_UPSES_SRB");
//       srv.on('READ', 'ZP_AISP_SES_ITEM_DETAIL', req => ZP_AISP_SES_UPSES_SRB.run(req.query));
//       srv.on('READ', 'ZP_AISP_SES_HDR', req => ZP_AISP_SES_UPSES_SRB.run(req.query));
//       srv.on('READ', 'ZI_AISP_ServicesVH', req => ZP_AISP_SES_UPSES_SRB.run(req.query));
// }

const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");
const { BlobServiceClient } = require("@azure/storage-blob");
const fileType = require("file-type");
const emailTemplates = require("./Library/EmailTemplate");
const lib_email = require("./Library/Email");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { buildQuery } = require("../srv/Library/Mongoquery");
const { sendPostPayloadToSAPforSES } = require("./Library/sapBatchSES");

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
  try {
    const buffer = Buffer.from(base64String, "base64");
    const fileTypeResult = await fileType.fromBuffer(buffer);

    if (fileTypeResult) {
      if (fileTypeResult.mime === "application/x-cfb") {
        return "application/vnd.ms-outlook";
      }
      return fileTypeResult.mime;
    }

    const signature = buffer.toString("hex", 0, 4).toUpperCase();
    switch (signature) {
      case "89504E47":
        return "image/png";
      case "25504446":
        return "application/pdf";
      case "FFD8FFE0":
      case "FFD8FFE1":
        return "image/jpeg";
      case "504B0304":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "D0CF11E0":
        return "application/vnd.ms-outlook";
      default:
        console.warn(`Unknown file signature: ${signature}`);
        return "application/octet-stream";
    }
  } catch (err) {
    console.error("Error detecting MIME type:", err.message);
    return "application/octet-stream";
  }
}

async function uploadImageToAzure(base64, originalName, mimeType) {
  let finalMimeType = mimeType;
  if (!mimeToExtensionMap[finalMimeType]) {
    console.warn(`Fallback used for MIME: ${finalMimeType}`);
    finalMimeType = "application/pdf";
  }

  const extension = mimeToExtensionMap[finalMimeType];
  if (!extension) {
    throw new Error(`No extension found for MIME type: ${finalMimeType}`);
  }

  const safeName = originalName.replace(/\s+/g, "_");
  const fileName = `${safeName}.${extension}`;

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  const buffer = Buffer.from(base64, "base64");
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: finalMimeType },
  });

  return blockBlobClient.url;
}

async function fetchApprover(companyCode) {
  const { database } = await getConnection();
  const approvalHierarchyCollection = database.collection(
    "APPROVAL_HIERARCHY_FE"
  );

  const approver = await approvalHierarchyCollection.findOne({
    COMPANY_CODE: companyCode,
    APPR_TYPE: "SES",
    APPROVER_LEVEL: 1,
  });

  if (!approver) {
    throw new Error(`No Approver found for COMPANY_CODE: ${companyCode}.`);
  }

  return {
    CURRENT_ASSIGNEE: approver.USER_ID,
    APPROVER_ROLE: approver.USER_ROLE,
  };
}

module.exports = async (srv) => {
  //Open service Po Tab
  srv.on("READ", "SES_Head", async (req) => {
    // console.log(cds.env.odata);
    const { database } = await getConnection();

    const headColl = database.collection("SES_HEAD");
    const itemColl = database.collection("SES_ITEM");
    const attColl = database.collection("SES_ATTACHMENT");
    const SAPHEAD = database.collection("ZP_AISP_SES_HDR");

    // Use buildQuery helper to get MongoDB query parameters
    const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
      req
    );

    // Check if expand is requested
    const urlParams = req._queryOptions || {};
    const expandToItems = urlParams.$expand?.includes("to_Items");
    const expandToAttachments = urlParams.$expand?.includes("to_Attachments");

    // Build aggregation pipeline
    const pipeline = [];

    // 1. Match stage - apply filters to SES_HEAD collection
    if (Object.keys(query).length > 0) {
      pipeline.push({ $match: query });
    }

    // 2. Lookup items ONLY if expanded (same as old code)
    if (expandToItems) {
      pipeline.push({
        $lookup: {
          from: "SES_ITEM",
          let: { request_no: "$REQUEST_NO" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$REQUEST_NO", "$$request_no"] },
              },
            },
          ],
          as: "to_Items",
        },
      });
    }

    // 3. Lookup attachments ONLY if expanded (same as old code)
    if (expandToAttachments) {
      pipeline.push({
        $lookup: {
          from: "SES_ATTACHMENT",
          let: { request_no: "$REQUEST_NO" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$REQUEST_NO", "$$request_no"] },
              },
            },
          ],
          as: "to_Attachments",
        },
      });
    }

    // 4. Lookup SAP header data for ServicePOType - EXACTLY like old code
    pipeline.push({
      $lookup: {
        from: "ZP_AISP_SES_HDR",
        let: { po_number: "$PO_NUMBER" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$Ebeln", "$$po_number"] },
            },
          },
          {
            $project: {
              Ebeln: 1,
              ServicePOType: 1,
            },
          },
        ],
        as: "sapHeader",
      },
    });

    // 5. Add custom fields using $addFields - EXACTLY like old code logic
    const addFieldsStage = {
      $addFields: {
        // Extract ServicePOType from sapHeader - same logic as old code
        ServicePOType: {
          $let: {
            vars: {
              sapHeaderItem: { $arrayElemAt: ["$sapHeader", 0] },
            },
            in: {
              $cond: {
                if: { $ne: ["$$sapHeaderItem", null] },
                then: "$$sapHeaderItem.ServicePOType",
                else: null,
              },
            },
          },
        },
      },
    };

    // Add calculated fields - same logic as old code
    if (expandToItems) {
      addFieldsStage.$addFields.total_service_sheet_value = {
        $reduce: {
          input: "$to_Items",
          initialValue: 0,
          in: {
            $add: [
              "$$value",
              {
                $multiply: [
                  { $toDouble: { $ifNull: ["$$this.SERVICE_QUANTITY", 0] } },
                  { $toDouble: { $ifNull: ["$$this.UNIT_PRICE", 0] } },
                ],
              },
            ],
          },
        },
      };
    } else {
      // If items are not expanded, set total_service_sheet_value to 0 or calculate separately
      addFieldsStage.$addFields.total_service_sheet_value = 0;
    }

    // Add counts (optional - remove if you don't want them)
    // addFieldsStage.$addFields.items_count = { $size: { $ifNull: ["$to_Items", []] } };
    // addFieldsStage.$addFields.attachments_count = { $size: { $ifNull: ["$to_Attachments", []] } };

    pipeline.push(addFieldsStage);

    // 6. Clean up temporary fields
    pipeline.push({
      $project: {
        sapHeader: 0, // Remove the temporary sapHeader array
      },
    });

    // 7. Project stage - include ALL SES_HEAD fields like old code
    const projection = { ...selectFields };

    // Define ALL fields from SES_HEAD collection (same as what was returned in old code)
    const allHeadFields = {
      _id: 1,
      REQUEST_NO: 1,
      SERVICE_PERIOD: 1,
      PO_NUMBER: 1,
      SERVICE_LOCATION: 1,
      PERSON_RESPONSIBLE: 1,
      LAST_UPDATED_ON: 1,
      CREATED_ON: 1,
      PROCESS_LEVEL: 1,
      APPROVER_ROLE: 1,
      REQUESTER_ID: 1,
      APPROVER_LEVEL: 1,
      CURRENT_ASSIGNEE: 1,
      COMPANY_CODE: 1,
      SUPPLIER_NUMBER: 1,
      SUPPLIER_NAME: 1,
      SES_STATUS: 1,
      VENDOR_STATUS: 1,
      AMOUNT: 1,
      FINAL_SES_ENTRY: 1,
      SERVICE_TEXT: 1,
      SITE_PERSON: 1,
      STATUS: 1,
      STATUS_DESC: 1,
      ServicePOType: 1,
      total_service_sheet_value: 1,
      SAP_REFERENCE_NUMBER: 1,
      // to_Items: 1,
      // to_Attachments: 1
    };

    // Add expanded fields only if requested
    if (expandToItems) {
      allHeadFields.to_Items = 1;
    }
    if (expandToAttachments) {
      allHeadFields.to_Attachments = 1;
    }

    // If $select is used, only include specified fields
    let finalProjection;
    if (Object.keys(projection).length > 0) {
      finalProjection = projection;
      // Always include key fields and calculated fields if their dependencies are selected
      finalProjection.REQUEST_NO = 1;
      if (projection.ServicePOType || projection.PO_NUMBER) {
        finalProjection.ServicePOType = 1;
      }
      if (projection.total_service_sheet_value || projection.to_Items) {
        finalProjection.total_service_sheet_value = 1;
      }
    } else {
      // No $select - return all fields (same as old code behavior)
      finalProjection = allHeadFields;
    }

    pipeline.push({ $project: finalProjection });

    // 8. Sort stage - same as old code
    const finalSort =
      Object.keys(sortOrder).length > 0
        ? { ...sortOrder, LAST_UPDATED_ON: -1 }
        : { LAST_UPDATED_ON: -1 };

    pipeline.push({ $sort: finalSort });

    // 9. Pagination stages
    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    // Execute aggregation with count - same logic as old code
    const [heads, totalCount] = await Promise.all([
      headColl.aggregate(pipeline).toArray(),
      headColl.countDocuments(query), // Count based on original query
    ]);

    const cleanedHeads = heads.map((head) => ({
      ...head,
      ...(head.to_Items?.results && { to_Items: head.to_Items.results }),
      ...(head.to_Attachments?.results && {
        to_Attachments: head.to_Attachments.results,
      }),
    }));

    // Add count to result - same as old code
    const result = cleanedHeads;
    if (result.length > 0) {
      result.$count = totalCount;
    } else {
      result.$count = 0;
    }

    return result;
  });

  srv.on("READ", "SES_Item", async (req) => {
    const { database } = await getConnection();
    const itemCollection = database.collection("SES_ITEM");

    try {
      // Build MongoDB query from OData parameters
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Execute query with pagination
      let cursor = itemCollection.find(query);

      // Apply sorting
      if (Object.keys(sortOrder).length > 0) {
        cursor = cursor.sort(sortOrder);
      }

      // Apply pagination
      if (skip > 0) cursor = cursor.skip(skip);
      if (limit > 0) cursor = cursor.limit(limit);

      // Apply field projection
      if (Object.keys(selectFields).length > 0) {
        cursor = cursor.project(selectFields);
      }

      const data = await cursor.toArray();

      // Get total count for OData $count
      const totalCount = await itemCollection.countDocuments(query);

      // Add @odata.count annotation if requested
      if (req.query.SELECT.count) {
        data["@odata.count"] = totalCount;
      }

      return data;
    } catch (error) {
      console.error("Error executing MongoDB query:", error);
      throw error;
    }
  });

  srv.on("READ", "SES_Attachment", async (req) => {
    const { database } = await getConnection();
    const attachmentCollection = database.collection("SES_ATTACHMENT");

    try {
      // Build MongoDB query from OData parameters
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Execute query with pagination
      let cursor = attachmentCollection.find(query);

      // Apply sorting
      if (Object.keys(sortOrder).length > 0) {
        cursor = cursor.sort(sortOrder);
      }

      // Apply pagination
      if (skip > 0) cursor = cursor.skip(skip);
      if (limit > 0) cursor = cursor.limit(limit);

      // Apply field projection
      if (Object.keys(selectFields).length > 0) {
        cursor = cursor.project(selectFields);
      }

      const data = await cursor.toArray();

      // Get total count for OData $count
      const totalCount = await attachmentCollection.countDocuments(query);

      // Add @odata.count annotation if requested
      if (req.query.SELECT.count) {
        data["@odata.count"] = totalCount;
      }

      return data;
    } catch (error) {
      console.error("Error executing MongoDB query:", error);
      throw error;
    }
  });

  srv.on("READ", "SES_HEAD_MINIMAL_DATA", async (req) => {
    const { database } = await getConnection();

    const headColl = database.collection("SES_HEAD");
    const SAPHEAD = database.collection("ZP_AISP_SES_HDR");

    // Build the MongoDB query from the CAP request
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);

    // Fetch heads with count in a single operation (only SES_HEAD data)
    const [heads, count] = await Promise.all([
      headColl
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ ...sort, LAST_UPDATED_ON: -1 })
        .toArray(),
      headColl.countDocuments(filter), // Count total documents for pagination
    ]);

    // Early return if no heads found
    if (!heads.length) {
      heads["$count"] = 0;
      return heads;
    }

    // Fetch ServicePOType for each SES_Head from the SAPHEAD collection based on PO_NUMBER (Ebeln)
    const poNumbers = [
      ...new Set(heads.map((h) => h.PO_NUMBER).filter(Boolean)),
    ];
    const sapHeads = await SAPHEAD.find({ Ebeln: { $in: poNumbers } })
      .project({ ...select, Ebeln: 1, ServicePOType: 1 })
      .toArray();

    // Create a lookup map for ServicePOType based on PO_NUMBER (Ebeln)
    const sapHeadByPo = sapHeads.reduce((acc, sh) => {
      acc[sh.Ebeln] = sh.ServicePOType;
      return acc;
    }, {});

    // Add ServicePOType to each head
    for (const head of heads) {
      head.ServicePOType = sapHeadByPo[head.PO_NUMBER] || null; // Ensure ServicePOType is added to each head
    }

    // Add count to result for pagination
    heads["$count"] = count;

    // Return the paginated data with ServicePOType added
    return heads;
  });

  srv.on("READ", "SES_CREATION_LOGS", async (req) => {
    const { database } = await getConnection();
    const logsCollection = database.collection("SES_CREATION_LOGS");

    try {
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Base pipeline for enrichment (without pagination/sorting)
      const basePipeline = [
        // 1. Lookup SES_HEAD data (only for CREATED_ON and SES_STATUS)
        {
          $lookup: {
            from: "SES_HEAD",
            localField: "REQUEST_NO",
            foreignField: "REQUEST_NO",
            as: "headData",
          },
        },
        // 2. Add enriched fields (AMOUNT comes directly from SES_CREATION_LOGS now)
        {
          $addFields: {
            CREATED_ON: { $arrayElemAt: ["$headData.CREATED_ON", 0] },
            SES_STATUS: { $arrayElemAt: ["$headData.SES_STATUS", 0] },
            // AMOUNT is now directly from SES_CREATION_LOGS - no need to lookup from HEAD
          },
        },
        // 3. Clean up
        {
          $project: {
            headData: 0,
          },
        },
        // 4. Apply user query (can now filter on enriched fields)
        ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
      ];

      // Data pipeline (with sorting and pagination)
      const dataPipeline = [
        ...basePipeline,
        // Apply field projection
        ...(Object.keys(selectFields).length > 0
          ? [{ $project: selectFields }]
          : []),
        // Sort
        { $sort: Object.keys(sortOrder).length > 0 ? sortOrder : { _id: -1 } },
        // Pagination
        ...(skip > 0 ? [{ $skip: skip }] : []),
        ...(limit > 0 ? [{ $limit: limit }] : []),
      ];

      // Count pipeline (just base pipeline with count)
      const countPipeline = [...basePipeline, { $count: "total" }];

      // Execute both pipelines
      const [enrichedItems, countResult] = await Promise.all([
        logsCollection.aggregate(dataPipeline).toArray(),
        logsCollection.aggregate(countPipeline).toArray(),
      ]);

      const count = countResult.length > 0 ? countResult[0].total : 0;

      // Add count properties
      enrichedItems["$count"] = count;
      if (req.query.SELECT?.count) {
        enrichedItems["@odata.count"] = count;
      }

      return enrichedItems;
    } catch (error) {
      console.error("Error executing MongoDB query:", error);
      throw error;
    }
  });

  srv.on("READ", "SES_status", async (req) => {
    const { database } = await getConnection();
    const headerCol = database.collection("ZP_AISP_SES_HDR");
    const sesHeadCol = database.collection("SES_HEAD");

    try {
      // 1. Get unique statuses from both collections
      const rawStatusesHdr = await headerCol.distinct("HeaderStaus");
      const rawStatusesHead = await sesHeadCol.distinct("SES_STATUS");

      // 2. Merge the results and ensure uniqueness
      const mergedStatuses = new Set([...rawStatusesHdr, ...rawStatusesHead]);

      // 3. Return the merged list as [{ Status: ... }]
      return Array.from(mergedStatuses).map((status) => ({ Status: status }));
    } catch (error) {
      console.error("Error fetching unique statuses:", error);
      req.error({
        code: 500,
        message: `Failed to retrieve status values: ${error.message}`,
      });
    }
  });

  //To Perform actions
  srv.on("approveSES", async (req) => {
    try {
      const { servicehead, serviceitem, attachments, TOTAL_AMOUNT } = req.data;

      // ==================== VALIDATION PHASE ====================
      if (!Array.isArray(servicehead) || servicehead.length === 0) {
        return req.reject(400, "servicehead array is empty or not provided");
      }
      if (!Array.isArray(serviceitem) || serviceitem.length === 0) {
        return req.reject(400, "serviceitem array is empty or not provided");
      }
      if (!Array.isArray(attachments) || attachments.length === 0) {
        return req.reject(400, "attachments array is empty or not provided");
      }

      const headData = servicehead[0];
      const { REQUEST_NO } = headData;

      if (!REQUEST_NO) {
        return req.reject(400, "REQUEST_NO is required for approval.");
      }

      if (!headData.COMMENT || headData.COMMENT.trim() === "") {
        return req.reject(400, "Approval comment is required.");
      }

      const requiredFields = [
        "FINAL_SES_ENTRY",
        "SERVICE_TEXT",
        "SITE_PERSON",
        // 'SERVICE_PERIOD',
        // 'SERVICE_LOCATION',
        // 'COMPANY_CODE',
        // 'SUPPLIER_NUMBER',
        // 'PO_NUMBER',
        // 'PERSON_RESPONSIBLE',
        // 'SUPPLIER_NAME',
        // 'AMOUNT'
      ];

      const missingFields = requiredFields.filter((field) => !headData[field]);

      if (missingFields.length > 0) {
        return req.reject(
          400,
          `Missing required fields: ${missingFields.join(", ")}`
        );
      }

      // Database connection
      const { database } = await getConnection();
      const HeadCollection = database.collection("SES_HEAD");
      const approvalHierarchyCollection = database.collection(
        "APPROVAL_HIERARCHY_FE"
      );

      // SES record validation
      const sesHead = await HeadCollection.findOne({ REQUEST_NO });
      if (!sesHead) {
        return req.reject(
          404,
          `No SES_HEAD found for REQUEST_NO: ${REQUEST_NO}`
        );
      }

      // Check if already approved
      if (sesHead.SES_STATUS === "Approved" || sesHead.STATUS === 5) {
        return req.reject(409, `SES ${REQUEST_NO} is already approved`);
      }

      const COMPANY_CODE = sesHead.COMPANY_CODE;

      // Approval level validation
      const currentApprovalDoc = await database
        .collection("SES_APPROVAL_NO")
        .findOne({ REQUEST_NO });

      const currentLevel = currentApprovalDoc?.ApprovalLevel || 1;

      const maxApprovalDoc = await approvalHierarchyCollection
        .find({ APPR_TYPE: "SES", COMPANY_CODE })
        .sort({ APPROVER_LEVEL: -1 })
        .limit(1)
        .toArray();

      const maxLevel = maxApprovalDoc.length
        ? maxApprovalDoc[0].APPROVER_LEVEL
        : 0;

      // Validate current level
      if (currentLevel > maxLevel) {
        return req.reject(
          500,
          `Invalid approval level ${currentLevel}. Max level is ${maxLevel}`
        );
      }

      const isFinalApproval = currentLevel === maxLevel;
      const targetLevel = isFinalApproval ? maxLevel : currentLevel + 1;

      const targetApprover = await approvalHierarchyCollection.findOne({
        APPROVER_LEVEL: targetLevel,
        APPR_TYPE: "SES",
        COMPANY_CODE,
      });

      if (!targetApprover) {
        return req.reject(500, `No approver found for level ${targetLevel}`);
      }

      // Required fields validation - only check for final approval
      // if (isFinalApproval) {
      //   const requiredFields = [
      //     "FINAL_SES_ENTRY",
      //     "SITE_PERSON",
      //     "SERVICE_TEXT",
      //   ];
      //   const missingFields = requiredFields.filter(
      //     (field) => !headData[field]
      //   );
      //   if (missingFields.length > 0) {
      //     return req.reject(
      //       400,
      //       `Missing required fields for final approval: ${missingFields.join(
      //         ", "
      //       )}`
      //     );
      //   }
      // }

      // ==================== CRUD OPERATIONS PHASE ====================

      let sapResponse = null;

      // 1. Handle SAP posting for final approval
      if (isFinalApproval) {
        try {
          sapResponse = await sendPostPayloadToSAPforSES(sesHead.REQUEST_NO);
          console.log("SAP Response:", sapResponse.referenceNumber);

          if (sapResponse.status === "Error") {
            return req.reject(
              500,
              `SAP Posting failed: ${
                sapResponse.sapErrors?.[0]?.message || "Unknown error"
              }`
            );
          }

          await database.collection("SES_CREATION_LOGS").insertOne({
            REQUEST_NO,
            APPROVAL_LEVEL: currentLevel,
            APPROVER_ID: req.user?.id || "UNKNOWN",
            APPROVER_ROLE: sesHead.APPROVER_ROLE,
            ACTION: "APPROVE",
            COMMENT: headData.COMMENT,
            PO_NUMBER: sesHead.PO_NUMBER,
            TIMESTAMP: new Date(),
            AMOUNT: TOTAL_AMOUNT,
          });

          // Log SAP POST response
          await database.collection("SES_SAP_POST_LOGS").insertOne({
            REQUEST_NO,
            PO_NUMBER: sesHead.PO_NUMBER,
            TIMESTAMP: new Date(),
            SAP_MESSAGES: sapResponse.sapMessages || [],
            SAP_ERRORS: sapResponse.sapErrors || [],
            STATUS: sapResponse.status,
            REFERENCE_NUMBER: sapResponse.referenceNumber,
          });

          // Update SES_HEAD with reference number for final approval
          await HeadCollection.updateOne(
            { REQUEST_NO: sesHead.REQUEST_NO },
            {
              $set: {
                APPROVER_ROLE: targetApprover.USER_ROLE,
                APPROVER_LEVEL: targetLevel,
                CURRENT_ASSIGNEE: targetApprover.USER_ID,
                SAP_REFERENCE_NUMBER: sapResponse.referenceNumber,
                SAP_POST_TIMESTAMP: new Date(),
                STATUS: 5,
                STATUS_DESC: "Approved",
                SES_STATUS: "Approved",
                FINAL_SES_ENTRY: headData.FINAL_SES_ENTRY,
                SITE_PERSON: headData.SITE_PERSON,
                SERVICE_TEXT: headData.SERVICE_TEXT,
                LAST_UPDATED_ON: new Date(),
              },
            }
          );

          // Update SES_ITEM records for final approval
          const ItemCollection = database.collection("SES_ITEM");
          await ItemCollection.updateMany(
            { REQUEST_NO },
            { $set: { STATUS: "Approved" } }
          );
        } catch (error) {
          console.error("SAP POST Error:", error);
          return req.reject(
            500,
            `SAP Posting failed: ${error.message || "Unknown error"}`
          );
        }
      } else {
        // For non-final approval - update approval level and head
        await database
          .collection("SES_APPROVAL_NO")
          .updateOne({ REQUEST_NO }, { $set: { ApprovalLevel: targetLevel } });

        await HeadCollection.updateOne(
          { REQUEST_NO },
          {
            $set: {
              APPROVER_ROLE: targetApprover.USER_ROLE,
              APPROVER_LEVEL: targetLevel,
              CURRENT_ASSIGNEE: targetApprover.USER_ID,
              FINAL_SES_ENTRY: headData.FINAL_SES_ENTRY,
              SITE_PERSON: headData.SITE_PERSON,
              SERVICE_TEXT: headData.SERVICE_TEXT,
              SES_STATUS: `In-Process ${targetApprover.USER_ROLE}`,
              LAST_UPDATED_ON: new Date(),
            },
          }
        );
      }

      // 3. Send email notification for non-final approval (non-blocking)
      if (!isFinalApproval) {
        try {
          const SESDate = sesHead.CREATED_ON.toISOString().split("T")[0];
          const emailBody = emailTemplates.ApproverMailBodyForSES(
            targetApprover.USER_ID,
            sesHead.PO_NUMBER,
            REQUEST_NO,
            SESDate,
            sesHead.AMOUNT
          );

          await lib_email.sendEmail(
            targetApprover.USER_ID,
            "amiyapradhan1999@gmail.com", // Should be from config
            "html",
            `Action Required: SES ${REQUEST_NO} awaits your approval`,
            emailBody
          );
        } catch (emailError) {
          console.error(
            `❌ Next approver email failed for SES ${REQUEST_NO}:`,
            emailError
          );
          // Don't reject the request if email fails
        }
      }

      // 4. Return appropriate response
      if (isFinalApproval) {
        return {
          returnMessage: `SES ${REQUEST_NO} approved and posted to SAP successfully.`,
          sapMessages: sapResponse?.sapMessages,
          referenceNumber: sapResponse?.referenceNumber,
        };
      } else {
        return {
          returnMessage: `SES ${REQUEST_NO} approved at level ${currentLevel}. Forwarded to ${targetApprover.USER_ROLE}`,
          nextApprover: targetApprover.USER_ROLE,
          nextLevel: targetLevel,
        };
      }
    } catch (error) {
      console.error(`❌ SES Approval failed:`, error);
      return req.reject(500, `SES approval failed: ${error.message}`);
    }
  });

  srv.on("rejectSES", async (req) => {
    try {
      const { servicehead, serviceitem, attachments, TOTAL_AMOUNT } = req.data;

      // ==================== VALIDATION PHASE ====================

      // 1. Input structure validation
      if (!Array.isArray(servicehead) || servicehead.length === 0) {
        return req.reject(400, "servicehead array is empty or not provided");
      }
      if (!Array.isArray(serviceitem) || serviceitem.length === 0) {
        return req.reject(400, "serviceitem array is empty or not provided");
      }
      if (!Array.isArray(attachments) || attachments.length === 0) {
        return req.reject(400, "attachments array is empty or not provided");
      }

      const headData = servicehead[0];
      const { REQUEST_NO } = headData;

      if (!REQUEST_NO) {
        return req.reject(400, "REQUEST_NO is required for rejection.");
      }

      // 2. Comment validation
      if (!headData.COMMENT || headData.COMMENT.trim() === "") {
        return req.reject(400, "Rejection comment is required.");
      }

      // 3. Database connection and collection setup
      const { database } = await getConnection();
      const HeadCollection = database.collection("SES_HEAD");
      const ItemCollection = database.collection("SES_ITEM");

      // 4. SES record validation
      const sesHead = await HeadCollection.findOne({ REQUEST_NO });

      if (!sesHead) {
        return req.reject(
          404,
          `No SES_HEAD found for REQUEST_NO: ${REQUEST_NO}`
        );
      }

      // Check if already rejected
      if (sesHead.SES_STATUS === "Rejected" || sesHead.STATUS === 6) {
        return req.reject(409, `SES ${REQUEST_NO} is already rejected`);
      }

      // Check if already approved
      if (sesHead.SES_STATUS === "Approved" || sesHead.STATUS === 5) {
        return req.reject(
          409,
          `SES ${REQUEST_NO} is already approved and cannot be rejected`
        );
      }

      // 6. Validate requester exists for email notification
      if (!sesHead.REQUESTER_ID) {
        return req.reject(400, `No requester found for SES ${REQUEST_NO}.`);
      }

      // 7. Get current approval level
      const currentApprovalDoc = await database
        .collection("SES_APPROVAL_NO")
        .findOne({ REQUEST_NO });
      const currentLevel = currentApprovalDoc?.ApprovalLevel || 1;

      // Extract required data for operations
      const COMPANY_CODE = sesHead.COMPANY_CODE;
      const PO_NUMBER = sesHead.PO_NUMBER;
      const SESNumber = REQUEST_NO;
      const SESDate = sesHead.CREATED_ON.toISOString().split("T")[0];
      const TotalAmount = sesHead.AMOUNT;
      const REQUESTER_ID = sesHead.REQUESTER_ID;

      // ==================== CRUD OPERATIONS PHASE ====================

      // 1. Update SES_HEAD for rejection
      await HeadCollection.updateOne(
        { REQUEST_NO },
        {
          $set: {
            STATUS: 6,
            SES_STATUS: "Rejected",
            VENDOR_STATUS: "Rejected",
            LAST_UPDATED_ON: new Date(),
            REJECTION_COMMENT: headData.COMMENT,
            FINAL_SES_ENTRY: headData.FINAL_SES_ENTRY,
            SITE_PERSON: headData.SITE_PERSON,
            SERVICE_TEXT: headData.SERVICE_TEXT,
          },
        }
      );

      // 2. Update SES_ITEM records
      await ItemCollection.updateMany(
        { REQUEST_NO },
        { $set: { STATUS: "Rejected" } }
      );

      // 3. Log the rejection
      await database.collection("SES_CREATION_LOGS").insertOne({
        REQUEST_NO,
        APPROVAL_LEVEL: currentLevel,
        APPROVER_ID: req.user?.id || "UNKNOWN",
        APPROVER_ROLE: sesHead.APPROVER_ROLE,
        ACTION: "REJECT",
        COMMENT: headData.COMMENT,
        TIMESTAMP: new Date(),
        PO_NUMBER: PO_NUMBER,
        AMOUNT: TOTAL_AMOUNT,
      });

      // 4. Send rejection email (non-blocking)
      try {
        const emailSubject = `SES ${REQUEST_NO} Rejected`;
        const emailBody = emailTemplates.RejectedSESMail(
          PO_NUMBER,
          SESNumber,
          SESDate,
          TotalAmount
        );

        await lib_email.sendEmail(
          REQUESTER_ID,
          "amiyapradhan1999@gmail.com",
          "html",
          emailSubject,
          emailBody
        );
      } catch (emailError) {
        console.error(
          `❌ Rejection email failed for SES ${REQUEST_NO}:`,
          emailError
        );
        // Continue execution even if email fails
      }

      return {
        returnMessage: `SES ${REQUEST_NO} rejected successfully.`,
      };
    } catch (error) {
      console.error(`❌ SES Rejection failed:`, error);
      return req.reject(500, `SES rejection failed: ${error.message}`);
    }
  });
};
