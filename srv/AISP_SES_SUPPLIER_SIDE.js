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
const { GetNextNumber } = require("./Library/Utility");
const cron = require("node-cron");
const { BlobServiceClient } = require("@azure/storage-blob");
const fileType = require("file-type");
const emailTemplates = require("./Library/EmailTemplate");
const lib_email = require("./Library/Email");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");

const { buildQuery } = require("../srv/Library/Mongoquery");
const {
  buildMatchStage,
  buildProjectStage,
  buildSortStage,
  buildSkipStage,
  buildLimitStage,
  buildGroupStage,
  buildPipeline,
  extractFieldValue,
  removeFieldFromFilter,
  parseRemainingFilters,
  buildLookupStage,
  buildLookupWithPipeline,
  buildAddFieldsStage,
  buildExtractFirstField,
  buildUnsetStage,
} = require("../srv/Library/Aggregation");

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
  srv.on("READ", "ZI_AISP_ServicesVH", async (req) => {
    const ZP_AISP_SES_UPSES_SRB = await cds.connect.to("ZP_AISP_SES_UPSES_SRB");
    return ZP_AISP_SES_UPSES_SRB.run(req.query);
  });

  srv.on("READ", "ZP_AISP_SES_HDR", async (req) => {
    const { database } = await getConnection();
    const headerCollection = database.collection("ZP_AISP_SES_HDR");

    try {
      // Build MongoDB query from OData parameters
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Execute query with pagination
      let cursor = headerCollection.find(query);

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
      const totalCount = await headerCollection.countDocuments(query);

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

  srv.on("READ", "ZP_AISP_SES_ITEM_DETAIL", async (req) => {
    const { database } = await getConnection();
    const itemCollection = database.collection("ZP_AISP_SES_ITEM_DETAIL");

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

  //Open service Po Tab
  srv.on("READ", "SESHeaderList", async (req) => {
    const { database } = await getConnection();
    const headerCollection = database.collection("ZP_AISP_SES_HDR");

    try {
      // Build MongoDB query from OData parameters
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Execute query with pagination
      let cursor = headerCollection.find(query);

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
      const totalCount = await headerCollection.countDocuments(query);

      // Add @odata.count annotation if requested
      // if (req.query.SELECT.count) {
      //   data["@odata.count"] = totalCount;
      // }
      data["$count"] = totalCount;

      return data;
    } catch (error) {
      console.error("Error executing MongoDB query:", error);
      throw error;
    }
  });

  srv.on("READ", "SESItemList", async (req) => {
    const { database } = await getConnection();
    const sesItemColl = database.collection("SES_ITEM");
    const zpItemColl = database.collection("ZP_AISP_SES_ITEM_DETAIL");
    const sesHeadColl = database.collection("ZP_AISP_SES_HDR");

    try {
      const urlParams = req._queryOptions || {};
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );
      const poNumberValue = extractFieldValue(urlParams.$filter, "PO_NUMBER");

      if (!poNumberValue) {
        return req.reject(400, "PO_NUMBER filter is mandatory");
      }

      const otherFiltersString = removeFieldFromFilter(
        urlParams.$filter,
        "PO_NUMBER"
      );
      const otherFilters = await parseRemainingFilters(otherFiltersString);

      const headDoc = await sesHeadColl.findOne(
        { Ebeln: poNumberValue },
        { projection: { ServicePOType: 1 } }
      );

      if (!headDoc?.ServicePOType) {
        return req.reject(
          404,
          `ServicePOType not found for PO_NUMBER ${poNumberValue}`
        );
      }

      const isPlanned = headDoc.ServicePOType === "Planned";
      const collection = isPlanned ? zpItemColl : sesItemColl;

      if (isPlanned) {
        // ---------- CORRECTED PLANNED PIPELINE ----------
        const pipeline = buildPipeline([
          // STAGE 1: PO_NUMBER filter only (optimal performance)
          buildMatchStage({ PO_NUMBER: poNumberValue }),

          // Lookup and calculations
          buildLookupWithPipeline(
            "SES_ITEM",
            { po_number: "$PO_NUMBER", sr_no: "$SR_NO" },
            [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$PO_NUMBER", "$$po_number"] },
                      { $eq: ["$SR_NO", "$$sr_no"] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalServiceQty: { $sum: "$SERVICE_QUANTITY" },
                },
              },
            ],
            "serviceQuantities"
          ),

          buildExtractFirstField("serviceQuantities", "serviceQtyData"),

          buildAddFieldsStage({
            SERVICE_QUANTITY: {
              $ifNull: ["$serviceQtyData.totalServiceQty", 0],
            },
            ORDERED_QUANTITY: {
              $toDouble: { $ifNull: ["$ORDERED_QUANTITY", 0] },
            },
            UNIT_PRICE: { $toDouble: { $ifNull: ["$UNIT_PRICE", 0] } },
            TOTAL_PRICE: { $toDouble: { $ifNull: ["$TOTAL_PRICE", 0] } },
            packno: { $ifNull: ["$packno", ""] },
            introw: { $ifNull: ["$introw", ""] },
            packageNofromPO: { $ifNull: ["$packageNofromPO", ""] },
          }),

          buildUnsetStage(["serviceQuantities", "serviceQtyData"]),

          // STAGE 2: Other filters (including calculated fields)
          buildMatchStage(otherFilters),

          // Final stages
          buildSortStage(sortOrder),
          buildProjectStage(selectFields),
          buildSkipStage(skip),
          buildLimitStage(limit),
        ]);

        const result = await collection.aggregate(pipeline).toArray();
        return result;
      } else {
        // ---------- CORRECTED UN-PLANNED PIPELINE ----------
        const pipeline = buildPipeline([
          // STAGE 1: PO_NUMBER filter only (optimal performance)
          buildMatchStage({ PO_NUMBER: poNumberValue }),

          // Field calculations
          buildAddFieldsStage({
            ORDERED_QUANTITY: {
              $toDouble: { $ifNull: ["$ORDERED_QUANTITY", 0] },
            },
            UNIT_PRICE: { $toDouble: { $ifNull: ["$UNIT_PRICE", 0] } },
            SERVICE_QUANTITY: {
              $toDouble: { $ifNull: ["$SERVICE_QUANTITY", 0] },
            },
            TOTAL_PRICE: { $toDouble: { $ifNull: ["$TOTAL_PRICE", 0] } },
            packno: { $ifNull: ["$packno", ""] },
            introw: { $ifNull: ["$introw", ""] },
            packageNofromPO: { $ifNull: ["$packageNofromPO", ""] },
          }),

          // STAGE 2: Other filters (including calculated fields)
          buildMatchStage(otherFilters),

          // Final stages
          buildSortStage(sortOrder),
          buildProjectStage(selectFields),
          buildSkipStage(skip),
          buildLimitStage(limit),
        ]);

        const result = await collection.aggregate(pipeline).toArray();
        return result;
      }
    } catch (error) {
      console.error("Error in SESItemList handler:", error);
      return req.reject(500, `Error fetching SES items: ${error.message}`);
    }
  });

  srv.on("READ", "SES_Head", async (req) => {
    const { database } = await getConnection();

    const headColl = database.collection("SES_HEAD");
    const SAPHEAD = database.collection("ZP_AISP_SES_HDR");

    const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
      req
    );

    try {
      const pipeline = buildPipeline([
        // Match stage
        buildMatchStage(query),

        // Lookup items
        buildLookupStage("SES_ITEM", "REQUEST_NO", "REQUEST_NO", "items"),

        // Lookup attachments
        buildLookupStage(
          "SES_ATTACHMENT",
          "REQUEST_NO",
          "REQUEST_NO",
          "attachments"
        ),

        // Lookup SAP head for ServicePOType
        buildLookupWithPipeline(
          "ZP_AISP_SES_HDR",
          { poNumber: "$PO_NUMBER" },
          [
            { $match: { $expr: { $eq: ["$Ebeln", "$$poNumber"] } } },
            { $project: { ServicePOType: 1 } },
          ],
          "sapHead"
        ),

        // Add calculated fields
        buildAddFieldsStage({
          to_Items: "$items",
          to_Attachments: "$attachments",
          ServicePOType: { $arrayElemAt: ["$sapHead.ServicePOType", 0] },
          total_service_sheet_value: {
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $multiply: [
                      {
                        $toDouble: { $ifNull: ["$$this.SERVICE_QUANTITY", 0] },
                      },
                      { $toDouble: { $ifNull: ["$$this.UNIT_PRICE", 0] } },
                    ],
                  },
                ],
              },
            },
          },
        }),

        // Projection
        buildProjectStage(
          Object.keys(selectFields).length > 0
            ? {
                _id: 0,
                ...selectFields,
                // Always include these for navigation if not explicitly excluded
                ...(selectFields.to_Items === undefined ? { to_Items: 1 } : {}),
                ...(selectFields.to_Attachments === undefined
                  ? { to_Attachments: 1 }
                  : {}),
              }
            : { _id: 0 }
        ),

        // Sorting
        buildSortStage({ ...sortOrder, LAST_UPDATED_ON: -1 }),

        // Pagination
        buildSkipStage(skip),
        buildLimitStage(limit),
      ]);

      const [heads, count] = await Promise.all([
        headColl.aggregate(pipeline).toArray(),
        headColl.countDocuments(query),
      ]);

      // return {
      //   ...heads,
      //   "@odata.count": count
      // };
      heads["$count"] = count;
      return heads;
    } catch (error) {
      console.error("Error fetching SES heads:", error);
      return req.reject(500, `Error fetching SES heads: ${error.message}`);
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

    const sapHeads = await SAPHEAD.find(
      { Ebeln: { $in: poNumbers } },
      { projection: { Ebeln: 1, ServicePOType: 1 } }
    ).toArray();

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
    const LOGS = database.collection("SES_CREATION_LOGS");

    const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
      req
    );

    try {
      const pipeline = buildPipeline([
        // Match stage for logs
        buildMatchStage(query),

        // Lookup head data only for CREATED_ON and SES_STATUS (not AMOUNT anymore)
        buildLookupWithPipeline(
          "SES_HEAD",
          { requestNo: "$REQUEST_NO" },
          [
            { $match: { $expr: { $eq: ["$REQUEST_NO", "$$requestNo"] } } },
            { $project: { CREATED_ON: 1, SES_STATUS: 1 } }, // Remove AMOUNT from here
          ],
          "headData"
        ),

        // Add fields from head data
        buildAddFieldsStage({
          CREATED_ON: { $arrayElemAt: ["$headData.CREATED_ON", 0] },
          SES_STATUS: { $arrayElemAt: ["$headData.SES_STATUS", 0] },
          // AMOUNT is now directly from SES_CREATION_LOGS, no need to lookup from HEAD
        }),

        // Projection
        buildProjectStage(
          Object.keys(selectFields).length > 0
            ? { _id: 0, headData: 0, ...selectFields }
            : { _id: 0, headData: 0 }
        ),

        // Sorting
        buildSortStage({ ...sortOrder, _id: -1 }),

        // Pagination
        buildSkipStage(skip),
        buildLimitStage(limit),
      ]);

      const [items, count] = await Promise.all([
        LOGS.aggregate(pipeline).toArray(),
        LOGS.countDocuments(query),
      ]);

      items["$count"] = count;

      return items;
    } catch (error) {
      console.error("Error fetching SES creation logs:", error);
      return req.reject(
        500,
        `Error fetching SES creation logs: ${error.message}`
      );
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

  //To Perform actions
  srv.on("createSES", async (req) => {
    try {
      const { servicehead, serviceitem, attachments, TOTAL_AMOUNT, PO_TYPE } =
        req.data;

      // Validate input data
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
      const requiredFields = [
        "SERVICE_PERIOD",
        "SERVICE_LOCATION",
        "COMPANY_CODE",
        "SUPPLIER_NUMBER",
        "PO_NUMBER",
        "PERSON_RESPONSIBLE",
        "SUPPLIER_NAME",
        "AMOUNT",
      ];

      const missingFields = requiredFields.filter((field) => !headData[field]);

      if (missingFields.length > 0) {
        return req.reject(
          400,
          `Missing required fields: ${missingFields.join(", ")}`
        );
      }

      // Validate attachments
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        if (!att.base64value || !att.DESCRIPTION) {
          return req.reject(
            400,
            `Attachment at index ${i} must include base64value and description`
          );
        }
      }

      // Get database connection and generate request number
      const { database } = await getConnection();

      //Fetch Request Number
      const NEW_REQUEST_NO = await GetNextNumber("NVIR");

      if (!NEW_REQUEST_NO) {
        return req.reject(400, `Failed to generate REQUEST_NO`);
      }

      // Fetch approver details
      const approverDetails = await fetchApprover(headData.COMPANY_CODE);

      if (!approverDetails || approverDetails.length === 0) {
        return req.reject(400, `Failed to fetch approver details`);
      } else {
        const requiredApproverDetails = ["APPROVER_ROLE", "CURRENT_ASSIGNEE"];

        const missingApproverDetails = requiredApproverDetails.filter(
          (field) => !approverDetails[field]
        );

        if (missingApproverDetails.length > 0) {
          return req.reject(
            400,
            `Missing required approver details: ${missingApproverDetails.join(
              ", "
            )}`
          );
        }
      }

      // Process attachments
      const uploadedAttachments = [];
      for (const att of attachments) {
        const mimeType = await getMimeTypeFromBase64(att.base64value);
        if (!mimeToExtensionMap[mimeType]) {
          throw new Error(`Unsupported MIME type: ${mimeType}`);
        }
        const URL = await uploadImageToAzure(
          att.base64value,
          att.DESCRIPTION,
          mimeType
        );
        uploadedAttachments.push({
          REQUEST_NO: NEW_REQUEST_NO,
          DESCRIPTION: att.DESCRIPTION,
          COMMENT: headData.COMMENT || "",
          TYPE: mimeType,
          URL,
          LAST_UPDATED_ON: new Date(),
          CREATED_ON: new Date(),
        });
      }

      // Prepare documents
      const headDoc = {
        REQUEST_NO: NEW_REQUEST_NO,
        SERVICE_PERIOD: headData.SERVICE_PERIOD,
        PO_NUMBER: headData.PO_NUMBER,
        SERVICE_LOCATION: headData.SERVICE_LOCATION,
        PERSON_RESPONSIBLE: headData.PERSON_RESPONSIBLE,
        LAST_UPDATED_ON: new Date(),
        CREATED_ON: new Date(),
        PROCESS_LEVEL: "SES",
        APPROVER_ROLE: approverDetails.APPROVER_ROLE,
        REQUESTER_ID: "amiya@airditsoftware.com",
        APPROVER_LEVEL: 1,
        CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
        COMPANY_CODE: headData.COMPANY_CODE,
        SUPPLIER_NUMBER: headData.SUPPLIER_NUMBER,
        SUPPLIER_NAME: headData.SUPPLIER_NAME,
        SES_STATUS: `In-Process ${approverDetails.APPROVER_ROLE}`,
        VENDOR_STATUS: "In-Approval",
        AMOUNT: headData.AMOUNT,
      };

      const itemDocs = serviceitem.map((item, index) => {
        const serviceQuantity = parseFloat(item.SERVICE_QUANTITY) || 0;
        const usedValue = serviceQuantity * (item.UNIT_PRICE || 0);

        return {
          REQUEST_NO: NEW_REQUEST_NO,
          SR_NO: item.SR_NO || index + 1,
          SERVICE_NUMBER: item.SERVICE_NUMBER,
          SERVICE_DESCRIPTION: item.SERVICE_DESCRIPTION,
          ORDERED_QUANTITY: item.ORDERED_QUANTITY,
          UNIT_OF_MEASURE: item.UNIT_OF_MEASURE,
          UNIT_PRICE: item.UNIT_PRICE,
          SERVICE_QUANTITY: serviceQuantity,
          TOTAL_PRICE: usedValue,
          ITEM_NUMBER: item.ITEM_NUMBER,
          PO_NUMBER: headData.PO_NUMBER,
          LAST_UPDATED_ON: new Date(),
          CREATED_ON: new Date(),
          STATUS: "Pending",
          packno: item.packno ?? "",
          introw: item.introw ?? "",
          packageNofromPO: item.packageNofromPO ?? "",
        };
      });

      // Database operations
      const HeadCollection = database.collection("SES_HEAD");
      const ItemCollection = database.collection("SES_ITEM");
      const AttachmentCollection = database.collection("SES_ATTACHMENT");

      await HeadCollection.insertOne(headDoc);

      if (itemDocs.length > 0) {
        await ItemCollection.insertMany(itemDocs);
      }

      if (uploadedAttachments.length > 0) {
        await AttachmentCollection.insertMany(uploadedAttachments);
      }

      await database.collection("SES_CREATION_LOGS").insertOne({
        REQUEST_NO: NEW_REQUEST_NO,
        APPROVAL_LEVEL: 0,
        APPROVER_ID: "vendor@gmail.com",
        APPROVER_ROLE: "VENDOR",
        ACTION: "CREATE",
        COMMENT: "SES created by Supplier",
        TIMESTAMP: new Date(),
        PO_NUMBER: headData.PO_NUMBER,
        AMOUNT: TOTAL_AMOUNT,
      });

      await database.collection("SES_APPROVAL_NO").insertOne({
        REQUEST_NO: NEW_REQUEST_NO,
        ApprovalLevel: 1,
      });

      // Send email (non-critical - if it fails, we still return success)
      try {
        const emailSubject = `Action Required: Approval Pending for SES ${NEW_REQUEST_NO}`;
        const emailBody = emailTemplates.ApproverMailBodyForSES(
          approverDetails.CURRENT_ASSIGNEE,
          headData.SUPPLIER_NUMBER,
          NEW_REQUEST_NO,
          headDoc.CREATED_ON.toISOString().split("T")[0],
          TOTAL_AMOUNT
        );

        await lib_email.sendEmail(
          approverDetails.CURRENT_ASSIGNEE,
          "amiyapradhan1999@gmail.com",
          "html",
          emailSubject,
          emailBody
        );
      } catch (emailError) {
        console.error(
          `❌ Email sending failed for SES ${NEW_REQUEST_NO}:`,
          emailError
        );
        // Continue execution even if email fails
      }

      return {
        returnMessage: `SES ${NEW_REQUEST_NO} submitted successfully and Request sent for approval`,
      };
    } catch (error) {
      console.error(`❌ SES Creation failed:`, error);
      return req.reject(500, `SES creation failed: ${error.message}`);
    }
  });

  srv.on("editSES", async (req) => {
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

      // 2. Required field validation
      if (!REQUEST_NO) {
        return req.reject(400, "REQUEST_NO must be provided for EDIT action.");
      }

      const requiredFields = [
        "SERVICE_PERIOD",
        "SERVICE_LOCATION",
        "COMPANY_CODE",
        "PO_NUMBER",
        "PERSON_RESPONSIBLE",
        "AMOUNT",
      ];

      const missingFields = requiredFields.filter((field) => !headData[field]);
      if (missingFields.length > 0) {
        return req.reject(
          400,
          `Missing required fields: ${missingFields.join(", ")}`
        );
      }

      // 3. Attachment validation
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        if (!att.DESCRIPTION) {
          return req.reject(
            400,
            `Attachment at index ${i} must include DESCRIPTION`
          );
        }
        if (!att.base64value && !att.URL) {
          return req.reject(
            400,
            `Attachment at index ${i} must include either base64value or URL`
          );
        }
        if (att.base64value) {
          const mimeType = await getMimeTypeFromBase64(att.base64value);
          if (!mimeToExtensionMap[mimeType]) {
            return req.reject(
              500,
              `Unsupported MIME type: ${mimeType} for attachment at index ${i}`
            );
          }
        }
      }

      // 4. Database record validation
      const { database } = await getConnection();
      const HeadCollection = database.collection("SES_HEAD");
      const ItemCollection = database.collection("SES_ITEM");
      const AttachmentCollection = database.collection("SES_ATTACHMENT");

      const existingHead = await HeadCollection.findOne({ REQUEST_NO });
      if (!existingHead) {
        return req.reject(
          400,
          `No SES_HEAD record found for REQUEST_NO: ${REQUEST_NO}`
        );
      }

      const existingItems = await ItemCollection.find({ REQUEST_NO }).toArray();
      if (!existingItems || existingItems.length === 0) {
        return req.reject(
          400,
          `No SES_ITEM records found for REQUEST_NO: ${REQUEST_NO}`
        );
      }

      // 5. Approver validation
      const approverDetails = await fetchApprover(headData.COMPANY_CODE);
      if (!approverDetails) {
        return req.reject(
          400,
          `Failed to fetch approver details for COMPANY_CODE: ${headData.COMPANY_CODE}`
        );
      }

      // ==================== CRUD OPERATIONS PHASE ====================

      const editLog = {
        REQUEST_NO,
        APPROVAL_LEVEL: 0,
        APPROVER_ID: "vendor@gmail.com",
        APPROVER_ROLE: "VENDOR",
        ACTION: "EDIT_RESUBMIT",
        COMMENT: "SES edited and resubmitted by Supplier",
        TIMESTAMP: new Date(),
        PO_NUMBER: headData.PO_NUMBER,
        STATUS: "IN_PROGRESS",
        AMOUNT: TOTAL_AMOUNT,
      };

      // 1. Log edit action FIRST
      await database.collection("SES_CREATION_LOGS").insertOne(editLog);

      // 2. Update SES_HEAD with only changed fields
      const headUpdateData = {
        SERVICE_PERIOD: headData.SERVICE_PERIOD,
        SERVICE_LOCATION: headData.SERVICE_LOCATION,
        PERSON_RESPONSIBLE: headData.PERSON_RESPONSIBLE,
        LAST_UPDATED_ON: new Date(),
        AMOUNT: headData.AMOUNT,
        PO_NUMBER: headData.PO_NUMBER,
        CURRENT_ASSIGNEE: approverDetails.CURRENT_ASSIGNEE,
        APPROVER_LEVEL: 1,
        APPROVER_ROLE: approverDetails.APPROVER_ROLE,
        SES_STATUS: `In-Process ${approverDetails.APPROVER_ROLE}`,
        VENDOR_STATUS: "In-Approval",
        COMMENT: headData.COMMENT || "",
        SUPPLIER_NUMBER: headData.SUPPLIER_NUMBER,
        SUPPLIER_NAME: headData.SUPPLIER_NAME,
        STATUS: 3,
      };

      await HeadCollection.updateOne({ REQUEST_NO }, { $set: headUpdateData });

      // 3. Update existing SES_ITEM records only (PATCH approach)
      const bulkItemOperations = [];

      for (const item of serviceitem) {
        // Only process items that have SR_NO (existing items)
        if (item.SR_NO) {
          const serviceQuantity = parseFloat(item.SERVICE_QUANTITY) || 0;
          const usedValue = serviceQuantity * (item.UNIT_PRICE || 0);

          const itemUpdateData = {
            SERVICE_NUMBER: item.SERVICE_NUMBER,
            SERVICE_DESCRIPTION: item.SERVICE_DESCRIPTION,
            ORDERED_QUANTITY: item.ORDERED_QUANTITY,
            UNIT_OF_MEASURE: item.UNIT_OF_MEASURE,
            UNIT_PRICE: item.UNIT_PRICE,
            SERVICE_QUANTITY: serviceQuantity,
            TOTAL_PRICE: usedValue,
            ITEM_NUMBER: item.ITEM_NUMBER,
            PO_NUMBER: headData.PO_NUMBER,
            LAST_UPDATED_ON: new Date(),
            STATUS: "Pending",
            packno: item.packno ?? "",
            introw: item.introw ?? "",
            packageNofromPO: item.packageNofromPO ?? "",
          };

          bulkItemOperations.push({
            updateOne: {
              filter: { REQUEST_NO, SR_NO: item.SR_NO },
              update: { $set: itemUpdateData },
            },
          });
        }
      }

      if (bulkItemOperations.length > 0) {
        await ItemCollection.bulkWrite(bulkItemOperations);
      }

      // 4. Update existing attachments only (PATCH approach)
      const bulkAttachmentOperations = [];

      for (const att of attachments) {
        // Only process attachments that have ATTACHMENT_ID (existing attachments)
        if (att.ATTACHMENT_ID) {
          const { base64value, DESCRIPTION, URL } = att;

          let finalUrl = URL;
          let mimeType = "";

          if (base64value) {
            mimeType = await getMimeTypeFromBase64(base64value);
            finalUrl = await uploadImageToAzure(
              base64value,
              DESCRIPTION,
              mimeType
            );
          } else {
            mimeType = URL.split(".").pop();
          }

          const attachmentData = {
            DESCRIPTION,
            TYPE: mimeType,
            URL: finalUrl,
            LAST_UPDATED_ON: new Date(),
          };

          bulkAttachmentOperations.push({
            updateOne: {
              filter: { REQUEST_NO, _id: att.ATTACHMENT_ID },
              update: { $set: attachmentData },
            },
          });
        }
        // Attachments without ATTACHMENT_ID are ignored (no new attachments in edit)
      }

      if (bulkAttachmentOperations.length > 0) {
        await AttachmentCollection.bulkWrite(bulkAttachmentOperations);
      }

      // 5. Reset SES_APPROVAL_NO level
      await database
        .collection("SES_APPROVAL_NO")
        .updateOne({ REQUEST_NO }, { $set: { ApprovalLevel: 1 } });

      // 6. Update edit log with success status
      // await database.collection("SES_CREATION_LOGS").updateOne(
      //   { REQUEST_NO, ACTION: "EDIT_RESUBMIT" },
      //   {
      //     $set: {
      //       AMOUNT: TOTAL_AMOUNT,
      //       STATUS: "COMPLETED",
      //       UPDATED_TIMESTAMP: new Date(),
      //     },
      //   }
      // );

      // 7. Send email notification (non-blocking)
      try {
        const emailSubject = `Action Required: Edited SES ${REQUEST_NO} resubmitted for approval`;
        const emailBody = emailTemplates.ApproverMailBodyForSES(
          approverDetails.CURRENT_ASSIGNEE,
          headData.SUPPLIER_NUMBER,
          REQUEST_NO,
          new Date().toISOString().split("T")[0],
          TOTAL_AMOUNT
        );

        await lib_email.sendEmail(
          approverDetails.CURRENT_ASSIGNEE,
          "amiyapradhan1999@gmail.com",
          "html",
          emailSubject,
          emailBody
        );
      } catch (emailError) {
        console.error(
          `❌ Email sending failed for SES ${REQUEST_NO}:`,
          emailError
        );
      }

      return {
        returnMessage: `SES ${REQUEST_NO} edited and resubmitted successfully.`,
        status: "COMPLETED",
      };
    } catch (error) {
      console.error(`❌ SES Edit failed:`, error);
      return req.reject(500, `SES edit failed: ${error.message}`);
    }
  });

  cron.schedule("*/15 * * * *", async () => {
    try {
      const [headData, itemData] = await Promise.all([
        fetchAllHeadData(),
        fetchAllItemData(),
      ]);

      const { database } = await getConnection();

      // Bulk upsert Header Data
      if (headData.length > 0) {
        await bulkUpsertHeadData(database, headData);
      }

      // Bulk upsert Item Data
      if (itemData.length > 0) {
        await bulkUpsertItemData(database, itemData);
      }
    } catch (err) {
      console.error("[CRON] SES sync failed:", err.message);
    }
  });

  // Separate function for bulk upserting head data
  async function bulkUpsertHeadData(database, headData) {
    const headColl = database.collection("ZP_AISP_SES_HDR");

    const headOperations = headData.map((doc) => ({
      updateOne: {
        filter: { Ebeln: doc.Ebeln },
        update: {
          $set: {
            ...doc,
            Aedat: new Date(doc.Aedat),
            bedat: new Date(doc.bedat),
            Amount: parseFloat(doc.Amount),
            from_date: new Date(doc.from_date),
            end_date: new Date(doc.end_date),
            LAST_UPDATED_ON: new Date(),
          },
          $setOnInsert: {
            CREATED_ON: new Date(),
          },
        },
        upsert: true,
      },
    }));

    // Process in batches of 500
    for (let i = 0; i < headOperations.length; i += 500) {
      const batch = headOperations.slice(i, i + 500);
      const result = await headColl.bulkWrite(batch, { ordered: false });
    }
  }

  // Separate function for bulk upserting item data
  async function bulkUpsertItemData(database, itemData) {
    const itemColl = database.collection("ZP_AISP_SES_ITEM_DETAIL");

    const itemOperations = itemData
      .filter(
        (doc) =>
          doc.Ebeln && doc.Ebelp && doc.packno != null && doc.introw != null
      )
      .map((doc) => {
        const totalPrice =
          parseFloat(doc.tbtwr || 0) * parseFloat(doc.menge || 0);

        return {
          updateOne: {
            filter: {
              PO_NUMBER: doc.Ebeln,
              ITEM_NUMBER: doc.Ebelp,
              packno: doc.packno,
              introw: doc.introw,
            },
            update: {
              $set: {
                PO_NUMBER: doc.Ebeln,
                ITEM_NUMBER: doc.Ebelp,
                packno: doc.packno,
                introw: doc.introw,
                SR_NO: doc.extrow || "",
                SERVICE_NUMBER: doc.srvpos || "",
                SERVICE_DESCRIPTION: doc.ktext1 || "",
                ORDERED_QUANTITY: parseInt(doc.menge || 0),
                UNIT_OF_MEASURE: doc.meins || "",
                UNIT_PRICE: parseFloat(doc.tbtwr || 0),
                SERVICE_QUANTITY: parseInt(doc.act_menge),
                TOTAL_PRICE: totalPrice,
                packageNofromPO: doc.packageNofromPO,
                LAST_UPDATED_ON: new Date(),
              },
              $setOnInsert: {
                CREATED_ON: new Date(),
              },
            },
            upsert: true,
          },
        };
      });

    // Process in batches of 500
    for (let i = 0; i < itemOperations.length; i += 500) {
      const batch = itemOperations.slice(i, i + 500);
      const result = await itemColl.bulkWrite(batch, { ordered: false });
    }
  }

  // Fetch functions (same as before)
  async function fetchAllHeadData(pageSize = 500) {
    const allData = [];
    let skip = 0;

    try {
      const ZP_AISP_SES_UPSES_SRB = await cds.connect.to(
        "ZP_AISP_SES_UPSES_SRB"
      );

      while (true) {
        const page = await ZP_AISP_SES_UPSES_SRB.run(
          SELECT.from("ZP_AISP_SES_HDR").limit(pageSize, skip)
        );

        if (!page.length) break;

        allData.push(...page);
        skip += page.length;

        if (page.length < pageSize) break;
      }
    } catch (error) {
      console.error("Error fetching head data:", error.message);
    }

    return allData;
  }

  async function fetchAllItemData(pageSize = 500) {
    const allData = [];
    let skip = 0;

    try {
      const ZP_AISP_SES_UPSES_SRB = await cds.connect.to(
        "ZP_AISP_SES_UPSES_SRB"
      );

      while (true) {
        const page = await ZP_AISP_SES_UPSES_SRB.run(
          SELECT.from("ZP_AISP_SES_ITEM_DETAIL").limit(pageSize, skip)
        );

        if (!page.length) break;

        allData.push(...page);
        skip += page.length;

        if (page.length < pageSize) break;
      }
    } catch (error) {
      console.error("Error fetching item data:", error.message);
    }

    return allData;
  }
};
