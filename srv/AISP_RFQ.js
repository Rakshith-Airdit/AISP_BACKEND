const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");
const cron = require("node-cron");
const { BlobServiceClient } = require("@azure/storage-blob");
const fileType = require("file-type");
const ExcelJS = require("exceljs");
const {
  createQuotationAgainstRFQInS4HANA,
  createSupplierQuotationInS4,
  updateQuotationItemsInS4,
} = require("./Library/RFQConfirmation");

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

    // Fallback to magic number (file signature)
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
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // could be zip/docx/xlsx
      case "D0CF11E0":
        return "application/vnd.ms-outlook";
      default:
        console.warn(`Unknown file signature: ${signature}`);
        return "application/pdf";
    }
  } catch (err) {
    console.error("Error detecting MIME type:", err.message);
    return "application/pdf";
  }
}

async function generateExcel(groupsData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Mass Upload");
  workbook.calcProperties.fullCalcOnLoad = true;
  // Get current date for validation
  const currentDate = new Date();
  const currentDateExcel =
    Math.floor((currentDate - new Date(1900, 0, 1)) / (24 * 60 * 60 * 1000)) +
    2; // Excel date serial number

  let currentRow = 1;
  const COLUMNS = {
    ITEM_NO: 1,
    MATERIAL_DESC: 2,
    UOM: 3,
    PLANT: 4,
    REQUIRED_QTY: 5,
    NET_PRICE: 6,
    TOTAL_PRICE: 7,
    DELIVERY_DATE: 8,
    EXPECTED_DELIVERY_DATE: 9,
  };

  // Create worksheet content
  for (const [groupName, groupData] of Object.entries(groupsData)) {
    // Group header
    worksheet.addRow([groupName]);
    worksheet.getCell(`A${currentRow}`).style = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: "center" },
    };
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    currentRow++;

    // Column headers
    worksheet.addRow([
      "Item No",
      "Material No - Description",
      "UOM",
      "Plant",
      "Required Quantity",
      "Net Price - INR",
      "Total Price",
      "Delivery Date (yyyy-mm-dd)",
      "Expected Delivery Date (yyyy-mm-dd)",
    ]);
    worksheet.getRow(currentRow).eachCell((cell) => {
      cell.style = {
        font: { bold: true },
        alignment: { horizontal: "center" },
      };
    });
    currentRow++;

    // Data rows
    groupData.forEach((row) => {
      const newRow = worksheet.addRow([
        row.itemNo,
        row.materialNoDesc,
        row.uom,
        row.plant,
        row.requiredQuantity,
        "", // Empty netPrice initially
        row.totalPrice, // Static initial value
        "",
        "",
      ]);

      // Formatting
      newRow.getCell(COLUMNS.REQUIRED_QTY).numFmt = "#,##0";
      newRow.getCell(COLUMNS.NET_PRICE).numFmt = '"₹" #,##0';
      newRow.getCell(COLUMNS.TOTAL_PRICE).numFmt = '"₹" #,##0';
      newRow.getCell(COLUMNS.DELIVERY_DATE).numFmt = "yyyy-mm-dd;@"; // @ preserves text format
      newRow.getCell(COLUMNS.EXPECTED_DELIVERY_DATE).numFmt = "yyyy-mm-dd;@";

      // Set formula that will calculate when netPrice is entered
      const totalPriceCell = newRow.getCell(COLUMNS.TOTAL_PRICE);

      totalPriceCell.value = {
        formula: `IF(ISBLANK(F${currentRow}), ${row.totalPrice}, E${currentRow}*F${currentRow})`,
        date1904: false,
      };

      // COMPREHENSIVE DATA VALIDATION FOR DATES
      const dateValidation = {
        type: "custom",
        formulae: [
          // Check if it's a valid date (not text, not random numbers)
          `AND(ISNUMBER(H${currentRow}), H${currentRow}>=1, H${currentRow}<=50000)`,
          // Check if date is not less than current date
          `H${currentRow}>=${currentDateExcel}`,
        ],
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "Invalid Date",
        error:
          "Please enter a valid date in yyyy-mm-dd format. Date cannot be less than current date.",
      };

      worksheet.getCell(`H${currentRow}`).dataValidation = dateValidation;
      worksheet.getCell(`I${currentRow}`).dataValidation = dateValidation;

      currentRow++;
    });

    // Add empty row between groups
    worksheet.addRow([]);
    currentRow++;
  }

  // Auto-adjust column widths
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellLength = cell.value ? cell.value.toString().length : 0;
      if (cellLength > maxLength) maxLength = cellLength;
    });
    column.width = Math.max(10, maxLength + 2);
  });

  // Apply borders to all data cells
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Freeze headers
  worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

  // Protect sheet (only allow editing netPrice)
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.protection = { locked: true };
    });
  });

  // Unlock editable columns: Net Price, Delivery Date, Expected Delivery Date
  for (let i = 3; i <= currentRow; i++) {
    // Unlock Net Price column (F)
    const netPriceCell = worksheet.getCell(`F${i}`);
    if (netPriceCell) {
      netPriceCell.protection = { locked: false };
    }

    // Unlock Delivery Date column (H)
    const deliveryDateCell = worksheet.getCell(`H${i}`);
    if (deliveryDateCell) {
      deliveryDateCell.protection = { locked: false };
    }

    // Unlock Expected Delivery Date column (I)
    const expectedDateCell = worksheet.getCell(`I${i}`);
    if (expectedDateCell) {
      expectedDateCell.protection = { locked: false };
    }
  }

  worksheet.protect("Airdit@123$", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
  });

  // Generate buffer
  return workbook.xlsx.writeBuffer();
}

function isBase64(str) {
  // Check if the string is a valid base64 string
  const base64Regex = /^[A-Za-z0-9+/=]*$/; // Matches valid base64 characters
  const base64LengthCheck = str.length % 4 === 0; // Length should be a multiple of 4

  return base64Regex.test(str) && base64LengthCheck;
}

async function uploadImageToAzure(base64, originalName, mimeType) {
  let finalMimeType = mimeType;

  // If no MIME type is provided, try to determine it from the base64 string
  if (!finalMimeType) {
    finalMimeType = await getMimeTypeFromBase64(base64);
    if (!finalMimeType) {
      console.warn(
        "Unable to determine MIME type, falling back to application/pdf"
      );
      finalMimeType = "application/pdf"; // Default fallback
    }
  }

  const extension = mimeToExtensionMap[finalMimeType];
  if (!extension) {
    throw new Error(`No extension found for MIME type: ${finalMimeType}`);
  }

  // Ensure the file name is safe for Azure Blob Storage
  const safeName = originalName.replace(/\s+/g, "_");
  const fileName = `${safeName}.${extension}`;

  // Set up the Azure Blob Service client and container client
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  // Convert the base64 string to a buffer
  const buffer = Buffer.from(base64, "base64");

  // Upload the file to Azure Blob Storage
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: finalMimeType },
  });

  // Return the URL of the uploaded blob
  return blockBlobClient.url;
}

function flattenXpr(expr) {
  return expr.reduce((acc, tok) => {
    if (tok.xpr) {
      acc.push(...flattenXpr(tok.xpr));
    } else {
      acc.push(tok);
    }
    return acc;
  }, []);
}

function buildMongoQuery(whereClause) {
  if (!Array.isArray(whereClause)) return {};

  const query = {};

  for (let i = 0; i < whereClause.length; i++) {
    const clause = whereClause[i];
    if (clause.xpr) {
      const parts = flattenXpr(clause.xpr);
      for (let j = 0; j < parts.length; j += 4) {
        const field = parts[j]?.ref?.[0];
        const op = parts[j + 1];
        const val = parts[j + 2]?.val;
        if (!field || val === undefined) continue;

        switch (op) {
          case "=":
            query.$or = query.$or || [];
            query.$or.push({ [field]: val });
            break;
          case "!=":
            query.$or = query.$or || [];
            query.$or.push({ [field]: { $ne: val } });
            break;
          case ">":
            query.$or = query.$or || [];
            query.$or.push({ [field]: { $gt: val } });
            break;
          case ">=":
            query.$or = query.$or || [];
            query.$or.push({ [field]: { $gte: val } });
            break;
          case "<":
            query.$or = query.$or || [];
            query.$or.push({ [field]: { $lt: val } });
            break;
          case "<=":
            query.$or = query.$or || [];
            query.$or.push({ [field]: { $lte: val } });
            break;
          default:
            throw new Error(`Unsupported op: ${op}`);
        }
      }
    } else if (clause.ref) {
      const field = clause.ref[0];
      const op = whereClause[i + 1];
      const val = whereClause[i + 2]?.val;
      if (!field || val === undefined) {
        i += 2;
        continue;
      }

      switch (op) {
        case "=":
          query[field] = val;
          break;
        case "!=":
          query[field] = { $ne: val };
          break;
        case ">":
          query[field] = { $gt: val };
          break;
        case ">=":
          query[field] = { $gte: val };
          break;
        case "<":
          query[field] = { $lt: val };
          break;
        case "<=":
          query[field] = { $lte: val };
          break;
        default:
          throw new Error(`Unsupported op: ${op}`);
      }
      i += 2;
    }
  }
  return query;
}

function buildMongoSearch(searchQuery, fields) {
  const regex = new RegExp(searchQuery, "i"); // 'i' for case-insensitive search
  const searchConditions = {};

  // Create search conditions for multiple fields
  fields.forEach((field) => {
    searchConditions[field] = regex;
  });

  return searchConditions;
}

function buildMongoOrderby(orderByClause) {
  const sort = {};

  // Dynamically handle multiple orderBy clauses
  orderByClause.forEach((clause) => {
    const field = clause.ref[0];
    const order = clause.sort === "desc" ? -1 : 1;
    sort[field] = order;
  });

  return sort;
}

function buildMongoSelect(columns) {
  const fields = {};

  for (const col of columns) {
    // Handle wildcard "*" (select all fields)
    if (col === "*" || (col.ref && col.ref[0] === "*")) {
      return {}; // Empty projection = select all in Mongo
    }

    if (col.ref && typeof col.ref[0] === "string") {
      fields[col.ref[0]] = 1;
    }
  }

  return fields;
}

// Helper function to handle pagination using $limit and $offset
function buildPagination(req) {
  let skip = 0;
  let limit = 10; // Default value if none provided

  if (req.query && req.query.SELECT && req.query.SELECT.limit) {
    const { limit: limitObj } = req.query.SELECT;

    if (limitObj.rows && typeof limitObj.rows.val === "number") {
      limit = limitObj.rows.val;
    }

    if (limitObj.offset && typeof limitObj.offset.val === "number") {
      skip = limitObj.offset.val;
    }
  }

  return { skip, limit };
}

// Main function to build query options for MongoDB based on the request parameters
async function buildQuery(req, searchFields = []) {
  let query = {};
  let sortOrder = {};
  let selectFields = {};

  // Handle $filter (build Mongo query from OData $filter)
  if (req.query.SELECT.where) {
    query = buildMongoQuery(req.query.SELECT.where);
  }

  // Handle search-focus and search (build search condition with regex)
  if (req._queryOptions?.search) {
    const searchField = req._queryOptions?.["search-focus"];
    let searchValue = req._queryOptions?.search;

    // Ensure the search value is treated as a string
    if (typeof searchValue !== "string") {
      searchValue = String(searchValue);
    }

    // Only add search condition if both the field and value are valid
    if (searchField && searchValue) {
      const escapedSearchValue = escapeRegexString(searchValue);
      query[searchField] = new RegExp(escapedSearchValue, "i");
    }
  }

  // Handle $orderby (sort results based on $orderby)
  if (req.query.SELECT.orderBy) {
    sortOrder = buildMongoOrderby(req.query.SELECT.orderBy);
  }

  // Handle $select (limit the fields returned based on $select)
  if (req.query.SELECT.columns) {
    selectFields = buildMongoSelect(req.query.SELECT.columns);
  }

  return { query, sortOrder, selectFields };
}

function escapeRegexString(str) {
  if (typeof str !== "string") {
    throw new Error("The input to escapeRegexString must be a string");
  }
  return str.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&"); // Escape special characters
}

// Helper function to process worksheet data
async function processWorksheet(worksheet, rfqNumber) {
  const validItems = [];
  const invalidItems = [];
  let currentLotType = null;

  worksheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
    try {
      // Skip header rows (first 2 rows)
      if (rowIndex <= 2) {
        // Check for lot type header (merged cells in column A)
        if (row.getCell(1).isMerged && row.getCell(1).value) {
          currentLotType = row.getCell(1).value.toString().trim();
        }
        return;
      }

      // Skip empty rows
      if (!row.getCell(1).value) return;

      // Extract and validate row data
      const item = {
        RfqNumber: rfqNumber,
        ItemNumber: validateRequired(row.getCell(1).value, "Item Number"),
        MaterialNo: extractMaterialNo(row.getCell(2).value),
        MaterialDesc: extractMaterialDesc(row.getCell(2).value),
        UnitOfMeasure: validateRequired(row.getCell(3).value, "UOM"),
        Plant: validateRequired(row.getCell(4).value, "Plant"),
        Quantity: validateNumber(row.getCell(5).value, "Quantity"),
        Netpr: validateNumber(row.getCell(6).value, "Net Price"),
        Netwr: calculateNetValue(row.getCell(5).value, row.getCell(6).value),
        LotType: currentLotType,
        CREATED_ON: new Date(),
        LAST_UPDATED_ON: new Date(),
      };

      validItems.push(item);
    } catch (error) {
      invalidItems.push({
        row: rowIndex,
        field: error.field || "unknown",
        error: error.message,
        value: error.value || "",
      });
    }
  });

  return { validItems, invalidItems };
}

// Validation helpers
function validateRequired(value, fieldName) {
  if (!value || value.toString().trim() === "") {
    throw { message: `${fieldName} is required`, field: fieldName, value };
  }
  return value.toString().trim();
}

function validateNumber(value, fieldName) {
  const num = Number(value);
  if (isNaN(num)) {
    throw { message: `${fieldName} must be a number`, field: fieldName, value };
  }
  return num;
}

function extractMaterialNo(value) {
  const parts = value?.toString().split("-") || [];
  return parts[0]?.trim() || "";
}

function extractMaterialDesc(value) {
  const parts = value?.toString().split("-") || [];
  return parts.length > 1 ? parts.slice(1).join("-").trim() : "";
}

function calculateNetValue(quantity, price) {
  const qty = Number(quantity) || 0;
  const prc = Number(price) || 0;
  return qty * prc;
}

module.exports = async (srv) => {
  // Using CDS API
  const ZC_AISP_RFQ_HDR_BND = await cds.connect.to("ZC_AISP_RFQ_HDR_BND");
  // srv.on('READ', 'ZC_AISP_RFQ_HDR', req => ZC_AISP_RFQ_HDR_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_RFQ_ITEM', req => ZC_AISP_RFQ_HDR_BND.run(req.query));

  srv.on("READ", "ZC_AISP_RFQ_HDR", async (req) => {
    try {
      const { database } = await getConnection();
      const RFQHeadercoll = database.collection("ZC_AISP_RFQ_HDR");
      const RFQWorkHeadercoll = database.collection("ZC_AISP_RFQ_WORK_HDR");

      // 1) Paging + base query (from your helpers)
      const { skip = 0, limit = 100 } = buildPagination(req);
      const { query = {}, sortOrder } = await buildQuery(req);

      // 2) Pull Status filter out; we'll reapply AFTER status sync
      const statusFilter = query.Status;
      const queryWithoutStatus = { ...query };
      delete queryWithoutStatus.Status;

      // 3) Load work header snapshots (no paging here)
      const [draftWork, nonDraftWork] = await Promise.all([
        RFQWorkHeadercoll.find(
          { Status: "Draft" },
          { projection: { RfqNumber: 1, Bidder: 1 } }
        ).toArray(),
        RFQWorkHeadercoll.find(
          { Status: { $ne: "Draft" } },
          { projection: { RfqNumber: 1, Bidder: 1, Status: 1 } }
        ).toArray(),
      ]);

      const key = (rn, bd) => `${rn}_${bd}`;
      const draftKeys = new Set(
        draftWork.map((h) => key(h.RfqNumber, h.Bidder))
      );
      const workStatus = new Map(
        nonDraftWork.map((h) => [key(h.RfqNumber, h.Bidder), h.Status])
      );

      // 4) Read ALL headers that match base filters (WITHOUT paging)
      //    We'll exclude draft pairs in-memory to avoid huge $nor queries.
      const headerDocs = await RFQHeadercoll.find(
        queryWithoutStatus,
        { projection: { _id: 0 } } // keep it lean
      ).toArray();

      // 5) Exclude any header whose pair is in draft
      const noDraftHeaders = headerDocs.filter(
        (h) => !draftKeys.has(key(h.RfqNumber, h.Bidder))
      );

      // 6) Compute effective Status (work non-draft overrides)
      const merged = noDraftHeaders.map((h) => {
        const k = key(h.RfqNumber, h.Bidder);
        const ws = workStatus.get(k);
        return ws ? { ...h, Status: ws } : h;
      });

      // 7) Re-apply Status filter AFTER merge (so it’s effective)
      const matchesStatus = (row, f) => {
        if (!f) return true;
        if (typeof f === "string") return row.Status === f;
        if (f.$ne !== undefined) return row.Status !== f.$ne;
        if (Array.isArray(f.$in)) return f.$in.includes(row.Status);
        if (Array.isArray(f.$nin)) return !f.$nin.includes(row.Status);
        // extend for >, >=, etc if you ever need
        return true;
      };
      const filtered = merged.filter((h) => matchesStatus(h, statusFilter));

      // 8) Sort newest first (use CREATED_ON desc; fallback RfqNumber desc)
      filtered.sort((a, b) => {
        const aC = a.CREATED_ON ? new Date(a.CREATED_ON).getTime() : 0;
        const bC = b.CREATED_ON ? new Date(b.CREATED_ON).getTime() : 0;
        if (bC !== aC) return bC - aC;
        return (b.RfqNumber ?? 0) - (a.RfqNumber ?? 0);
      });

      // 9) Page AFTER filtering
      const total = filtered.length;
      const page = filtered.slice(skip, skip + limit);
      page["$count"] = total;

      return page;
    } catch (error) {
      console.error("Failed to fetch RFQ headers:", error);
      req.error(500, "Failed to retrieve RFQ headers. Please try again later.");
    }
  });

  // // Master Tables - Item Table
  // // Readonly
  srv.on("READ", "ZC_AISP_RFQ_ITEM", async (req) => {
    try {
      const { database } = await getConnection();
      const RFQItemcoll = database.collection("ZC_AISP_RFQ_ITEM");

      // Handle pagination using $top and $skip
      const { skip, limit } = buildPagination(req);

      const { query, sortOrder } = await buildQuery(req);

      const result = await RFQItemcoll.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      result["$count"] = result.length;
      return result;
    } catch (error) {
      console.error("Error reading ZC_AISP_RFQ_ITEM from MongoDB:", error);
      req.error(500, "Internal Server Error while fetching RFQ Item data.");
    }
  });

  // Clone Tables - Header Table
  srv.on("READ", "ZC_AISP_RFQ_WORK_HDR", async (req) => {
    try {
      const { database } = await getConnection();
      const RFQHeadercoll = database.collection("ZC_AISP_RFQ_WORK_HDR");
      const RFQItemcoll = database.collection("ZC_AISP_RFQ_WORK_ITEM");

      const searchFields = ["RfqNumber", "CREATED_ON", "CreatedBy", "Status"];

      // Handle pagination using $top and $skip
      const { skip, limit } = buildPagination(req);

      // Use the helper function to build query options dynamically
      const { query, sortOrder, selectFields } = await buildQuery(
        req,
        searchFields
      );

      // Handle $count (return the count of matching records)
      if (req._queryOptions?.$count === "true") {
        const count = await RFQHeadercoll.countDocuments(query);
        return { "@odata.count": count }; // Return count as @odata.count
      }

      // Fetch RFQ Header data with dynamic query options (filter, select, order, etc.)
      const headerData = await RFQHeadercoll.find(query, {
        projection: selectFields,
      })
        .sort(sortOrder) // Apply ordering
        .skip(skip) // Apply skip (pagination)
        .limit(limit) // Apply limit (pagination)
        .toArray();

      headerData["$count"] = headerData.length;

      return req.reply(headerData);
    } catch (error) {
      console.error("Error reading ZC_AISP_RFQ_WORK_HDR from MongoDB:", error);
      req.error(500, "Internal Server Error while fetching RFQ Header data.");
    }
  });

  // Clone Tables - Item Table
  srv.on("READ", "ZC_AISP_RFQ_WORK_ITEM", async (req) => {
    try {
      const { database } = await getConnection();
      const RFQItemcoll = database.collection("ZC_AISP_RFQ_WORK_ITEM");

      const searchFields = ["MaterialNo", "Quantity", "MaterialDesc"];

      // Handle pagination
      const { skip, limit } = buildPagination(req);

      // Build dynamic MongoDB query from CDS request
      const { query, sortOrder, selectFields } = await buildQuery(
        req,
        searchFields
      );

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await RFQItemcoll.countDocuments(query);
        return { "@odata.count": count };
      }

      // Fetch Item data
      const itemData = await RFQItemcoll.find(query, {
        projection: selectFields,
      })
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      // Construct response with optional count
      itemData["$count"] = itemData.length;

      return req.reply(itemData);
    } catch (error) {
      console.error("Error reading ZC_AISP_RFQ_ITEM from MongoDB:", error);
      req.error(500, "Internal Server Error while fetching RFQ Item data.");
    }
  });

  // Handler for fetching the supplier questions
  srv.on("READ", "SupplierPreReqQstns", async (req) => {
    try {
      const { database } = await getConnection();
      const questionsColl = database.collection("RFQ_QUESTION_CONFIG");

      const searchFields = ["QUESTION_TEXT", "QUESTION_TYPE"]; // Optional: customize

      // Handle pagination
      const { skip, limit } = buildPagination(req);

      // Build dynamic MongoDB query from CDS request
      const { query, sortOrder, selectFields } = await buildQuery(
        req,
        searchFields
      );

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await questionsColl.countDocuments(query);
        return { "@odata.count": count };
      }

      // Fetch the data
      const questionData = await questionsColl
        .find(query, { projection: selectFields })
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      questionData["$count"] = questionData.length;

      return req.reply(questionData);
    } catch (err) {
      console.error("[READ] SupplierQuestions failed:", err);
      req.error(500, "Failed to read supplier questions");
    }
  });

  // Handler for fetching the attachements uploaded
  srv.on("READ", "SupplierPreReqAttchmnts", async (req) => {
    try {
      const { database } = await getConnection();
      const attachmentsColl = database.collection(
        "VENDOR_ACCOUNT_GROUP_ATTACHMENT"
      );

      const searchFields = ["FILE_NAME", "FILE_URL"];

      // Handle pagination
      const { skip, limit } = buildPagination(req);

      // Build dynamic MongoDB query from CDS request
      const { query, sortOrder, selectFields } = await buildQuery(
        req,
        searchFields
      );

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await attachmentsColl.countDocuments(query);
        let data = {
          $count: count,
        };
        return data;
      }

      // Query by RfqNumber (assuming it's stored as a string)
      const attachments = await attachmentsColl
        .find(query, { projection: selectFields })
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      attachments["$count"] = attachments.length;

      return req.reply(attachments);
    } catch (err) {
      console.error("[READ] SupplierAttachments failed:", err);
      req.error(500, "Failed to read supplier attachment");
    }
  });

  // Handler for fetching the supplier questions [Points Functionality to be added]
  srv.on("READ", "SupplierResponses", async (req) => {
    try {
      const { database } = await getConnection();
      const responseColl = database.collection("RFQ_QUESTION_RESPONSES");

      // Handle pagination
      const { skip, limit } = buildPagination(req);

      // Build dynamic MongoDB query from CDS request
      const { query, sortOrder } = await buildQuery(req);

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await responseColl.countDocuments(query);
        return { "@odata.count": count };
      }

      // Fetch the data
      const responseData = await responseColl
        .find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      responseData["$count"] = responseData.length;

      return req.reply(responseData);
    } catch (err) {
      console.error("[READ] SupplierQuestions failed:", err);
      req.error(500, "Failed to read supplier questions");
    }
  });

  // Handler for fetching the supplier attachments
  srv.on("READ", "SupplierAttachments", async (req) => {
    try {
      const { database } = await getConnection();
      const attachmentColl = database.collection("RFQ_ATTACHMENT_RESPONSES");

      // Handle pagination
      const { skip, limit } = buildPagination(req);

      // Build dynamic MongoDB query from CDS request
      const { query, sortOrder } = await buildQuery(req);

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await attachmentColl.countDocuments(query);
        return { "@odata.count": count };
      }

      // Fetch the data
      const attachementsData = await attachmentColl
        .find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      attachementsData["$count"] = attachementsData.length;

      return req.reply(attachementsData);
    } catch (err) {
      console.error("[READ] SupplierQuestions failed:", err);
      req.error(500, "Failed to read supplier questions");
    }
  });

  // Deadline Date Passed Check
  srv.on("saveRFQResponseAndAttachments", async (req) => {
    const { RfqNumber, Bidder, ACCOUNT_GROUP, Responses, Attachments } =
      req.data;

    if (!RfqNumber || !Bidder || !ACCOUNT_GROUP) {
      return req.error(400, "Missing RfqNumber, Bidder, or ACCOUNT_GROUP");
    }

    if (!Array.isArray(Responses) || Responses.length === 0) {
      return req.error(400, "Missing Responses");
    }

    if (!Array.isArray(Attachments) || Attachments.length === 0) {
      return req.error(400, "Missing Attachments");
    }

    const { database } = await getConnection();
    const now = new Date();

    try {
      const SupplierQuestionsColl = database.collection("RFQ_QUESTION_CONFIG");
      const SupplierResponsesColl = database.collection(
        "RFQ_QUESTION_RESPONSES"
      );
      const RequiredAttachmentsColl = database.collection(
        "VENDOR_ACCOUNT_GROUP_ATTACHMENT"
      );
      const SupplierAttachmentsColl = database.collection(
        "RFQ_ATTACHMENT_RESPONSES"
      );
      const RFQWorkHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");

      const rfqHeader = await RFQWorkHeaderColl.findOne({ RfqNumber, Bidder });

      if (!rfqHeader) throw { code: 404, message: "RFQ Header not found" };

      if (["Not_Accepted", "Pending"].includes(rfqHeader.Status)) {
        throw { code: 400, message: "RFQ must be Accepted first" };
      } else if (rfqHeader.Status === "Awarded") {
        throw { code: 400, message: "RFQ is already awarded" };
      } else if (rfqHeader.Status === "Rejected") {
        throw { code: 400, message: "RFQ is already rejected" };
      } else if (rfqHeader.Status === "Submitted") {
        throw { code: 400, message: "RFQ is already submitted" };
      }

      // Duplicate check
      const existingResponse = await SupplierResponsesColl.findOne({
        RfqNumber,
        Bidder,
        ACCOUNT_GROUP,
      });
      if (existingResponse)
        throw {
          code: 400,
          message:
            "Responses already exist for this RFQ. Use edit function instead.",
        };

      const existingAttachments = await SupplierAttachmentsColl.findOne({
        RfqNumber,
        Bidder,
        ACCOUNT_GROUP,
      });
      if (existingAttachments)
        throw {
          code: 400,
          message:
            "Attachments already exist for this RFQ. Use edit function instead.",
        };

      // Validate questions
      const requiredQuestions = await SupplierQuestionsColl.find({
        ACCOUNT_GROUP,
        IS_ACTIVE: true,
      }).toArray();
      const requiredQIds = new Set(requiredQuestions.map((q) => q.QUESTION_ID));
      const receivedQIds = new Set(Responses.map((r) => r.QUESTION_ID));

      if (receivedQIds.size !== requiredQIds.size) {
        throw {
          code: 400,
          message: `Expected ${requiredQIds.size} responses, but received ${receivedQIds.size}`,
        };
      }

      for (const qid of receivedQIds) {
        if (!requiredQIds.has(qid)) {
          throw { code: 400, message: `Invalid QUESTION_ID: ${qid}` };
        }
      }

      // Calculate scores for responses
      let totalScore = 0;
      let maxPossibleScore = 0;
      const scoredResponses = [];

      for (const response of Responses) {
        if (!response.QUESTION_ID || !response.RESPONSE_TEXT) {
          throw {
            code: 400,
            message: "Each response must have QUESTION_ID and RESPONSE_TEXT",
          };
        }

        // Find the corresponding question
        const question = requiredQuestions.find(
          (q) => q.QUESTION_ID === response.QUESTION_ID
        );
        if (!question) continue;

        let earnedPoints = 0;
        let questionMaxPoints = 0; // Define questionMaxPoints here

        if (question.QUESTION_TYPE === "radio") {
          questionMaxPoints = question.ALLOTTED_POINTS || 0;
        } else if (question.QUESTION_TYPE === "dropdown") {
          dropDownValues = question.DROPDOWN_OPTIONS ?? [];
          questionMaxPoints = dropDownValues.reduce((sum, option) => {
            return sum + (option.POINTS || 0);
          }, 0);
        }

        // Validate dropdown responses
        if (question.QUESTION_TYPE === "dropdown") {
          if (
            !question.DROPDOWN_OPTIONS ||
            !Array.isArray(question.DROPDOWN_OPTIONS)
          ) {
            throw {
              code: 400,
              message: `Question ${response.QUESTION_ID} is a dropdown but has no valid options configured`,
            };
          }

          // Check if response is a valid option ID
          const isValidOption = question.DROPDOWN_OPTIONS.some(
            (option) => option.VALUE === response.RESPONSE_TEXT
          );

          if (!isValidOption) {
            const validOptions = question.DROPDOWN_OPTIONS.map(
              (opt) => opt.VALUE
            ).join(", ");
            throw {
              code: 400,
              message: `Invalid response for dropdown question ${response.QUESTION_ID}. Valid options are: ${validOptions}`,
            };
          }

          const selectedOption = question.DROPDOWN_OPTIONS.find(
            (opt) => opt.VALUE === response.RESPONSE_TEXT
          );
          if (selectedOption) {
            earnedPoints = selectedOption.POINTS || 0;
          }
        }

        // Validate radio responses
        if (question.QUESTION_TYPE === "radio") {
          const validRadioResponses = ["Yes", "No"];
          if (!validRadioResponses.includes(response.RESPONSE_TEXT)) {
            throw {
              code: 400,
              message: `Invalid response for radio question ${response.QUESTION_ID}. Valid responses are: Yes, No`,
            };
          }

          if (response.RESPONSE_TEXT === "Yes") {
            earnedPoints = questionMaxPoints;
          }
        }

        // Validate mandatory questions have responses
        if (question.IS_MANDATORY && !response.RESPONSE_TEXT) {
          throw {
            code: 400,
            message: `Question ${response.QUESTION_ID} is mandatory and requires a response`,
          };
        }

        // Add to scored responses
        scoredResponses.push({
          ...response,
          EARNED_POINTS: earnedPoints,
          ALLOTTED_POINTS: questionMaxPoints,
          QUESTION_TYPE: question.QUESTION_TYPE,
          QUESTION_TEXT: question.QUESTION_TEXT,
        });

        totalScore += earnedPoints;
        maxPossibleScore += questionMaxPoints;
      }

      // Validate and process attachments
      const requiredAttachmentDocs = await RequiredAttachmentsColl.find({
        ACCOUNT_GROUP,
      }).toArray();
      const requiredDocIds = new Set(
        requiredAttachmentDocs.map((doc) => doc.DOCUMENT_ID)
      );
      const providedDocIds = new Set(Attachments.map((att) => att.DOCUMENT_ID));

      for (const docId of requiredDocIds) {
        if (!providedDocIds.has(docId)) {
          throw {
            code: 400,
            message: `Missing attachment for required DOCUMENT_ID: ${docId}`,
          };
        }
      }

      const processedAttachments = [];

      for (const attachment of Attachments) {
        const {
          DOCUMENT_ID,
          FILE_NAME,
          FILE_URL,
          DESCRIPTION,
          IS_PRESENT,
          REASON_FOR_ABSENCE,
        } = attachment;

        if (!requiredDocIds.has(DOCUMENT_ID)) {
          throw { code: 400, message: `Invalid DOCUMENT_ID: ${DOCUMENT_ID}` };
        }

        const attachmentData = {
          DOCUMENT_ID,
          IS_PRESENT: !!IS_PRESENT,
          LAST_UPDATED_ON: now,

          FILE_NAME: "",
          FILE_URL: "",
          DESCRIPTION: "",
          REASON_FOR_ABSENCE: "",
        };

        if (IS_PRESENT) {
          if (!FILE_URL)
            throw {
              code: 400,
              message: `FILE_URL is required for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };
          if (!FILE_NAME)
            throw {
              code: 400,
              message: `FILE_NAME is required for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };
          if (REASON_FOR_ABSENCE)
            throw {
              code: 400,
              message: `REASON_FOR_ABSENCE should not be provided when attachment is present for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };

          const finalUrl = await uploadImageToAzure(FILE_URL, DOCUMENT_ID);

          attachmentData.FILE_NAME = FILE_NAME || "";
          attachmentData.FILE_URL = finalUrl;
          attachmentData.DESCRIPTION = DESCRIPTION || "";
        } else {
          // if (FILE_URL || FILE_NAME) throw {
          //   code: 400,
          //   message: `File details should not be provided when attachment is not present for DOCUMENT_ID: ${DOCUMENT_ID}`
          // };
          if (!REASON_FOR_ABSENCE)
            throw {
              code: 400,
              message: `REASON_FOR_ABSENCE is required when attachment is not present for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };
          attachmentData.DESCRIPTION = DESCRIPTION || "";

          attachmentData.REASON_FOR_ABSENCE = REASON_FOR_ABSENCE;
        }

        processedAttachments.push(attachmentData);
      }

      // Calculate percentage score (OUTSIDE the loop)
      const percentageScore =
        maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      // Insert responses
      await SupplierResponsesColl.insertOne({
        RfqNumber,
        Bidder,
        ACCOUNT_GROUP,
        RESPONSES: Responses,
        TOTAL_SCORE: totalScore,
        MAX_POSSIBLE_SCORE: maxPossibleScore,
        PERCENTAGE_SCORE: percentageScore,
        RESPONSE_DATE: now,
        IS_APPROVED: false,
        CREATED_ON: now,
        UPDATED_ON: now,
      });

      // Insert attachments
      await SupplierAttachmentsColl.insertOne({
        RfqNumber,
        Bidder,
        ACCOUNT_GROUP,
        Attachments: processedAttachments,
        CREATED_ON: now,
        LAST_UPDATED_ON: now,
      });

      // Update ResponseStatus field in RFQ work header
      const responseStatus = Responses.length > 0 ? "Completed" : "Answered";
      const attachmentStatus =
        Attachments.length > 0 ? "Completed" : "Answered";

      await RFQWorkHeaderColl.updateOne(
        { RfqNumber, Bidder },
        {
          $set: {
            ResponseStatus: responseStatus,
            AttachmentStatus: attachmentStatus,
            LAST_UPDATED_ON: now,
          },
        }
      );

      return req.info(
        `RFQ responses and attachments for RFQ Number ${RfqNumber} & ${Bidder} submitted successfully`
      );
    } catch (e) {
      console.error("[saveRFQResponseAndAttachments] Error:", e);
      if (e.code) return req.error(e.code, e.message);
      return req.error(500, "Internal server error");
    }
  });

  // Deadline Date Passed Check
  srv.on("editRFQResponsesAndAttachments", async (req) => {
    const { RfqNumber, Bidder, ACCOUNT_GROUP, Responses, Attachments } =
      req.data;

    // Basic validation
    if (!RfqNumber || !Bidder || !ACCOUNT_GROUP) {
      return req.error(400, "Missing RfqNumber, Bidder, or ACCOUNT_GROUP");
    }

    if (!Responses || !Array.isArray(Responses) || Responses.length === 0) {
      return req.error(400, "Missing Responses");
    }

    if (
      !Attachments ||
      !Array.isArray(Attachments) ||
      Attachments.length === 0
    ) {
      return req.error(400, "Missing Attachments");
    }

    const { database } = await getConnection();
    const now = new Date();

    let sts;

    try {
      const SupplierQuestionsColl = database.collection("RFQ_QUESTION_CONFIG");
      const SupplierResponsesColl = database.collection(
        "RFQ_QUESTION_RESPONSES"
      );
      const RequiredAttachmentsColl = database.collection(
        "VENDOR_ACCOUNT_GROUP_ATTACHMENT"
      );
      const SupplierAttachmentsColl = database.collection(
        "RFQ_ATTACHMENT_RESPONSES"
      );
      const RFQWorkHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");

      const rfqHeader = await RFQWorkHeaderColl.findOne({ RfqNumber, Bidder });

      if (!rfqHeader) throw { code: 404, message: "RFQ Header not found" };

      if (rfqHeader.Status !== "Submitted" && rfqHeader.Status !== "Draft") {
        throw {
          code: 400,
          message:
            "Cannot edit responses/attachments on an RFQ which is not Submitted or in Draft",
        };
      }

      // sts = rfqHeader.Status

      // ====== Handle Responses ======
      const existingResponse = await SupplierResponsesColl.findOne({
        RfqNumber,
        Bidder,
        ACCOUNT_GROUP,
      });
      if (!existingResponse)
        throw {
          code: 404,
          message:
            "No existing responses found to update. Use save function first.",
        };

      // Validate questions and calculate scores
      const requiredQuestions = await SupplierQuestionsColl.find({
        ACCOUNT_GROUP,
        IS_ACTIVE: true,
      }).toArray();
      const requiredQIds = new Set(requiredQuestions.map((q) => q.QUESTION_ID));
      const receivedQIds = new Set(Responses.map((r) => r.QUESTION_ID));

      if (receivedQIds.size !== requiredQIds.size) {
        throw {
          code: 400,
          message: `Expected ${requiredQIds.size} responses, but received ${receivedQIds.size}`,
        };
      }

      for (const qid of receivedQIds) {
        if (!requiredQIds.has(qid)) {
          throw { code: 400, message: `Invalid QUESTION_ID: ${qid}` };
        }
      }

      // Calculate scores for responses
      let totalScore = 0;
      let maxPossibleScore = 0;
      const scoredResponses = [];

      for (const response of Responses) {
        if (!response.QUESTION_ID || !response.RESPONSE_TEXT) {
          throw {
            code: 400,
            message: "Each response must have QUESTION_ID and RESPONSE_TEXT",
          };
        }

        // Find the corresponding question
        const question = requiredQuestions.find(
          (q) => q.QUESTION_ID === response.QUESTION_ID
        );
        if (!question) continue;

        let earnedPoints = 0;
        let questionMaxPoints = 0;

        if (question.QUESTION_TYPE === "radio") {
          questionMaxPoints = question.ALLOTTED_POINTS || 0;
        } else if (question.QUESTION_TYPE === "dropdown") {
          dropDownValues = question.DROPDOWN_OPTIONS ?? [];
          questionMaxPoints = dropDownValues.reduce((sum, option) => {
            return sum + (option.POINTS || 0);
          }, 0);
        }

        // Validate radio responses
        if (question.QUESTION_TYPE === "radio") {
          const validRadioResponses = ["Yes", "No"];
          if (!validRadioResponses.includes(response.RESPONSE_TEXT)) {
            throw {
              code: 400,
              message: `Invalid response for radio question ${response.QUESTION_ID}. Valid responses are: Yes, No`,
            };
          }

          if (response.RESPONSE_TEXT === "Yes") {
            earnedPoints = questionMaxPoints;
          }
        }

        // Validate dropdown responses
        if (question.QUESTION_TYPE === "dropdown") {
          if (
            !question.DROPDOWN_OPTIONS ||
            !Array.isArray(question.DROPDOWN_OPTIONS)
          ) {
            throw {
              code: 400,
              message: `Question ${response.QUESTION_ID} is a dropdown but has no valid options configured`,
            };
          }

          // Check if response is a valid option ID
          const isValidOption = question.DROPDOWN_OPTIONS.some(
            (option) => option.VALUE === response.RESPONSE_TEXT
          );

          if (!isValidOption) {
            const validOptions = question.DROPDOWN_OPTIONS.map(
              (opt) => opt.VALUE
            ).join(", ");
            throw {
              code: 400,
              message: `Invalid response for dropdown question ${response.QUESTION_ID}. Valid options are: ${validOptions}`,
            };
          }

          const selectedOption = question.DROPDOWN_OPTIONS.find(
            (opt) => opt.VALUE === response.RESPONSE_TEXT
          );
          if (selectedOption) {
            earnedPoints = selectedOption.POINTS || 0;
          }
        }

        // Validate mandatory questions have responses
        if (question.IS_MANDATORY && !response.RESPONSE_TEXT) {
          throw {
            code: 400,
            message: `Question ${response.QUESTION_ID} is mandatory and requires a response`,
          };
        }

        // Add to scored responses
        scoredResponses.push({
          ...response,
          EARNED_POINTS: earnedPoints,
          ALLOTTED_POINTS: questionMaxPoints,
          QUESTION_TYPE: question.QUESTION_TYPE,
          QUESTION_TEXT: question.QUESTION_TEXT,
        });

        totalScore += earnedPoints;
        maxPossibleScore += questionMaxPoints;
      }

      // Calculate percentage score
      const percentageScore =
        maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      // ====== Handle Attachments ======
      const existingAttachmentsDoc = await SupplierAttachmentsColl.findOne({
        RfqNumber,
        Bidder,
        ACCOUNT_GROUP,
      });
      if (!existingAttachmentsDoc)
        throw {
          code: 404,
          message:
            "No existing attachments found to update. Use save function first.",
        };

      const currentAttachmentMap = new Map();
      existingAttachmentsDoc.Attachments.forEach((att) => {
        currentAttachmentMap.set(att.DOCUMENT_ID, att);
      });

      const requiredAttachmentDocs = await RequiredAttachmentsColl.find({
        ACCOUNT_GROUP,
      }).toArray();
      const requiredDocIds = new Set(
        requiredAttachmentDocs.map((doc) => doc.DOCUMENT_ID)
      );
      const providedDocIds = new Set(Attachments.map((att) => att.DOCUMENT_ID));

      const processedAttachments = [];

      for (const attachment of Attachments) {
        const {
          DOCUMENT_ID,
          FILE_NAME,
          FILE_URL,
          DESCRIPTION,
          IS_PRESENT,
          REASON_FOR_ABSENCE,
        } = attachment;

        if (!requiredDocIds.has(DOCUMENT_ID)) {
          throw { code: 400, message: `Invalid DOCUMENT_ID: ${DOCUMENT_ID}` };
        }

        const attachmentData = {
          DOCUMENT_ID,
          IS_PRESENT: !!IS_PRESENT,
          LAST_UPDATED_ON: now,
        };

        if (IS_PRESENT) {
          if (!FILE_URL)
            throw {
              code: 400,
              message: `FILE_URL is required for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };
          if (!FILE_NAME)
            throw {
              code: 400,
              message: `FILE_NAME is required for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };
          if (REASON_FOR_ABSENCE)
            throw {
              code: 400,
              message: `REASON_FOR_ABSENCE should not be provided when attachment is present for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };

          const currentAttachment = currentAttachmentMap.get(DOCUMENT_ID);
          let finalUrl = FILE_URL;

          if (!currentAttachment || currentAttachment.FILE_URL !== FILE_URL) {
            finalUrl = await uploadImageToAzure(FILE_URL, DOCUMENT_ID);
          }

          attachmentData.FILE_NAME = FILE_NAME;
          attachmentData.FILE_URL = finalUrl;
          attachmentData.DESCRIPTION = DESCRIPTION || "";
        } else {
          if (FILE_URL || FILE_NAME) {
            throw {
              code: 400,
              message: `File details should not be provided when attachment is not present for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };
          }
          if (!REASON_FOR_ABSENCE) {
            throw {
              code: 400,
              message: `REASON_FOR_ABSENCE is required when attachment is not present for DOCUMENT_ID: ${DOCUMENT_ID}`,
            };
          }

          attachmentData.REASON_FOR_ABSENCE = REASON_FOR_ABSENCE;
          attachmentData.FILE_URL = null;
          attachmentData.FILE_NAME = null;
        }

        processedAttachments.push(attachmentData);
      }

      // Include untouched required attachments
      for (const docId of requiredDocIds) {
        if (!providedDocIds.has(docId)) {
          const existingAttachment = currentAttachmentMap.get(docId);
          if (existingAttachment) {
            processedAttachments.push({
              ...existingAttachment,
              LAST_UPDATED_ON: now,
            });
          } else {
            throw {
              code: 400,
              message: `Missing attachment for required DOCUMENT_ID: ${docId}`,
            };
          }
        }
      }

      await SupplierResponsesColl.updateOne(
        { RfqNumber, Bidder, ACCOUNT_GROUP },
        {
          $set: {
            RESPONSES: Responses,
            TOTAL_SCORE: totalScore,
            MAX_POSSIBLE_SCORE: maxPossibleScore,
            PERCENTAGE_SCORE: percentageScore,
            RESPONSE_DATE: now,
            UPDATED_ON: now,
          },
        }
      );

      await SupplierAttachmentsColl.updateOne(
        { RfqNumber, Bidder, ACCOUNT_GROUP },
        {
          $set: {
            Attachments: processedAttachments,
            LAST_UPDATED_ON: now,
          },
        }
      );

      // Update the ResponseStatus field
      const responseStatus = Responses.length > 0 ? "Completed" : "Answered";
      const attachmentStatus =
        Attachments.length > 0 ? "Completed" : "Answered";

      await RFQWorkHeaderColl.updateOne(
        { RfqNumber, Bidder },
        {
          $set: {
            ResponseStatus: responseStatus,
            AttachmentStatus: attachmentStatus,
            LAST_UPDATED_ON: now,
          },
        }
      );

      return req.info(
        `RFQ responses and attachments for ${RfqNumber} & ${Bidder} updated successfully`
      );
    } catch (e) {
      console.error("[editRFQResponsesAndAttachments] Error:", e);
      if (e.code) return req.error(e.code, e.message);
      return req.error(500, "Failed to update RFQ responses and attachments");
    }
  });

  srv.on("deleteRFQAttachment", async (req) => {
    const { RfqNumber, Bidder, ACCOUNT_GROUP, DOCUMENT_ID } = req.data;

    // Basic validation
    if (!RfqNumber || !Bidder || !ACCOUNT_GROUP || !DOCUMENT_ID) {
      return req.error(
        400,
        "Missing RfqNumber, Bidder, ACCOUNT_GROUP, or DOCUMENT_ID"
      );
    }

    const { database } = await getConnection();

    try {
      const RFQWorkHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");
      const SupplierAttachmentsColl = database.collection(
        "RFQ_ATTACHMENT_RESPONSES"
      );
      const RequiredAttachmentsColl = database.collection(
        "VENDOR_ACCOUNT_GROUP_ATTACHMENT"
      );

      // Check RFQ header status
      const rfqHeader = await RFQWorkHeaderColl.findOne({ RfqNumber, Bidder });

      if (!rfqHeader) throw { code: 404, message: "RFQ Header not found" };

      if (
        rfqHeader.Status === "Not_Accepted" ||
        rfqHeader.Status === "Pending"
      ) {
        throw { code: 400, message: "RFQ must be Accepted first" };
      } else if (rfqHeader.Status === "Awarded") {
        throw { code: 400, message: "RFQ is already awarded" };
      } else if (rfqHeader.Status === "Rejected") {
        throw { code: 400, message: "RFQ is already rejected" };
      }

      // Check if document is required
      const isRequired = await RequiredAttachmentsColl.findOne({
        ACCOUNT_GROUP,
        DOCUMENT_ID,
      });

      if (isRequired) {
        throw {
          code: 400,
          message:
            "Cannot delete required document. Mark as not present with reason instead.",
        };
      }

      // Get current attachments
      const currentAttachments = await SupplierAttachmentsColl.findOne({
        RfqNumber,
        Bidder,
        ACCOUNT_GROUP,
      });

      if (!currentAttachments?.Attachments) {
        throw { code: 404, message: "No attachments found for this RFQ" };
      }

      const attachmentToDelete = currentAttachments.Attachments.find(
        (att) => att.DOCUMENT_ID === DOCUMENT_ID
      );

      if (!attachmentToDelete) {
        throw { code: 404, message: "Attachment not found" };
      }

      // Optional: Delete from Azure
      // if (attachmentToDelete.FILE_URL) {
      //     await deleteFileFromAzure(attachmentToDelete.FILE_URL);
      // }

      // Filter out the attachment
      const updatedAttachments = currentAttachments.Attachments.filter(
        (att) => att.DOCUMENT_ID !== DOCUMENT_ID
      );

      await SupplierAttachmentsColl.updateOne(
        { RfqNumber, Bidder, ACCOUNT_GROUP },
        {
          $set: {
            Attachments: updatedAttachments,
            LAST_UPDATED_ON: new Date(),
          },
        }
      );

      return req.info("Attachment deleted successfully");
    } catch (e) {
      console.error("[deleteRFQAttachment] Error:", e);
      if (e.code) return req.error(e.code, e.message);
      return req.error(500, "Failed to delete attachment");
    }
  });

  // Action to generate and upload Excel file
  srv.on("generateMassUploadExcel", async (req) => {
    const { RfqNumber, Bidder } = req.data;

    if (!RfqNumber) {
      return req.error(400, "RFQ Number is required.");
    }

    if (!Bidder) {
      return req.error(400, "Bidder is required.");
    }

    try {
      const { database } = await getConnection();
      const rfqItemsCollection = database.collection("ZC_AISP_RFQ_ITEM");

      // 2. Fetch and group items using MongoDB aggregation
      const aggregationPipeline = [
        {
          $match: {
            RfqNumber,
            Bidder,
          },
        },
        {
          $project: {
            _id: 0,
            ItemNumber: 1,
            MaterialNo: 1,
            MaterialDesc: 1,
            UnitOfMeasure: 1,
            Plant: 1,
            Quantity: {
              $convert: {
                input: "$Quantity",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
            Netwr: {
              $convert: {
                input: "$Netwr",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
            DeliveryDate: 1,
            ExpectedDeliveryDate: 1,
            LotType: 1,
          },
        },
        {
          $group: {
            _id: "$LotType",
            items: {
              $push: {
                itemNo: "$ItemNumber",
                materialNoDesc: {
                  $concat: ["$MaterialNo", " - ", "$MaterialDesc"],
                },
                uom: "$UnitOfMeasure",
                plant: "$Plant",
                requiredQuantity: "$Quantity",
                totalPrice: "$Netwr",
                deliveryDate: "$DeliveryDate",
                expectedDeliveryDate: "$ExpectedDeliveryDate",
              },
            },
          },
        },
        {
          $project: {
            lotType: "$_id",
            items: 1,
            _id: 0,
          },
        },
      ];

      const groupedResults = await rfqItemsCollection
        .aggregate(aggregationPipeline)
        .toArray();

      if (groupedResults.length === 0) {
        return req.error(404, "No items found for the specified RFQ number");
      }

      // 3. Transform results for Excel
      const groupsData = {};
      groupedResults.forEach((group) => {
        groupsData[group.lotType] = group.items;
      });

      // 4. Generate Excel using the separate utility
      const buffer = await generateExcel(groupsData);
      const base64File = buffer.toString("base64");
      const fileName = `MassUploadTemplate_${RfqNumber}_${Date.now()}.xlsx`;

      // 5. Upload to Azure
      const azureBlobUrl = await uploadImageToAzure(
        base64File,
        fileName,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      return req.reply({
        message: "File successfully generated and uploaded",
        fileUrl: azureBlobUrl,
      });
    } catch (error) {
      console.error("Error in generateMassUploadExcel:", error);
      return req.error(500, "Failed to generate Excel template");
    }
  });

  srv.on("READ", "ZC_AISP_RFQ_DRAFT", async (req) => {
    const { database } = await getConnection();
    const draftHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");

    // Handle pagination
    const { skip, limit } = buildPagination(req);

    const { query, sortOrder } = await buildQuery(req);

    const draftData = await draftHeaderColl
      .find({
        ...query,
        Status: "Draft",
      })
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .toArray();

    draftData["$count"] = draftData.length;

    return req.reply(draftData);
  });

  // Deadline Date Passed Check
  srv.on("CREATE", "ZC_AISP_RFQ_DRAFT", async (req) => {
    const { database } = await getConnection();

    try {
      const RFQWorkHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");
      const RFQWorkItemColl = database.collection("ZC_AISP_RFQ_WORK_ITEM");

      const {
        RfqNumber,
        Bidder,
        Remarks,
        items = [],
        Additional_Charge_Present = false,
        Additional_Charges = [],
        Additional_Attachment_Present = false,
        Additional_Attachments = [],
      } = req.data;

      // Basic validation
      if (!RfqNumber || !Bidder) {
        throw { code: 400, message: "RfqNumber and Bidder are required" };
      }

      const now = new Date();

      // Check for existing draft
      const existingDraft = await RFQWorkHeaderColl.findOne({
        RfqNumber,
        Bidder,
        Status: "Draft",
      });

      if (existingDraft) {
        throw {
          code: 400,
          message: "Draft already exists. Use UPDATE operation instead.",
        };
      }

      // Get existing header (non-draft version)
      const existingHeader = await RFQWorkHeaderColl.findOne({
        RfqNumber,
        Bidder,
        Status: { $ne: "Draft" }, // Exclude existing drafts
      });

      if (!existingHeader) {
        throw { code: 404, message: "RFQ Header not found" };
      }

      // Validate status transitions
      const validStatusTransitions = {
        Accepted: true,
        // Add other allowed status transitions if needed
      };

      if (!validStatusTransitions[existingHeader.Status]) {
        // const statusMessages = {
        //   'Pending': 'RFQ Header should be approved first',
        //   'Not_Accepted': 'RFQ Header should be accepted first',
        //   'Submitted': 'Your request has already been submitted!',
        //   'Draft': 'Your request is already in draft please update it!',
        //   'Awarded': 'Your request has already been awarded!',
        //   'Rejected': 'Your request has already been rejected!',
        // };
        throw {
          code: 400,
          message: `Cannot create Draft for Header with RFQ status: ${existingHeader.Status}`,
        };
      }

      // Get existing items
      const existingItems = await RFQWorkItemColl.find({
        RfqNumber,
        Bidder,
      }).toArray();

      if (!existingItems || existingItems.length === 0) {
        throw { code: 404, message: "No existing items found for this RFQ" };
      }

      // Validate input items
      if (!Array.isArray(items) || items.length === 0) {
        throw { code: 400, message: "At least one item is required" };
      }

      if (items.length !== existingItems.length) {
        throw {
          code: 400,
          message: "Number of items provided does not match existing items",
        };
      }

      // Prepare updated items (only changing Netpr and Netwr)
      const validatedItems = existingItems.map((existingItem) => {
        const inputItem = items.find(
          (item) => item.ItemNumber === existingItem.ItemNumber
        );

        if (!inputItem) {
          throw {
            code: 400,
            message: `Item ${existingItem.ItemNumber} not found in input`,
          };
        }

        if (inputItem.Netpr <= 0) {
          throw {
            code: 400,
            message: `Item ${inputItem.ItemNumber} cannot have Net Price less than or equal to 0`,
          };
        } else if (inputItem.Netwr <= 0) {
          throw {
            code: 400,
            message: `Item ${inputItem.ItemNumber} cannot have Total Price less than or equal to 0`,
          };
        } else if (!inputItem.DeliveryDate) {
          throw {
            code: 400,
            message: `Missing Delivery Date for item ${inputItem.ItemNumber}`,
          };
        } else if (!inputItem.ExpectedDeliveryDate) {
          throw {
            code: 400,
            message: `Missing Expected Delivery Date for item ${inputItem.ItemNumber}`,
          };
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Validate that DeliveryDate and ExpectedDeliveryDate are not less than current date
        const deliveryDate = new Date(inputItem.DeliveryDate);
        const expectedDeliveryDate = new Date(inputItem.ExpectedDeliveryDate);

        deliveryDate.setHours(0, 0, 0, 0);
        expectedDeliveryDate.setHours(0, 0, 0, 0);

        if (deliveryDate < now) {
          throw {
            code: 400,
            message: `Delivery Date cannot be in the past for item ${inputItem.ItemNumber}`,
          };
        }

        if (expectedDeliveryDate < now) {
          throw {
            code: 400,
            message: `Expected Delivery Date cannot be in the past for item ${inputItem.ItemNumber}`,
          };
        }

        return {
          ...existingItem,
          Netpr: parseFloat(inputItem.Netpr || existingItem.Netpr || 0),
          Netwr: parseFloat(inputItem.Netwr || existingItem.Netwr || 0),
          DeliveryDate: inputItem.DeliveryDate,
          ExpectedDeliveryDate: inputItem.ExpectedDeliveryDate,
          UpdatedAt: now,
          CreatedAt: existingItem.CreatedAt || now,
        };
      });

      // Validate additional charges if present
      const validatedCharges = [];

      if (Additional_Charge_Present) {
        if (
          !Array.isArray(Additional_Charges) ||
          Additional_Charges.length === 0
        ) {
          throw {
            code: 400,
            message:
              "Additional charges are marked as present but none provided",
          };
        }

        Additional_Charges.forEach((charge, index) => {
          if (!charge.Charge_Name)
            throw {
              code: 400,
              message: `Charge_Name is missing for additional charge ${
                index + 1
              }`,
            };
          if (!charge.Charge_Price)
            throw {
              code: 400,
              message: `Charge_Price is missing for additional charge ${
                index + 1
              }`,
            };
          if (!charge.Charge_Unit)
            throw {
              code: 400,
              message: `Charge_Unit is missing for additional charge ${
                index + 1
              }`,
            };

          validatedCharges.push({
            Charge_Name: charge.Charge_Name,
            Charge_Price: parseFloat(charge.Charge_Price),
            Charge_Unit: charge.Charge_Unit,
          });
        });
      }

      // Validate additional attachments if present
      const validatedAttachments = [];

      if (Additional_Attachment_Present) {
        if (
          !Array.isArray(Additional_Attachments) ||
          Additional_Attachments.length === 0
        ) {
          throw {
            code: 400,
            message:
              "Additional attachments are marked as present but none provided",
          };
        }

        for (const attachment of Additional_Attachments) {
          const { DOCUMENT_ID, FILE_NAME, FILE_URL, DESCRIPTION } = attachment;

          if (!DOCUMENT_ID)
            throw {
              code: 400,
              message: "DOCUMENT_ID is missing in attachment",
            };
          if (!FILE_URL)
            throw {
              code: 400,
              message: `FILE_URL is missing for document ${DOCUMENT_ID}`,
            };

          const finalUrl = await uploadImageToAzure(FILE_URL, DOCUMENT_ID);

          validatedAttachments.push({
            DOCUMENT_ID,
            FILE_NAME: FILE_NAME || "",
            DESCRIPTION: DESCRIPTION || "",
            FILE_URL: finalUrl,
            UPLOADED_ON: now,
          });
        }
      }

      // Update existing header (don't insert new one)
      const updateFields = {
        $set: {
          Status: "Draft",
          Remarks: Remarks || existingHeader.Remarks || "",
          Additional_Charge_Present,
          Additional_Charges: validatedCharges,
          Additional_Attachment_Present,
          Additional_Attachments: validatedAttachments,
          UpdatedAt: now,
          // Preserve original CreatedAt from existing header
          CreatedAt: existingHeader.CreatedAt || now,
        },
      };

      await RFQWorkHeaderColl.updateOne(
        { RfqNumber, Bidder, _id: existingHeader._id },
        updateFields
      );

      // Delete existing items and insert updated ones
      // Issue is here
      await RFQWorkItemColl.deleteMany({
        RfqNumber: RfqNumber,
        Bidder: Bidder,
      });
      await RFQWorkItemColl.insertMany(validatedItems);

      // Construct the response entity
      const responseEntity = {
        RfqNumber,
        Bidder,
      };

      return responseEntity;

      // return { message: `Draft RFQ ${RfqNumber} updated successfully with new prices.` };
    } catch (error) {
      console.error("Error in CREATE draft:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to create draft");
    }
  });

  // Deadline Date Passed Check
  srv.on("UPDATE", "ZC_AISP_RFQ_DRAFT", async (req) => {
    const { database } = await getConnection();

    try {
      const RFQHeaderColl = database.collection("ZC_AISP_RFQ_HDR");
      const RFQWorkHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");
      const RFQWorkItemColl = database.collection("ZC_AISP_RFQ_WORK_ITEM");

      const {
        RfqNumber,
        Bidder,
        Remarks,
        items = [],
        Additional_Charge_Present = false,
        Additional_Charges = [],
        Additional_Attachment_Present = false,
        Additional_Attachments = [],
      } = req.data;

      if (!RfqNumber || !Bidder) {
        throw { code: 400, message: "RfqNumber and Bidder are required" };
      }

      const now = new Date();

      const existingDraft = await RFQWorkHeaderColl.findOne({
        RfqNumber,
        Bidder,
        Status: "Draft",
      });

      if (!existingDraft) {
        throw {
          code: 404,
          message: "No draft found to update. Use CREATE operation first.",
        };
      }

      const existingHeader = await RFQHeaderColl.findOne({ RfqNumber, Bidder });

      if (!existingHeader) {
        throw { code: 404, message: "RFQ Header not found" };
      }

      const existingItems = await RFQWorkItemColl.find({
        RfqNumber,
        Bidder,
      }).toArray(); // Fetch all matching items

      const validStatusTransitions = {
        Submitted: true,
        Accepted: true,
        Draft: true,
      };

      if (!validStatusTransitions[existingDraft.Status]) {
        // const statusMessages = {
        //   'Awarded': 'Your request has already been awarded!',
        //   'Rejected': 'Your request has already been rejected!',
        //   'Pending': 'RFQ Header should be approved first',
        //   'Not_Accepted': 'RFQ Header should be accepted first'
        // };
        throw {
          code: 400,
          message: `Cannot Edit RFQ Draft with status: ${existingDraft.Status}`,
        };
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw { code: 400, message: "At least one item is required" };
      }

      const validatedItems = [];

      // Iterate over the incoming items and find/replace the existing items based on ItemNumber
      for (const item of items) {
        if (!item.ItemNumber)
          throw {
            code: 400,
            message: `ItemNumber is missing for item ${item.ItemNumber}`,
          };

        // Find the matching existing item based on ItemNumber
        const existingItem = existingItems.find(
          (i) => i.ItemNumber === item.ItemNumber
        );

        if (!existingItem) {
          throw {
            code: 400,
            message: `ItemNumber ${item.ItemNumber} not found in existing items`,
          };
        }

        if (existingItem.Netpr <= 0) {
          throw {
            code: 400,
            message: `ItemNumber ${item.ItemNumber} cannot have Net Price Less than or Equal to 0`,
          };
        } else if (item.Netwr <= 0) {
          throw {
            code: 400,
            message: `ItemNumber ${item.ItemNumber} cannot have Total Price Less than or Equal to 0`,
          };
        } else if (!item.DeliveryDate) {
          throw {
            code: 400,
            message: `Missing Delivery Date for item ${item.ItemNumber}`,
          };
        } else if (!item.ExpectedDeliveryDate) {
          throw {
            code: 400,
            message: `Missing Expected Delivery Date for item ${item.ItemNumber}`,
          };
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Validate that DeliveryDate and ExpectedDeliveryDate are not less than current date
        const deliveryDate = new Date(item.DeliveryDate);
        const expectedDeliveryDate = new Date(item.ExpectedDeliveryDate);

        deliveryDate.setHours(0, 0, 0, 0);
        expectedDeliveryDate.setHours(0, 0, 0, 0);

        if (deliveryDate < now) {
          throw {
            code: 400,
            message: `Delivery Date cannot be in the past for item ${item.ItemNumber}`,
          };
        }

        if (expectedDeliveryDate < now) {
          throw {
            code: 400,
            message: `Expected Delivery Date cannot be in the past for item ${item.ItemNumber}`,
          };
        }

        // validatedItems.push({
        //   RfqNumber,
        //   Bidder,
        //   ItemNumber: item.ItemNumber,
        //   MaterialNo: item.MaterialNo || existingItem.MaterialNo,
        //   MaterialDesc: item.MaterialDesc || existingItem.MaterialDesc,
        //   LotType: item.LotType || existingItem.LotType,
        //   UnitOfMeasure: item.UnitOfMeasure || existingItem.UnitOfMeasure,
        //   Currency: item.Currency || existingDraft.Currency || existingItem.Currency,
        //   PlantAddress: item.PlantAddress || existingItem.PlantAddress,
        //   Quantity: parseFloat(item.Quantity) || parseFloat(existingItem.Quantity),
        //   Netpr: parseFloat(item.Netpr || 0),
        //   Netwr: parseFloat(item.Netwr || 0),
        //   TOTAL_PRICE: parseFloat(item.TOTAL_PRICE || 0),
        //   basic_longtext: item.basic_longtext || existingItem.basic_longtext,
        //   UpdatedAt: now
        // });

        validatedItems.push({
          ...existingItem,
          Netpr: parseFloat(item.Netpr || 0),
          Netwr: parseFloat(item.Netwr || 0),
          DeliveryDate: item.DeliveryDate,
          ExpectedDeliveryDate: item.ExpectedDeliveryDate,
          basic_longtext: item.basic_longtext || existingItem.basic_longtext,
          UpdatedAt: now,
        });
      }

      const validatedCharges = [];
      if (Additional_Charge_Present) {
        if (
          !Array.isArray(Additional_Charges) ||
          Additional_Charges.length === 0
        ) {
          throw {
            code: 400,
            message:
              "Additional charges are marked as present but none provided",
          };
        }

        Additional_Charges.forEach((charge, index) => {
          if (!charge.Charge_Name)
            throw {
              code: 400,
              message: `Charge_Name is missing for additional charge ${
                index + 1
              }`,
            };
          if (!charge.Charge_Price)
            throw {
              code: 400,
              message: `Charge_Price is missing for additional charge ${
                index + 1
              }`,
            };
          if (!charge.Charge_Unit)
            throw {
              code: 400,
              message: `Charge_Unit is missing for additional charge ${
                index + 1
              }`,
            };

          validatedCharges.push({
            Charge_Name: charge.Charge_Name,
            Charge_Price: parseFloat(charge.Charge_Price),
            Charge_Unit: charge.Charge_Unit,
          });
        });
      }

      const validatedAttachments = [];
      if (Additional_Attachment_Present) {
        if (
          !Array.isArray(Additional_Attachments) ||
          Additional_Attachments.length === 0
        ) {
          throw {
            code: 400,
            message:
              "Additional attachments are marked as present but none provided",
          };
        }

        for (const attachment of Additional_Attachments) {
          const { DOCUMENT_ID, FILE_NAME, FILE_URL, DESCRIPTION } = attachment;

          if (!DOCUMENT_ID)
            throw {
              code: 400,
              message: "DOCUMENT_ID is missing in attachment",
            };
          if (!FILE_URL)
            throw {
              code: 400,
              message: `FILE_URL is missing for document ${DOCUMENT_ID}`,
            };

          let finalUrl = FILE_URL;

          // Check if the file URL is a base64 string or a blob URL
          if (FILE_URL && isBase64(FILE_URL)) {
            // It's a base64 encoded string
            finalUrl = await uploadImageToAzure(FILE_URL, FILE_NAME); // Adjust MIME type as needed
            if (!finalUrl) {
              throw { code: 400, message: "Failed to upload image to Azure" };
            }
          } else if (!FILE_URL) {
            // If no file URL, handle as necessary
            console.log("No image provided for upload");
            continue;
          }

          validatedAttachments.push({
            DOCUMENT_ID: DOCUMENT_ID || "",
            FILE_NAME: FILE_NAME || "",
            DESCRIPTION: DESCRIPTION || "",
            FILE_URL: finalUrl,
            UPLOADED_ON: now,
          });
        }
      }

      const headerUpdate = {
        $set: {
          Remarks: Remarks || existingDraft.Remarks || "",
          Additional_Charge_Present,
          Additional_Charges: validatedCharges,
          Additional_Attachment_Present,
          Additional_Attachments: validatedAttachments,
          UpdatedAt: now,
        },
      };

      await RFQWorkHeaderColl.updateOne(
        { RfqNumber, Bidder, Status: "Draft" },
        headerUpdate
      );

      // Now, update specific items based on ItemNumber
      for (const validatedItem of validatedItems) {
        await RFQWorkItemColl.updateOne(
          { RfqNumber, Bidder, ItemNumber: validatedItem.ItemNumber }, // Match specific item
          { $set: validatedItem }, // Only update the fields that changed
          { upsert: true } // If item doesn't exist, insert it
        );
      }

      return { RfqNumber, Bidder };
    } catch (error) {
      console.error("Error in UPDATE draft:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to update draft");
    }
  });

  srv.on("setRFQStatus", async (req) => {
    const { RfqNumber, Bidder, Action, Remarks } = req.data;

    // Validate input
    if (!RfqNumber || !Bidder || !Action) {
      return req.reject(400, "RfqNumber, Bidder, and Action are required");
    }

    const action = Action.toLowerCase();

    if (!["accept", "reject"].includes(action)) {
      return req.reject(400, 'Action must be either "accept" or "reject"');
    }

    const { database } = await getConnection();
    const now = new Date();
    const newStatus = action === "accept" ? "Accepted" : "Not_Accepted";

    try {
      // Collections
      const collections = {
        header: database.collection("ZC_AISP_RFQ_HDR"),
        items: database.collection("ZC_AISP_RFQ_ITEM"),
        workHeader: database.collection("ZC_AISP_RFQ_WORK_HDR"),
        workItems: database.collection("ZC_AISP_RFQ_WORK_ITEM"),
        logs: database.collection("ZC_AISP_RFQ_LOGS"),
      };

      // Check if document exists to determine if we're updating or inserting
      const existingDoc = await collections.workHeader.findOne({
        RfqNumber,
        Bidder,
      });

      const isUpdate = !!existingDoc;

      // Check current status to prevent invalid transitions
      if (isUpdate) {
        const invalidStatuses = [
          "Accepted",
          "Awarded",
          "Rejected",
          "Draft",
          "Submitted",
        ];
        if (invalidStatuses.includes(existingDoc.Status)) {
          return req.reject(
            400,
            `Cannot ${action} an already ${existingDoc.Status} RFQ`
          );
        }
      }

      // Get source RFQ data
      const [mainHeader, mainItems] = await Promise.all([
        collections.header.findOne({ RfqNumber, Bidder }),
        collections.items.find({ RfqNumber, Bidder }).toArray(),
      ]);

      if (!mainHeader) return req.reject(404, "RFQ not found");
      if (!mainItems?.length)
        return req.reject(404, "No items found for this RFQ");

      // Create supplier quotation in SAP
      // const supplierQuotation = await createSupplierQuotationInS4({ RfqNumber, Bidder });
      // if (!supplierQuotation) {
      //   return req.reject(502, 'Failed to create supplier quotation in SAP');
      // }

      // Create supplier quotation in SAP only if action is "accept"
      let supplierQuotation = null;

      if (action === "accept") {
        supplierQuotation = await createSupplierQuotationInS4({
          RfqNumber,
          Bidder,
        });
        if (!supplierQuotation) {
          return req.reject(502, "Failed to create supplier quotation in SAP");
        }
      }

      // Prepare work header update
      const headerUpdate = {
        $set: {
          ...mainHeader,
          Status: action === "accept" ? newStatus : "Not_Accepted",
          SupplierQuotation: supplierQuotation,
          LAST_UPDATED_ON: now,
        },
      };

      // Only set CREATED_ON for new documents
      if (!isUpdate) {
        headerUpdate.$set.CREATED_ON = now;
      }

      // Remove unwanted fields
      delete headerUpdate.$set._id;
      delete headerUpdate.$set.to_rfqitem;

      // Prepare work items updates
      const itemUpdates = mainItems.map((item) => {
        const itemExists = collections.workItems.findOne({
          RfqNumber: item.RfqNumber,
          ItemNumber: item.ItemNumber,
          Bidder: item.Bidder,
        });

        const update = {
          $set: {
            ...item,
            Confirmation_Status: action === "accept",
            LAST_UPDATED_ON: now,
          },
        };

        // Only set CREATED_ON for new items
        if (!itemExists) {
          update.$set.CREATED_ON = now;
        }

        delete update.$set._id;
        delete update.$set.to_rfqheader;

        return {
          updateOne: {
            filter: {
              RfqNumber: item.RfqNumber,
              ItemNumber: item.ItemNumber,
              Bidder: item.Bidder,
            },
            update,
            upsert: true,
          },
        };
      });

      // Execute all operations
      await Promise.all([
        collections.workHeader.updateOne({ RfqNumber, Bidder }, headerUpdate, {
          upsert: true,
        }),
        itemUpdates.length > 0 &&
          collections.workItems.bulkWrite(itemUpdates, { ordered: false }),
        collections.logs.insertOne({
          REQUEST_NO: RfqNumber,
          BIDDER: Bidder,
          ACTION: newStatus.toUpperCase(),
          TIMESTAMP: now,
          APPROVER_ID: req.user?.id || "SYSTEM",
          COMMENT:
            action === "accept"
              ? "RFQ Accepted"
              : `Rejected: ${Remarks || "No remarks provided"}`,
        }),
      ]);

      return `RFQ ${RfqNumber} successfully ${action}ed | SupplierQuotation=${supplierQuotation}`;
    } catch (error) {
      console.error("RFQ status update failed:", error);

      if (error.message?.includes("SAP") || error.message?.includes("S4")) {
        return req.reject(502, `SAP integration error: ${error.message}`);
      }

      return req.reject(500, error.message || "Failed to update RFQ status");
    }
  });

  // Handler to submitting the RFQ
  // Deadline Date Passed Check
  srv.on("SubmitRFQ", async (req) => {
    const { database } = await getConnection();

    try {
      const {
        RfqNumber,
        Bidder,
        items = [],
        Additional_Charge_Present = false,
        Additional_Charges = [],
        Remarks,
        Additional_Attachment_Present = false,
        Additional_Attachments = [],
      } = req.data;

      // Validate basic required fields
      if (!RfqNumber || !Bidder) {
        return req.reject(400, "RfqNumber and Bidder are required");
      }

      if (!Array.isArray(items) || items.length === 0) {
        return req.reject(
          400,
          "At least one item with updated prices is required"
        );
      }

      const RFQWorkHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");
      const RFQWorkItemColl = database.collection("ZC_AISP_RFQ_WORK_ITEM");
      const RFQLogsColl = database.collection("ZC_AISP_RFQ_LOGS");

      // Fetch the RFQ header
      const rfqHeader = await RFQWorkHeaderColl.findOne({ RfqNumber, Bidder });
      if (!rfqHeader) return req.reject(404, "RFQ Header not found");

      // Status validation
      if (!["Accepted", "Draft"].includes(rfqHeader.Status)) {
        const statusMessages = {
          Submitted: "Already submitted!",
          Awarded: "Already awarded!",
          Rejected: "Already rejected!",
          Pending: "Needs approval first",
          Not_Accepted: "Needs acceptance first",
        };
        return req.reject(
          400,
          statusMessages[rfqHeader.Status] ||
            `Invalid status: ${rfqHeader.Status}`
        );
      }

      const SupplierQuotation = rfqHeader?.SupplierQuotation;
      if (!SupplierQuotation) return req.reject(400, "Missing Quotation ID");

      const now = new Date();

      // 1. First validate all items locally
      const validatedItems = items.map((item) => {
        if (!item.ItemNumber)
          throw { code: 400, message: "Missing ItemNumber" };
        if (item.Netpr == null)
          throw {
            code: 400,
            message: `Missing Netpr for item ${item.ItemNumber}`,
          };
        if (item.Netpr <= 0)
          throw {
            code: 400,
            message: `Invalid Netpr for item ${item.ItemNumber}`,
          };
        if (!item.Quantity)
          throw {
            code: 400,
            message: `Missing Quantity for item ${item.ItemNumber}`,
          };
        if (!item.DeliveryDate)
          throw {
            code: 400,
            message: `Missing Delivery Date for item ${item.ItemNumber}`,
          };
        if (!item.ExpectedDeliveryDate)
          throw {
            code: 400,
            message: `Missing Expected Delivery Date for item ${item.ItemNumber}`,
          };

        // Validate that DeliveryDate and ExpectedDeliveryDate are not less than current date
        const deliveryDate = new Date(item.DeliveryDate);
        const expectedDeliveryDate = new Date(item.ExpectedDeliveryDate);

        if (deliveryDate < now) {
          throw {
            code: 400,
            message: `Delivery Date cannot be in the past for item ${item.ItemNumber}`,
          };
        }

        if (expectedDeliveryDate < now) {
          throw {
            code: 400,
            message: `Expected Delivery Date cannot be in the past for item ${item.ItemNumber}`,
          };
        }

        const parsedPrice = parseFloat(item.Netpr);
        const parsedQuantity = parseFloat(item.Quantity);
        const Netwr = parsedPrice * parsedQuantity;

        return { ...item, parsedPrice, Netwr };
      });

      // 2. Update all items in SAP in a single batch with retry logic
      const updateSAPItems = async (attempt = 1) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000; // 2 seconds

        try {
          // Process items sequentially to avoid SAP locking
          for (const item of validatedItems) {
            const status = await updateQuotationItemsInS4({
              SupplierQuotation,
              ItemNumber: item.ItemNumber,
              NetPriceAmount: item.parsedPrice,
            });

            if (status !== 204) {
              throw new Error(`SAP update failed for item ${item.ItemNumber}`);
            }
          }
        } catch (error) {
          if (attempt <= MAX_RETRIES) {
            console.warn(`Retrying SAP item updates (attempt ${attempt})...`);
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAY * attempt)
            );
            return updateSAPItems(attempt + 1);
          }
          throw error;
        }
      };

      await updateSAPItems();

      // 3. Process additional charges
      const processCharges = () => {
        if (!Additional_Charge_Present) return [];

        if (
          !Array.isArray(Additional_Charges) ||
          Additional_Charges.length === 0
        ) {
          throw { code: 400, message: "Additional charges required" };
        }

        return Additional_Charges.map((charge) => ({
          Charge_Name: charge.Charge_Name,
          Charge_Price: parseFloat(charge.Charge_Price),
          Charge_Unit: charge.Charge_Unit,
        }));
      };

      // 4. Process additional attachments
      const processAttachments = async () => {
        if (!Additional_Attachment_Present) return [];

        if (
          !Array.isArray(Additional_Attachments) ||
          Additional_Attachments.length === 0
        ) {
          throw { code: 400, message: "Additional attachments required" };
        }

        return Promise.all(
          Additional_Attachments.map(async (attachment) => {
            if (!attachment.DOCUMENT_ID || !attachment.FILE_URL) {
              throw {
                code: 400,
                message: "Missing required attachment fields",
              };
            }

            return {
              DOCUMENT_ID: attachment.DOCUMENT_ID,
              FILE_NAME: attachment.FILE_NAME || "",
              DESCRIPTION: attachment.DESCRIPTION || "",
              FILE_URL: await uploadImageToAzure(
                attachment.FILE_URL,
                attachment.DOCUMENT_ID
              ),
            };
          })
        );
      };

      const [validatedCharges, validatedAttachments] = await Promise.all([
        processCharges(),
        processAttachments(),
      ]);

      // 5. Final submission to SAP
      const finalSubmitRFQ = await createQuotationAgainstRFQInS4HANA(
        SupplierQuotation
      );

      if (!finalSubmitRFQ)
        throw { code: 500, message: "Final SAP submission failed" };

      // 6. Prepare all database updates
      const updates = {
        $set: {
          Status: "Submitted",
          Remarks: Remarks || rfqHeader.Remarks || "",
          LAST_UPDATED_ON: now,
          Additional_Charge_Present,
          Additional_Charges: validatedCharges,
          Additional_Attachment_Present,
          Additional_Attachments: validatedAttachments,
        },
      };

      // 7. Execute all database operations
      await Promise.all([
        RFQWorkHeaderColl.updateOne({ RfqNumber, Bidder }, updates),
        RFQWorkItemColl.bulkWrite(
          validatedItems.map((item) => ({
            updateOne: {
              filter: { RfqNumber, Bidder, ItemNumber: item.ItemNumber },
              update: {
                $set: {
                  Netwr: item.Netwr,
                  Netpr: item.parsedPrice,
                  Confirmation_Status: true,
                  DeliveryDate: item.DeliveryDate,
                  ExpectedDeliveryDate: item.ExpectedDeliveryDate,
                  LAST_UPDATED_ON: now,
                },
              },
            },
          }))
        ),
        RFQLogsColl.insertOne({
          REQUEST_NO: RfqNumber,
          BIDDER: Bidder,
          ACTION: "Submitted",
          TIMESTAMP: now,
          APPROVER_ID: req.user?.id || "SYSTEM",
          COMMENT: "Submitted",
        }),
      ]);

      // Return success response
      return {
        success: true,
        message: `RFQ ${RfqNumber} submitted successfully`,
        SupplierQuotation,
      };
    } catch (error) {
      console.error("SubmitRFQ error:", error);
      const code = error.code || 500;
      const message = error.message || "Failed to submit RFQ";
      return req.reject(code, message);
    }
  });

  // Deadline Date Passed Check
  srv.on("EditRFQ", async (req) => {
    const {
      RfqNumber,
      Bidder,
      Items = [],
      Additional_Charge_Present = false,
      Additional_Charges = [],
      Remarks,
      Additional_Attachment_Present = false,
      Additional_Attachments = [],
    } = req.data;

    if (!RfqNumber || !Bidder) {
      return req.reject(400, "RfqNumber and Bidder are required");
    }

    const { database } = await getConnection();
    const RFQWorkHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");
    const RFQWorkItemColl = database.collection("ZC_AISP_RFQ_WORK_ITEM");
    const RFQLogsColl = database.collection("ZC_AISP_RFQ_LOGS");

    try {
      const rfqHeader = await RFQWorkHeaderColl.findOne({ RfqNumber, Bidder });

      if (!rfqHeader) return req.reject(404, "RFQ not found");

      if (!["Submitted", "Draft"].includes(rfqHeader.Status)) {
        return req.reject(
          400,
          "Only Submitted RFQs or RFQs in Draft Status can be edited"
        );
      }

      const now = new Date();
      const validFields = ["Netpr", "Netwr"];
      const SupplierQuotation = rfqHeader?.SupplierQuotation;

      if (!SupplierQuotation) {
        return req.reject(400, "Quotation ID not present");
      }

      // 1. First validate all items locally
      const validatedItems = Items.map((item) => {
        if (!item.ItemNumber)
          throw { code: 400, message: "Missing ItemNumber" };
        if (item.Netpr == null)
          throw {
            code: 400,
            message: `Missing Netpr for item ${item.ItemNumber}`,
          };
        if (item.Netpr <= 0)
          throw {
            code: 400,
            message: `Invalid Netpr for item ${item.ItemNumber}`,
          };
        if (!item.Quantity)
          throw {
            code: 400,
            message: `Missing Quantity for item ${item.ItemNumber}`,
          };
        if (!item.DeliveryDate)
          throw {
            code: 400,
            message: `Missing Delivery Date for item ${item.ItemNumber}`,
          };
        if (!item.ExpectedDeliveryDate)
          throw {
            code: 400,
            message: `Missing Expected Delivery Date for item ${item.ItemNumber}`,
          };

        // Validate that DeliveryDate and ExpectedDeliveryDate are not less than current date
        const deliveryDate = new Date(item.DeliveryDate);
        const expectedDeliveryDate = new Date(item.ExpectedDeliveryDate);

        if (deliveryDate < now) {
          throw {
            code: 400,
            message: `Delivery Date cannot be in the past for item ${item.ItemNumber}`,
          };
        }

        if (expectedDeliveryDate < now) {
          throw {
            code: 400,
            message: `Expected Delivery Date cannot be in the past for item ${item.ItemNumber}`,
          };
        }

        const parsedPrice = parseFloat(item.Netpr);
        const parsedQuantity = parseFloat(item.Quantity);
        const Netwr = parsedPrice * parsedQuantity;

        return { ...item, parsedPrice, Netwr };
      });

      // 2. Update all items in SAP sequentially with retry logic
      const updateSAPItems = async (attempt = 1) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000; // 2 seconds

        try {
          // Process items sequentially to avoid SAP locking
          for (const item of validatedItems) {
            const status = await updateQuotationItemsInS4({
              SupplierQuotation,
              ItemNumber: item.ItemNumber,
              NetPriceAmount: item.parsedPrice,
            });

            if (status !== 204) {
              throw new Error(`SAP update failed for item ${item.ItemNumber}`);
            }

            // Small delay between updates to reduce SAP locking pressure
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (error) {
          if (attempt <= MAX_RETRIES) {
            console.warn(`Retrying SAP item updates (attempt ${attempt})...`);
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAY * attempt)
            );
            return updateSAPItems(attempt + 1);
          }
          throw error;
        }
      };

      await updateSAPItems();

      // 3. Process additional charges
      const processCharges = () => {
        if (!Additional_Charge_Present) return [];

        if (
          !Array.isArray(Additional_Charges) ||
          Additional_Charges.length === 0
        ) {
          throw { code: 400, message: "Additional charges required" };
        }

        return Additional_Charges.map((charge, idx) => {
          if (!charge.Charge_Name)
            throw { code: 400, message: `Charge_Name missing at index ${idx}` };
          if (!charge.Charge_Price)
            throw {
              code: 400,
              message: `Charge_Price missing at index ${idx}`,
            };
          if (!charge.Charge_Unit)
            throw { code: 400, message: `Charge_Unit missing at index ${idx}` };

          return {
            Charge_Name: charge.Charge_Name,
            Charge_Price: parseFloat(charge.Charge_Price),
            Charge_Unit: charge.Charge_Unit,
          };
        });
      };

      // 4. Process additional attachments
      const processAttachments = async () => {
        if (!Additional_Attachment_Present) return [];

        if (
          !Array.isArray(Additional_Attachments) ||
          Additional_Attachments.length === 0
        ) {
          throw { code: 400, message: "Additional attachments required" };
        }

        const uploadedFiles = [];
        for (const attachment of Additional_Attachments) {
          const { DOCUMENT_ID, FILE_NAME, FILE_URL, DESCRIPTION } = attachment;

          if (!DOCUMENT_ID)
            throw { code: 400, message: "DOCUMENT_ID missing in attachment" };
          if (!FILE_URL)
            throw {
              code: 400,
              message: `FILE_URL missing for document ${DOCUMENT_ID}`,
            };

          let finalUrl = FILE_URL;

          if (FILE_URL && isBase64(FILE_URL)) {
            console.log("Base64 image detected. Uploading to Azure...");
            finalUrl = await uploadImageToAzure(FILE_URL, FILE_NAME);
            if (!finalUrl) {
              throw { code: 400, message: "Failed to upload image to Azure" };
            }
          }

          uploadedFiles.push({
            DOCUMENT_ID,
            FILE_NAME: FILE_NAME || "",
            DESCRIPTION: DESCRIPTION || "",
            FILE_URL: finalUrl || "",
          });
        }

        return uploadedFiles;
      };

      const [validatedCharges, validatedAttachments] = await Promise.all([
        processCharges(),
        processAttachments(),
      ]);

      // 5. If status is 'Draft', create RFQ in S4
      if (rfqHeader.Status === "Draft") {
        const finalSubmitRFQ = await createQuotationAgainstRFQInS4HANA(
          SupplierQuotation
        );
        if (!finalSubmitRFQ) {
          throw { code: 400, message: "Failed to submit RFQ to S4HANA" };
        }
      }

      // 6. Prepare all database updates
      const updates = {
        $set: {
          Status: "Submitted",
          LAST_UPDATED_ON: now,
          Remarks: Remarks || rfqHeader.Remarks || "",
          Additional_Charge_Present,
          Additional_Charges: validatedCharges,
          Additional_Attachment_Present,
          Additional_Attachments: validatedAttachments,
        },
      };

      // 7. Prepare MongoDB bulk operations for items
      const itemBulkOps = validatedItems.map((item) => ({
        updateOne: {
          filter: { RfqNumber, Bidder, ItemNumber: item.ItemNumber },
          update: {
            $set: {
              Netwr: item.Netwr,
              Netpr: item.parsedPrice,
              DeliveryDate: item.DeliveryDate,
              ExpectedDeliveryDate: item.ExpectedDeliveryDate,
              LAST_UPDATED_ON: now,
            },
          },
        },
      }));

      // 8. Execute all database operations
      await Promise.all([
        RFQWorkHeaderColl.updateOne({ RfqNumber, Bidder }, updates),
        itemBulkOps.length > 0
          ? RFQWorkItemColl.bulkWrite(itemBulkOps, { ordered: false })
          : Promise.resolve(),
        RFQLogsColl.insertOne({
          RfqNumber,
          Bidder,
          Timestamp: now,
          ACTION: "Edited",
          EditedBy: req.user?.id || "SYSTEM",
          ItemsEdited: validatedItems.length,
          FieldsEdited: validFields.filter((f) =>
            Items.some((i) => i[f] !== undefined)
          ),
        }),
      ]);

      return req.info(`RFQ ${RfqNumber} edited successfully.`);
    } catch (error) {
      console.error("EditRFQ failed:", error);
      return req.reject(
        error.code || 500,
        error.message || "Internal Server Error"
      );
    }
  });

  srv.on("READ", "RFQ_status", async (req) => {
    const { database } = await getConnection();
    const headerCol = database.collection("ZC_AISP_RFQ_HDR");
    const sesHeadCol = database.collection("ZC_AISP_RFQ_WORK_HDR");

    try {
      // 1. Get unique statuses from both collections
      const rawStatusesHdr = await headerCol.distinct("Status");
      const rawStatusesHead = await sesHeadCol.distinct("Status");

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

  // === Value Help: DISTINCT RFQ Numbers ===
  srv.on("READ", "VH_RfqNumber", async (req) => {
    const { database } = await getConnection();
    const coll = database.collection("ZC_AISP_RFQ_HDR");

    // Reuse your helper to honor $filter, $search, $orderby
    const { query } = await buildQuery(req);

    const { skip, limit } = buildPagination(req); // uses $skip/$top

    // DISTINCT with sort/paging via aggregation (Mongo `distinct` lacks sort/paging)
    const pipeline = [
      { $match: query || {} },
      { $group: { _id: "$RfqNumber" } },
      { $sort: { _id: 1 } },
      ...(skip ? [{ $skip: skip }] : []),
      ...(limit ? [{ $limit: limit }] : []),
      { $project: { _id: 0, RfqNumber: "$_id" } },
    ];

    const rows = await coll.aggregate(pipeline).toArray();

    // Optional: return count when asked (?$count=true)
    // if (req.query?.SELECT?.count === 'true') {
    //   const count = await coll.aggregate([
    //     { $match: query || {} },
    //     { $group: { _id: '$RfqNumber' } },
    //     { $count: 'n' }
    //   ]).toArray();
    //   rows['$count'] = count[0]?.n || 0;
    // }

    if (req._queryOptions?.$count === "true") {
      const uniqueValues = await coll.distinct("RfqNumber");
      rows["$count"] = uniqueValues.length;
    }

    return rows;
  });

  // === Value Help: DISTINCT Bidders ===
  srv.on("READ", "VH_Bidder", async (req) => {
    const { database } = await getConnection();
    const coll = database.collection("ZC_AISP_RFQ_HDR");

    const { query } = await buildQuery(req, ["RfqNumber"]);
    const { skip, limit } = buildPagination(req);

    const pipeline = [
      { $match: query || {} },
      { $group: { _id: "$Bidder" } },
      { $sort: { _id: 1 } },
      ...(skip ? [{ $skip: skip }] : []),
      ...(limit ? [{ $limit: limit }] : []),
      { $project: { _id: 0, Bidder: "$_id" } },
    ];

    const rows = await coll.aggregate(pipeline).toArray();

    // if (req.query?.SELECT?.count === 'true') {
    //   const count = await coll.aggregate([
    //     { $match: query || {} },
    //     { $group: { _id: '$Bidder' } },
    //     { $count: 'n' }
    //   ]).toArray();
    //   rows['$count'] = count[0]?.n || 0;
    // }

    if (req._queryOptions?.$count === "true") {
      const uniqueValues = await coll.distinct("Bidder");
      rows["$count"] = uniqueValues.length;
    }

    return rows;
  });

  srv.on("READ", "VH_RfqNumber_Draft", async (req) => {
    const { database } = await getConnection();
    const coll = database.collection("ZC_AISP_RFQ_WORK_HDR"); // Correct collection

    // Step 1: Build the base query (includes $filter conditions from request)
    const { query: baseQuery } = await buildQuery(req);

    // Step 2: Remove any existing 'Status' condition (if present)
    const sanitizedQuery = { ...baseQuery };
    if (sanitizedQuery.Status) {
      delete sanitizedQuery.Status;
    }
    if (sanitizedQuery.$or) {
      sanitizedQuery.$or = sanitizedQuery.$or.filter(
        (condition) => !condition.Status
      );
      if (sanitizedQuery.$or.length === 0) {
        delete sanitizedQuery.$or;
      }
    }

    // Step 3: Forcefully add Status: 'Draft' (overrides any previous Status condition)
    const finalQuery = {
      ...sanitizedQuery,
      Status: "Draft", // Ensures only draft records are fetched
    };

    const { skip, limit } = buildPagination(req);

    const pipeline = [
      { $match: finalQuery },
      { $group: { _id: "$RfqNumber" } },
      { $sort: { _id: 1 } },
      ...(skip ? [{ $skip: skip }] : []),
      ...(limit ? [{ $limit: limit }] : []),
      { $project: { _id: 0, RfqNumber: "$_id" } },
    ];

    const rows = await coll.aggregate(pipeline).toArray();

    // Optional count
    if (req.query?.SELECT?.count === "true") {
      const count = (await coll.distinct("RfqNumber", finalQuery)).length;
      rows["$count"] = count;
    }

    return rows;
  });

  srv.on("READ", "VH_Bidder_Draft", async (req) => {
    const { database } = await getConnection();
    const coll = database.collection("ZC_AISP_RFQ_WORK_HDR"); // Changed to correct collection

    // Step 1: Build the base query
    const { query: baseQuery } = await buildQuery(req);

    // Step 2: Remove any existing 'Status' condition
    const sanitizedQuery = { ...baseQuery };
    if (sanitizedQuery.Status) {
      delete sanitizedQuery.Status;
    }
    if (sanitizedQuery.$or) {
      sanitizedQuery.$or = sanitizedQuery.$or.filter(
        (condition) => !condition.Status
      );
      if (sanitizedQuery.$or.length === 0) {
        delete sanitizedQuery.$or;
      }
    }

    // Step 3: Forcefully add Status: 'Draft'
    const finalQuery = {
      ...sanitizedQuery,
      Status: "Draft", // Ensures only draft records
    };

    const { skip, limit } = buildPagination(req);

    const pipeline = [
      { $match: finalQuery },
      { $group: { _id: "$Bidder" } }, // Grouping by Bidder instead of RfqNumber
      { $sort: { _id: 1 } },
      ...(skip ? [{ $skip: skip }] : []),
      ...(limit ? [{ $limit: limit }] : []),
      { $project: { _id: 0, Bidder: "$_id" } }, // Projecting Bidder field
    ];

    const rows = await coll.aggregate(pipeline).toArray();

    if (req.query?.SELECT?.count === "true") {
      const count = (await coll.distinct("Bidder", finalQuery)).length;
      rows["$count"] = count;
    }

    return rows;
  });

  srv.on("updateSAPItems", async (req) => {
    const { SupplierQuotation, ItemNumber, NetPriceAmount } = req.data;

    // Input validation
    if (!SupplierQuotation || typeof SupplierQuotation !== "string") {
      return req.error(400, "Valid quotationNumber is required");
    }

    if (!ItemNumber) {
      return req.error(400, "Item Number is required");
    }

    if (!NetPriceAmount) {
      return req.error(400, "NetPriceAmount is required");
    } else if (NetPriceAmount <= 0) {
      return req.error(400, "NetPriceAmount cannot be less than or equal to 0");
    }

    try {
      // Process the single item with retry logic
      const updateSAPItemWithRetry = async (attempt = 1) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000; // 2 seconds

        try {
          const status = await updateQuotationItemsInS4({
            SupplierQuotation,
            ItemNumber,
            NetPriceAmount,
          });

          if (status !== 204) {
            throw new Error(
              `SAP update failed for item ${ItemNumber} with status ${status}`
            );
          }

          return status;
        } catch (error) {
          if (attempt <= MAX_RETRIES) {
            console.warn(`Retrying SAP item update (attempt ${attempt})...`);
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAY * attempt)
            );
            return updateSAPItemWithRetry(attempt + 1);
          }
          throw error;
        }
      };

      await updateSAPItemWithRetry();

      return {
        success: true,
        message: "SAP item updated successfully",
        processedItems: 1,
        quotationNumber: SupplierQuotation,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return req.error(500, `Failed to update SAP item: ${error.message}`);
    }
  });

  // Cron job to fetch and update RFQ records every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      // Fetch data in parallel
      const [headerData, itemData] = await Promise.all([
        fetchAllRFQHeaders(),
        fetchAllRFQItems(),
      ]);

      const { database } = await getConnection();
      const rfqHeadColl = database.collection("ZC_AISP_RFQ_HDR");
      const rfqItemColl = database.collection("ZC_AISP_RFQ_ITEM");

      // Create unique indexes if they don't exist
      await rfqHeadColl.createIndex(
        { RfqNumber: 1, Bidder: 1 },
        { unique: true, sparse: true }
      );
      await rfqItemColl.createIndex(
        { RfqNumber: 1, ItemNumber: 1, Bidder: 1 },
        { unique: true, sparse: true }
      );

      // Store header data using bulk operations
      if (headerData.length > 0) {
        await storeRFQHeadersBulk(headerData, rfqHeadColl);
      }

      // Store item data using bulk operations
      if (itemData.length > 0) {
        await storeRFQItemsBulk(itemData, rfqItemColl);
      }
    } catch (err) {
      console.error("[CRON] RFQ sync failed:", err.message);
    }
  });

  // Bulk upsert for RFQ headers
  async function storeRFQHeadersBulk(headerData, rfqHeadColl) {
    const dateFields = [
      "Deadline_dt",
      "DocumentDate",
      "Published_d",
      "Published_d_t",
    ];

    const bulkOps = headerData
      .filter((doc) => doc.RfqNumber && doc.Bidder)
      .map((doc) => {
        // Format all date fields as Date objects
        const formattedDoc = { ...doc };
        dateFields.forEach((field) => {
          if (doc[field]) {
            const value = doc[field].toString();
            const sapMatch = value.match(/\/Date\((\d+)\)\//);
            formattedDoc[field] = sapMatch
              ? new Date(parseInt(sapMatch[1]))
              : new Date(value);
          }
        });

        formattedDoc.LAST_UPDATED_ON = new Date();

        return {
          updateOne: {
            filter: { RfqNumber: doc.RfqNumber, Bidder: doc.Bidder },
            update: {
              $set: formattedDoc,
              $setOnInsert: { CREATED_ON: new Date() },
            },
            upsert: true,
          },
        };
      });

    if (bulkOps.length > 0) {
      const result = await rfqHeadColl.bulkWrite(bulkOps, { ordered: false });
    } else {
      console.log("[INFO] No valid RFQ header records to process.");
    }
  }

  // Bulk upsert for RFQ items
  async function storeRFQItemsBulk(itemData, rfqItemColl) {
    const dateFields = [
      "Deadline_dt",
      "DocumentDate",
      "Published_d",
      "Published_d_t",
    ];

    const bulkOps = itemData
      .filter((doc) => doc.RfqNumber && doc.ItemNumber && doc.Bidder)
      .map((doc) => {
        const totalPrice =
          parseFloat(doc.Netpr || 0) * parseFloat(doc.Quantity || 0);

        // Format date fields as Date objects
        const formattedDoc = { ...doc };
        dateFields.forEach((field) => {
          if (doc[field]) {
            const value = doc[field].toString();
            const sapMatch = value.match(/\/Date\((\d+)\)\//);
            formattedDoc[field] = sapMatch
              ? new Date(parseInt(sapMatch[1]))
              : new Date(value);
          }
        });

        formattedDoc.TOTAL_PRICE = totalPrice;
        formattedDoc.LAST_UPDATED_ON = new Date();

        return {
          updateOne: {
            filter: {
              RfqNumber: doc.RfqNumber,
              ItemNumber: doc.ItemNumber,
              Bidder: doc.Bidder,
            },
            update: {
              $set: formattedDoc,
              $setOnInsert: { CREATED_ON: new Date() },
            },
            upsert: true,
          },
        };
      });

    if (bulkOps.length > 0) {
      const result = await rfqItemColl.bulkWrite(bulkOps, { ordered: false });
    } else {
      console.log("[INFO] No valid RFQ item records to process.");
    }
  }

  async function fetchAllRFQHeaders(pageSize = 500) {
    try {
      const all = [];
      let skip = 0;
      const srv = await cds.connect.to("ZC_AISP_RFQ_HDR_BND");

      while (true) {
        const page = await srv.run(
          SELECT.from("ZC_AISP_RFQ_HDR").limit(pageSize, skip)
        );
        if (!page.length) break;
        all.push(...page);
        skip += page.length;
        if (page.length < pageSize) break;
      }

      return all;
    } catch (err) {
      console.error("[ERROR] Failed to fetch RFQ headers:", err.message);
      return [];
    }
  }

  async function fetchAllRFQItems(pageSize = 500) {
    try {
      const all = [];
      let skip = 0;
      const srv = await cds.connect.to("ZC_AISP_RFQ_HDR_BND");

      while (true) {
        const page = await srv.run(
          SELECT.from("ZC_AISP_RFQ_ITEM").limit(pageSize, skip)
        );
        if (!page.length) break;
        all.push(...page);
        skip += page.length;
        if (page.length < pageSize) break;
      }

      return all;
    } catch (err) {
      console.error("[ERROR] Failed to fetch RFQ items:", err.message);
      return [];
    }
  }
};
