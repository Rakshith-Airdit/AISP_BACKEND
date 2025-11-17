const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");
const { buildQuery } = require("./Library/Mongoquery");
const { BlobServiceClient } = require("@azure/storage-blob");
const fileType = require("file-type");
const { v4: uuidv4 } = require("uuid");
const ExcelJS = require("exceljs");
const {
  buildMatchStage,
  buildSortStage,
  buildSkipStage,
  buildLimitStage,
  buildProjectStage,
  buildPipeline,
  buildGroupStage,
  buildAddFieldsStage,
} = require("./Library/Aggregation");

// Utility function to update product count for a specific category
async function updateCategoryProductCount(database, commodityCode) {
  const CatalogItemsColl = database.collection("ProductCatalogItems");
  const CatalogCategoriesColl = database.collection(
    "ProductCatalogCommodityCodes"
  );

  if (!commodityCode) return;

  // Count products in this category
  const productCount = await CatalogItemsColl.countDocuments({
    CommodityCode: commodityCode,
  });

  // Update the category with new count
  await CatalogCategoriesColl.updateOne(
    { Commodity: commodityCode },
    {
      $set: {
        NumberOfProducts: productCount,
        // LastUpdated: new Date(),
      },
    },
    { upsert: false } // Don't create new category if it doesn't exist
  );
}

// Validation function within handler
const validateDraftForSubmission = (draft) => {
  const errors = [];
  const requiredFields = [
    "ProductName",
    "CommodityCode",
    "Category",
    "UnitPrice",
    "CurrencyCode",
    "UnitOfMeasure",
    "LeadTimeDays",
    "AdditionalLink",
    "ProductDescription",
  ];

  requiredFields.forEach((field) => {
    if (!draft[field] && draft[field] !== 0) {
      errors.push(`${field} is required`);
    }
  });

  // Numeric validation
  if (draft.UnitPrice) {
    const price = parseFloat(draft.UnitPrice);
    if (isNaN(price) || price <= 0) {
      errors.push("UnitPrice must be a positive number");
    }
  }

  if (draft.LeadTimeDays) {
    const leadTime = parseInt(draft.LeadTimeDays);
    if (isNaN(leadTime) || leadTime < 0) {
      errors.push("LeadTimeDays must be a valid positive integer");
    }
  }

  if (draft.CommodityCode) {
    const commodityCode = parseInt(draft.CommodityCode);
    if (isNaN(commodityCode)) {
      errors.push("CommodityCode must be a valid number");
    }
  }

  return errors;
};

const isBase64 = (str) => {
  // If it doesn't start with "http://" or "https://", assume it's Base64.
  return !(str.startsWith("http://") || str.startsWith("https://"));
};

const connectionString = cds.env.requires.azure_storage?.connectionString;

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

async function uploadImageToAzure(IMAGEURL, IMAGE_FILE_NAME) {
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

    // Generate a unique file name for Azure using UUID or timestamp
    const uniqueFileName = `${uuidv4()}_${IMAGE_FILE_NAME}`; // Using UUID for uniqueness
    const uniqueFilePath = `${uniqueFileName}.${extension}`;

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
  srv.on("READ", "ProductCatalogItems", async (req) => {
    try {
      const { database } = await getConnection();
      const CatalogItemsColl = database.collection("ProductCatalogItems");
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await CatalogItemsColl.countDocuments();
        return { "@odata.count": count };
      }

      // Fetch the data
      const itemsData = await CatalogItemsColl.find(query, {
        projection: selectFields,
      })
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      itemsData["$count"] = itemsData.length;

      return itemsData;
    } catch (error) {
      console.error("Failed to fetch Product Catalog Items:", error);
      req.error(
        500,
        "Failed to retrieve Product Catalog Items. Please try again later."
      );
    }
  });

  srv.on("CREATE", "ProductCatalogItems", async (req) => {
    try {
      const { database } = await getConnection();
      const CatalogItemsColl = database.collection("ProductCatalogItems");

      const productData = req.data;

      // const existingProduct = await CatalogItemsColl.findOne({
      //   ProductId: productData.productId,
      // });

      // if (existingProduct) return req.error(404, "Product already exists!!");

      // --- Required field validation ---
      const requiredFields = [
        "ProductName",
        "CommodityCode",
        "Category",
        "UnitPrice",
        "CurrencyCode",
        "UnitOfMeasure",
        "LeadTimeDays",
        "ProductDescription",
        "ProductImage",
        "ProductSpecification",
      ];

      for (const field of requiredFields) {
        if (
          productData[field] === undefined ||
          productData[field] === null ||
          productData[field] === ""
        ) {
          return req.error(400, `${field} is required.`);
        }
      }

      // --- Type validation ---
      if (
        productData.UnitPrice === undefined ||
        productData.UnitPrice === null ||
        productData.UnitPrice === ""
      ) {
        return req.error(400, "UnitPrice is required.");
      }

      productData.CommodityCode = parseInt(
        String(productData.CommodityCode).trim()
      );
      productData.UnitPrice = parseFloat(String(productData.UnitPrice).trim());

      if (isNaN(productData.UnitPrice) || productData.UnitPrice <= 0) {
        return req.error(400, "UnitPrice must be a positive number.");
      }

      if (
        !Number.isInteger(productData.LeadTimeDays) ||
        productData.LeadTimeDays < 0
      )
        return req.error(400, "LeadTimeDays must be a valid positive integer.");

      if (
        typeof productData.CurrencyCode !== "string" ||
        productData.CurrencyCode.length !== 3
      )
        return req.error(
          400,
          "CurrencyCode must be a 3-letter ISO code (e.g., 'USD')."
        );

      if (
        productData.AdditionalLink &&
        !/^https?:\/\//.test(productData.AdditionalLink)
      )
        return req.error(
          400,
          "AdditionalLink must be a valid URL starting with http or https."
        );

      // --- Validate that Category exists in the category collection ---
      const commodityCodesExists = await database
        .collection("ProductCatalogCommodityCodes")
        .findOne({ Commodity: productData.CommodityCode });

      const categoryExists = await database
        .collection("ProductCatalogCommodityCodes")
        .findOne({ CommodityName: productData.Category });

      if (!commodityCodesExists) {
        return req.error(
          400,
          `Invalid Commodity Code: '${productData.CommodityCode}'.`
        );
      }
      if (!categoryExists) {
        return req.error(400, `Invalid Category: '${productData.Category}'.`);
      }

      // --- Validate file formats ---
      if (
        productData.ProductImage &&
        !productData.ProductImage.startsWith("data:image/")
      )
        return req.error(
          400,
          "ProductImage must be a valid base64 image data URL."
        );

      if (
        productData.ProductSpecification &&
        !productData.ProductSpecification.startsWith("data:application/pdf")
      )
        return req.error(
          400,
          "ProductSpecification must be a valid base64 PDF data URL."
        );

      // --- Upload Product Image ---
      let uploadedProductImageUrl = null;
      if (productData.ProductImage.startsWith("data:")) {
        try {
          uploadedProductImageUrl = await uploadImageToAzure(
            productData.ProductImage.split(",")[1],
            productData.ProductName
          );
        } catch (uploadError) {
          console.error("Failed to upload product image:", uploadError);
          return req.error(500, "Failed to upload product image to storage.");
        }
      }

      // --- Upload Product Specification ---
      let uploadedProductSpecificationUrl = null;
      if (productData.ProductSpecification.startsWith("data:")) {
        try {
          uploadedProductSpecificationUrl = await uploadImageToAzure(
            // productData.ProductId,
            productData.ProductSpecification.split(",")[1],
            productData.ProductName
          );
        } catch (uploadError) {
          console.error("Failed to upload product specification:", uploadError);
          return req.error(
            500,
            "Failed to upload product specification to storage."
          );
        }
      }

      // --- Construct Final Payload Object ---
      const now = new Date();
      const payload = {
        ProductId: cds.utils.uuid(),
        ProductName: productData.ProductName,
        CommodityCode: productData.CommodityCode,
        Category: productData.Category,
        SearchTerm: productData.SearchTerm || [],
        UnitPrice: productData.UnitPrice,
        CurrencyCode: productData.CurrencyCode,
        UnitOfMeasure: productData.UnitOfMeasure,
        LeadTimeDays: productData.LeadTimeDays,
        PartNumber: productData.PartNumber || "",
        AdditionalLink: productData.AdditionalLink || "",
        ProductDescription: productData.ProductDescription,
        ProductImage: uploadedProductImageUrl,
        ProductSpecification: uploadedProductSpecificationUrl,
        CreatedAt: now,
        ModifiedAt: now,
        CreatedBy: req.user?.id || "system",
        ModifiedBy: req.user?.id || "system",
      };

      // --- Insert into MongoDB ---
      const result = await CatalogItemsColl.insertOne(payload);
      if (result.insertedId) {
        await updateCategoryProductCount(database, payload.CommodityCode);
        return payload;
      } else {
        req.error(500, "Failed to create Product Catalog Item.");
      }
    } catch (error) {
      console.error("Failed to create Product Catalog Item:", error);
      req.error(
        500,
        "Unexpected error occurred while creating Product Catalog Item."
      );
    }
  });

  srv.on("UPDATE", "ProductCatalogItems", async (req) => {
    try {
      const { database } = await getConnection();
      const CatalogItemsColl = database.collection("ProductCatalogItems");

      const productId = req.data.ProductId;
      const updateData = { ...req.data };

      if (!productId)
        return req.error(400, "ProductId is required for update.");

      // Remove immutable fields
      delete updateData.ProductId;
      delete updateData._id;

      // --- Retrieve existing product ---
      const existingProduct = await CatalogItemsColl.findOne({
        ProductId: productId,
      });

      if (!existingProduct) return req.error(404, "Product not found.");

      // --- Parse and validate numeric fields if provided ---
      if (updateData.UnitPrice !== undefined) {
        updateData.UnitPrice = parseFloat(String(updateData.UnitPrice).trim());
        if (isNaN(updateData.UnitPrice) || updateData.UnitPrice <= 0)
          return req.error(400, "UnitPrice must be a positive number.");
      }

      if (updateData.LeadTimeDays !== undefined) {
        if (
          !Number.isInteger(updateData.LeadTimeDays) ||
          updateData.LeadTimeDays < 0
        )
          return req.error(
            400,
            "LeadTimeDays must be a valid positive integer."
          );
      }

      if (updateData.CurrencyCode) {
        if (
          typeof updateData.CurrencyCode !== "string" ||
          updateData.CurrencyCode.length !== 3
        )
          return req.error(
            400,
            "CurrencyCode must be a 3-letter ISO code (e.g., 'USD')."
          );
      }

      if (
        updateData.AdditionalLink &&
        !/^https?:\/\//.test(updateData.AdditionalLink)
      )
        return req.error(
          400,
          "AdditionalLink must be a valid URL starting with http or https."
        );

      // --- Validate Category & Commodity Code existence if updated ---
      if (updateData.Category || updateData.CommodityCode) {
        const categoryMasterColl = database.collection(
          "ProductCatalogCommodityCodes"
        );

        let categoryCheck = null;
        let commodityCheck = null;

        if (updateData.Category) {
          categoryCheck = await categoryMasterColl.findOne({
            CommodityName: updateData.Category,
          });
          if (!categoryCheck)
            return req.error(
              400,
              `Invalid Category: '${updateData.Category}' not found in ProductCatalogCommodityCodes.`
            );
        }

        if (updateData.CommodityCode) {
          const codeParsed = parseInt(String(updateData.CommodityCode).trim());
          commodityCheck = await categoryMasterColl.findOne({
            Commodity: codeParsed,
          });
          if (!commodityCheck)
            return req.error(
              400,
              `Invalid Commodity Code: '${updateData.CommodityCode}'.`
            );
          updateData.CommodityCode = codeParsed;
        }
      }

      // --- Handle Product Image (Base64 or Blob URL) ---
      let uploadedProductImageUrl = existingProduct.ProductImageUrl || null;

      if (updateData.ProductImage) {
        if (isBase64(updateData.ProductImage)) {
          if (!updateData.ProductImage.startsWith("data:image/"))
            return req.error(
              400,
              "ProductImage must be a valid base64 image data URL."
            );

          try {
            uploadedProductImageUrl = await uploadImageToAzure(
              // productId,
              updateData.ProductImage.split(",")[1],
              updateData.ProductName
            );
          } catch (uploadError) {
            console.error("Failed to upload product image:", uploadError);
            return req.error(500, "Failed to upload product image to storage.");
          }
        } else {
          uploadedProductImageUrl = updateData.ProductImage; // Keep existing Blob URL
        }
        delete updateData.ProductImage;
      }

      // --- Handle Product Specification (Base64 or Blob URL) ---
      let uploadedProductSpecificationUrl =
        existingProduct.ProductSpecificationUrl || null;

      if (updateData.ProductSpecification) {
        if (isBase64(updateData.ProductSpecification)) {
          if (
            !updateData.ProductSpecification.startsWith("data:application/pdf")
          )
            return req.error(
              400,
              "ProductSpecification must be a valid base64 PDF data URL."
            );

          try {
            uploadedProductSpecificationUrl = await uploadImageToAzure(
              updateData.ProductSpecification.split(",")[1],
              updateData.ProductName
            );
          } catch (uploadError) {
            console.error(
              "Failed to upload product specification:",
              uploadError
            );
            return req.error(
              500,
              "Failed to upload product specification to storage."
            );
          }
        } else {
          uploadedProductSpecificationUrl = updateData.ProductSpecification; // Keep existing Blob URL
        }
        delete updateData.ProductSpecification;
      }

      // --- Construct Final Payload ---
      const now = new Date();
      const payload = {
        ...existingProduct,
        ...updateData,
        ProductImage: uploadedProductImageUrl,
        ProductSpecification: uploadedProductSpecificationUrl,
        ModifiedAt: now,
        ModifiedBy: req.user?.id || "system",
      };

      // --- Update Database ---
      const result = await CatalogItemsColl.updateOne(
        { ProductId: productId },
        { $set: payload }
      );

      if (result.modifiedCount > 0) {
        // --- Update category counts if changed ---
        if (
          updateData.CommodityCode &&
          updateData.CommodityCode !== existingProduct.CommodityCode
        ) {
          await Promise.all([
            updateCategoryProductCount(database, existingProduct.CommodityCode),
            updateCategoryProductCount(database, updateData.CommodityCode),
          ]);
        } else if (updateData.CommodityCode) {
          await updateCategoryProductCount(database, updateData.CommodityCode);
        }

        return { message: "Product updated successfully", ...payload };
      } else {
        req.error(500, "Failed to update Product Catalog Item.");
      }
    } catch (error) {
      console.error("Failed to update Product Catalog Item:", error);
      req.error(
        500,
        "Unexpected error occurred while updating Product Catalog Item."
      );
    }
  });

  srv.on("READ", "ProductCatalogCommodityCodes", async (req) => {
    try {
      const { database } = await getConnection();
      const CatalogCategoriesColl = database.collection(
        "ProductCatalogCommodityCodes"
      );
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await CatalogCategoriesColl.countDocuments(query);
        return { "@odata.count": count };
      }

      const hasContentFilters = Object.keys(query).length > 0;

      if (hasContentFilters) {
        // WITH FILTERS: Simple query without "All Categories"
        const categoriesData = await CatalogCategoriesColl.find(query)
          .sort(sortOrder)
          .skip(skip)
          .limit(limit)
          .toArray();

        categoriesData["$count"] = categoriesData.length;
        return categoriesData;
      } else {
        // NO FILTERS: Pipeline with "All Categories"
        const pipeline = buildPipeline([
          buildMatchStage(query),
          buildGroupStage({
            _id: null,
            totalNumberOfProducts: { $sum: "$NumberOfProducts" },
            filteredDocuments: { $push: "$$ROOT" },
          }),
          buildAddFieldsStage({
            combinedData: {
              $concatArrays: [
                [
                  {
                    Commodity: 0,
                    CommodityName: "All Commodities",
                    NumberOfProducts: "$totalNumberOfProducts",
                  },
                ],
                "$filteredDocuments",
              ],
            },
          }),
          { $unwind: "$combinedData" },
          { $replaceRoot: { newRoot: "$combinedData" } },
          buildSortStage(sortOrder),
          buildSkipStage(skip),
          buildLimitStage(limit),
          buildProjectStage(selectFields),
        ]);

        const categoriesData = await CatalogCategoriesColl.aggregate(
          pipeline
        ).toArray();
        categoriesData["$count"] = categoriesData.length;
        return categoriesData;
      }
    } catch (error) {
      console.error("Failed to fetch Catalog categories:", error);
      req.error(
        500,
        "Failed to retrieve Catalog categories. Please try again later."
      );
    }
  });

  srv.on("READ", "Currencies", async (req) => {
    try {
      const { database } = await getConnection();
      const CurrencyColl = database.collection("CURRENCY");
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );
      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await CurrencyColl.countDocuments();
        return { "@odata.count": count };
      }

      // Fetch the data
      const currencyData = await CurrencyColl.find(query, {
        projection: selectFields,
      })
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      currencyData["$count"] = currencyData.length;

      return currencyData;
    } catch (error) {
      console.error("Failed to fetch Product interactions:", error);
      req.error(
        500,
        "Failed to retrieve Product interactions. Please try again later."
      );
    }
  });

  srv.on("READ", "UnitsOfMeasure", async (req) => {
    try {
      const { database } = await getConnection();
      const UOMColl = database.collection("UNIT_OF_MEASURE");
      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );
      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await UOMColl.countDocuments();
        return { "@odata.count": count };
      }

      // Fetch the data
      const UOMData = await UOMColl.find(query, {
        projection: selectFields,
      })
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      UOMData["$count"] = UOMData.length;

      return UOMData;
    } catch (error) {
      console.error("Failed to fetch Product interactions:", error);
      req.error(
        500,
        "Failed to retrieve Product interactions. Please try again later."
      );
    }
  });

  srv.on("READ", "ProductCatalogDrafts", async (req) => {
    try {
      const { database } = await getConnection();
      const DraftsColl = database.collection("ProductCatalogDrafts");

      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await DraftsColl.countDocuments();
        return { "@odata.count": count };
      }

      // Fetch the data
      const draftsData = await DraftsColl.find(query, {
        projection: selectFields,
      })
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      // Convert SearchTerm string back to array for each draft
      draftsData.forEach((draft) => {
        if (draft.SearchTerm && typeof draft.SearchTerm === "string") {
          draft.SearchTerm = draft.SearchTerm.split(", ").filter(
            (term) => term.trim() !== ""
          );
        }
      });

      draftsData["$count"] = draftsData.length;
      return draftsData;
    } catch (error) {
      console.error("Failed to fetch Product Catalog Drafts:", error);
      req.error(
        500,
        "Failed to retrieve Product Catalog Drafts. Please try again later."
      );
    }
  });

  srv.on("CREATE", "ProductCatalogDrafts", async (req) => {
    try {
      const { database } = await getConnection();
      const DraftsColl = database.collection("ProductCatalogDrafts");

      const draftData = req.data;

      // Generate ID if not provided
      if (!draftData.ID) {
        draftData.ID = cds.utils.uuid();
      }

      // Generate BatchID ONLY if not provided
      // If BatchID is provided, use it (this means it's adding to existing batch)
      if (!draftData.BatchID) {
        draftData.BatchID = cds.utils.uuid();
      } else {
        // Validate that the provided BatchID exists (optional but recommended)
        const existingBatch = await DraftsColl.findOne({
          BatchID: draftData.BatchID,
        });

        if (!existingBatch) {
          // If you want to be strict, you can return an error
          return req.error(400, "Invalid BatchID provided");
        } else {
          console.log(`Adding to existing batch: ${draftData.BatchID}`);
        }
      }

      // Set default values
      const now = new Date();
      draftData.DraftStatus = "Draft";
      draftData.CreatedAt = now;
      draftData.UpdatedAt = now;

      // Convert SearchTerm array to string for MongoDB storage
      if (Array.isArray(draftData.SearchTerm)) {
        draftData.SearchTerm = draftData.SearchTerm.join(", ");
      }

      // --- Required field validation ---
      const requiredFields = [
        "ProductName",
        "CommodityCode",
        "Category",
        "UnitPrice",
        "CurrencyCode",
        "UnitOfMeasure",
        "LeadTimeDays",
        "AdditionalLink",
        "ProductDescription",
      ];

      for (const field of requiredFields) {
        if (
          draftData[field] === undefined ||
          draftData[field] === null ||
          draftData[field] === ""
        ) {
          return req.error(400, `${field} is required.`);
        }
      }

      // --- Type validation ---
      draftData.CommodityCode = parseInt(
        String(draftData.CommodityCode).trim()
      );

      draftData.UnitPrice = parseFloat(String(draftData.UnitPrice).trim());

      if (isNaN(draftData.UnitPrice) || draftData.UnitPrice <= 0) {
        return req.error(400, "UnitPrice must be a positive number.");
      }

      if (
        !Number.isInteger(draftData.LeadTimeDays) ||
        draftData.LeadTimeDays < 0
      ) {
        return req.error(400, "LeadTimeDays must be a valid positive integer.");
      }

      if (
        typeof draftData.CurrencyCode !== "string" ||
        draftData.CurrencyCode.length < 3
      ) {
        return req.error(
          400,
          "CurrencyCode must be a 3-letter ISO code (e.g., 'USD')."
        );
      }

      // --- Validate that Category exists in the category collection ---
      const commodityCodesExists = await database
        .collection("ProductCatalogCommodityCodes")
        .findOne({ Commodity: draftData.CommodityCode });

      const categoryExists = await database
        .collection("ProductCatalogCommodityCodes")
        .findOne({ CommodityName: draftData.Category });

      if (!commodityCodesExists) {
        return req.error(
          400,
          `Invalid Commodity Code: '${productData.CommodityCode}'.`
        );
      }

      if (!categoryExists) {
        return req.error(400, `Invalid Category: '${productData.Category}'.`);
      }

      // If you want to be very permissive
      if (draftData.AdditionalLink && draftData.AdditionalLink.trim() === "") {
        return req.error(400, "AdditionalLink cannot be empty");
      }

      // Optional: Add basic sanity check
      if (draftData.AdditionalLink && draftData.AdditionalLink.length < 3) {
        return req.error(400, "AdditionalLink appears to be invalid");
      }

      // --- Upload files to Azure if provided ---
      let uploadedProductImageUrl = null;
      if (
        draftData.ProductImage &&
        draftData.ProductImage.startsWith("data:")
      ) {
        try {
          uploadedProductImageUrl = await uploadImageToAzure(
            draftData.ProductImage.split(",")[1],
            draftData.ProductName
          );
          draftData.ProductImage = uploadedProductImageUrl;
        } catch (uploadError) {
          console.error("Failed to upload product image:", uploadError);
          return req.error(500, "Failed to upload product image to storage.");
        }
      }

      let uploadedProductSpecificationUrl = null;
      if (
        draftData.ProductSpecification &&
        draftData.ProductSpecification.startsWith("data:")
      ) {
        try {
          uploadedProductSpecificationUrl = await uploadImageToAzure(
            draftData.ProductSpecification.split(",")[1],
            draftData.ProductName
          );
          draftData.ProductSpecification = uploadedProductSpecificationUrl;
        } catch (uploadError) {
          console.error("Failed to upload product specification:", uploadError);
          return req.error(
            500,
            "Failed to upload product specification to storage."
          );
        }
      }

      // --- Insert into MongoDB ---
      const result = await DraftsColl.insertOne(draftData);
      if (result.insertedId) {
        // Convert SearchTerm back to array for response
        if (typeof draftData.SearchTerm === "string") {
          draftData.SearchTerm = draftData.SearchTerm.split(", ").filter(
            (term) => term.trim() !== ""
          );
        }
        return draftData;
      } else {
        req.error(500, "Failed to create Product Catalog Draft.");
      }
    } catch (error) {
      console.error("Failed to create Product Catalog Draft:", error);
      req.error(
        500,
        "Unexpected error occurred while creating Product Catalog Draft."
      );
    }
  });

  srv.on("UPDATE", "ProductCatalogDrafts", async (req) => {
    try {
      const { database } = await getConnection();
      const DraftsColl = database.collection("ProductCatalogDrafts");

      // For GUID keys, the parameter structure is different
      // Use req.params[0] directly as it contains the GUID
      const draftId = req.params[0];

      if (!draftId) {
        return req.error(400, "Draft ID is required");
      }

      const updateData = { ...req.data };

      // First, check if the draft exists
      const existingDraft = await DraftsColl.findOne({ ID: draftId });
      if (!existingDraft) {
        return req.error(404, "Draft not found");
      }

      // Set UpdatedAt timestamp
      updateData.UpdatedAt = new Date();

      // Convert SearchTerm array to string if provided
      if (updateData.SearchTerm && Array.isArray(updateData.SearchTerm)) {
        updateData.SearchTerm = updateData.SearchTerm.join(", ");
      }

      // Handle file uploads if images/files are updated
      if (
        updateData.ProductImage &&
        updateData.ProductImage.startsWith("data:")
      ) {
        try {
          const uploadedImageUrl = await uploadImageToAzure(
            updateData.ProductImage.split(",")[1],
            updateData.ProductName || "product"
          );
          updateData.ProductImage = uploadedImageUrl;
        } catch (uploadError) {
          console.error("Failed to upload product image:", uploadError);
          return req.error(500, "Failed to upload product image to storage.");
        }
      }

      if (
        updateData.ProductSpecification &&
        updateData.ProductSpecification.startsWith("data:")
      ) {
        try {
          const uploadedPdfUrl = await uploadImageToAzure(
            updateData.ProductSpecification.split(",")[1],
            updateData.ProductName || "specification"
          );
          updateData.ProductSpecification = uploadedPdfUrl;
        } catch (uploadError) {
          console.error("Failed to upload product specification:", uploadError);
          return req.error(
            500,
            "Failed to upload product specification to storage."
          );
        }
      }

      // Perform the update
      const result = await DraftsColl.updateOne(
        { ID: draftId },
        { $set: updateData }
      );

      if (result.modifiedCount === 0) {
        console.log("No documents were modified");
        // This could happen if the data is the same, so we still return the current document
      }

      // Return the updated document
      const updatedDraft = await DraftsColl.findOne({ ID: draftId });

      // Convert SearchTerm back to array for response
      if (
        updatedDraft.SearchTerm &&
        typeof updatedDraft.SearchTerm === "string"
      ) {
        updatedDraft.SearchTerm = updatedDraft.SearchTerm.split(", ").filter(
          (term) => term.trim() !== ""
        );
      }
      return updatedDraft;
    } catch (error) {
      console.error("Failed to update Product Catalog Draft:", error);
      req.error(
        500,
        "Unexpected error occurred while updating Product Catalog Draft."
      );
    }
  });

  srv.on("DELETE", "ProductCatalogDrafts", async (req) => {
    try {
      const { database } = await getConnection();
      const DraftsColl = database.collection("ProductCatalogDrafts");

      const draftId = req.params[0];

      // Use findOneAndDelete to both find and delete in one operation
      const result = await DraftsColl.findOneAndDelete({ ID: draftId });

      if (!result.length === 0) {
        return req.error(404, "Draft not found");
      }

      return {
        message: "Draft deleted successfully",
        deletedDraft: result,
      };
    } catch (error) {
      console.error("Failed to delete Product Catalog Draft:", error);
      req.error(
        500,
        "Unexpected error occurred while deleting Product Catalog Draft." +
          error
      );
    }
  });

  srv.on("submitBatch", async (req) => {
    const { BatchID } = req.data;

    // Validate input
    if (!BatchID) {
      return req.error(400, "BatchID is required");
    }

    try {
      const { database } = await getConnection();
      const DraftsColl = database.collection("ProductCatalogDrafts");
      const CatalogItemsColl = database.collection("ProductCatalogItems");
      const CommodityCodesColl = database.collection(
        "ProductCatalogCommodityCodes"
      );

      // Get all drafts in this batch
      const batchDrafts = await DraftsColl.find({ BatchID }).toArray();

      if (batchDrafts.length === 0) {
        return req.error(404, `No drafts found for batch ${BatchID}`);
      }

      const results = {
        total: batchDrafts.length,
        successful: 0,
        failed: 0,
        details: {
          successful: [],
          failed: [],
        },
      };

      // Process each draft
      for (const draft of batchDrafts) {
        try {
          // Enhanced validation
          const validationErrors = validateDraftForSubmission(draft);

          if (validationErrors.length > 0) {
            results.details.failed.push({
              productName: draft.ProductName || "Unknown Product",
              errors: validationErrors,
            });
            results.failed++;
            continue;
          }

          // Validate commodity code exists
          const commodityExists = await CommodityCodesColl.findOne({
            Commodity: parseInt(draft.CommodityCode),
          });

          if (!commodityExists) {
            results.details.failed.push({
              productName: draft.ProductName,
              errors: [`Invalid Commodity Code: ${draft.CommodityCode}`],
            });
            results.failed++;
            continue;
          }

          // Process search terms
          let searchTerms = draft.SearchTerm;
          if (typeof searchTerms === "string") {
            searchTerms = searchTerms
              .split(",")
              .map((term) => term.trim())
              .filter((term) => term !== "");
          } else if (!Array.isArray(searchTerms)) {
            searchTerms = [];
          }

          // Create production record
          const productionItem = {
            ProductId: cds.utils.uuid(),
            ProductName: draft.ProductName,
            CommodityCode: parseInt(draft.CommodityCode),
            Category: draft.Category,
            SearchTerm: searchTerms,
            UnitPrice: parseFloat(draft.UnitPrice),
            CurrencyCode: draft.CurrencyCode,
            UnitOfMeasure: draft.UnitOfMeasure,
            LeadTimeDays: parseInt(draft.LeadTimeDays),
            PartNumber: draft.PartNumber || "",
            AdditionalLink: draft.AdditionalLink,
            ProductDescription: draft.ProductDescription,
            ProductImage: draft.ProductImage,
            ProductSpecification: draft.ProductSpecification,
            Status: "Active",
            CreatedAt: new Date(),
            ModifiedAt: new Date(),
            CreatedBy: req.user?.id || "system",
            ModifiedBy: req.user?.id || "system",
            SourceBatch: BatchID,
          };

          // Insert into production collection
          await CatalogItemsColl.insertOne(productionItem);

          // Update category count
          await updateCategoryProductCount(database, draft.CommodityCode);

          // Delete the draft after successful submission
          await DraftsColl.deleteOne({ ID: draft.ID });

          results.details.successful.push({
            productName: draft.ProductName,
            productId: productionItem.ProductId,
          });
          results.successful++;
        } catch (error) {
          console.error(`Failed to process draft ${draft.ID}:`, error);
          results.details.failed.push({
            productName: draft.ProductName || "Unknown Product",
            errors: [error.message || "Unknown error occurred"],
          });
          results.failed++;
        }
      }

      // Return the results in the expected format
      return {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        details: results.details,
      };
    } catch (error) {
      console.error("Failed to submit batch:", error);
      return req.error(500, `Failed to submit batch: ${error.message}`);
    }
  });
};
