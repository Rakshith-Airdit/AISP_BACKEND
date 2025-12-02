const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");
const { buildQuery } = require("./Library/Mongoquery");
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

const axios = require("axios");

// Configuration
const API_CONFIG = {
  baseURL:
    "https://airdit-software-services-private-limite-airdit-190920232a7ee4d6.cfapps.ap10.hana.ondemand.com",
  auth: {
    username: "AIRDIT",
    password: "Airdit@123",
  },
  timeout: 30000,
};

// Common headers
const getHeaders = () => ({
  Authorization: `Basic ${Buffer.from(
    `${API_CONFIG.auth.username}:${API_CONFIG.auth.password}`
  ).toString("base64")}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

// Common error handler
const handleApiError = (error, operation) => {
  if (error.response) {
    throw new Error(
      `${operation} failed: ${error.response.status} - ${error.response.statusText}`
    );
  } else if (error.request) {
    throw new Error(`${operation} failed: No response received from server`);
  } else {
    throw new Error(`${operation} failed: ${error.message}`);
  }
};

// Get Event ID
async function getEventID(eventName) {
  try {
    const url = `${API_CONFIG.baseURL}/v2/odata/v4/notification/Events`;
    const params = {
      $filter: `event_name eq '${eventName}'`,
    };

    const response = await axios.get(url, {
      headers: getHeaders(),
      params: params,
      timeout: API_CONFIG.timeout,
    });

    console.log("Event ID Response:", response.data);
    return response?.data?.d?.results[0];
  } catch (error) {
    handleApiError(error, `Get Event ID for "${eventName}"`);
  }
}

// Call Mail Trigger API
async function callMailTriggerAPI(payload) {
  try {
    const url = `${API_CONFIG.baseURL}/trigger`;

    const response = await axios.post(url, payload, {
      headers: getHeaders(),
      timeout: API_CONFIG.timeout,
    });

    console.log("Mail Trigger Response:", response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Mail Trigger");
  }
}

function generateProductRowsHTML(products) {
  let html = '';
  const currency = products[0]?.CurrencyCode || 'USD';

  products.forEach(product => {
    const quantity = product.quantity || 1;
    const totalPrice = product.totalPrice || (product.UnitPrice * quantity);

    html += `
    <tr>
      <td>${product.ProductName || ''}</td>
      <td>${product.ProductDescription || ''}</td>
      <td>${product.PartNo || ''}</td>
      <td>${product.CommodityCode || ''}</td>
      <td>${product.UnitOfMeasure || ''}</td>
      <td>${product.UnitPrice || '0.00'} ${product.CurrencyCode || currency}</td>
      <td>${quantity}</td>
      <td>${totalPrice} ${product.CurrencyCode || currency}</td>
    </tr>`;
  });

  return html;
}

function calculateTotals(products) {
  let totalItems = 0;
  let grandTotal = 0;
  const currency = products[0]?.CurrencyCode || 'USD';

  products.forEach(product => {
    try {
      // Safely convert to numbers
      const quantity = Math.max(0, Number(product.quantity) || 1);
      const unitPrice = Math.max(0, Number(product.UnitPrice) || 0);
      const totalPrice = Number(product.totalPrice) || (unitPrice * quantity);

      totalItems += quantity;
      grandTotal += totalPrice;
    } catch (error) {
      console.warn('Error calculating product totals:', error, product);
    }
  });

  // Round to 2 decimal places to avoid floating point issues
  grandTotal = Math.round(grandTotal * 100) / 100;

  return {
    totalProducts: products.length,
    totalItems: totalItems,
    grandTotal: grandTotal,
    currency: currency
  };
}

module.exports = async (srv) => {
  const { ProductCatalogItems, BuyerFavorites } = srv.entities;

  const { database } = await getConnection();
  const productsCollection = database.collection("ProductCatalogItems");
  const favoritesCollection = database.collection("BuyerFavorites");

  srv.on("READ", "ProductCatalogItems", async (req) => {
    try {
      const buyerId =
        //   req.user?.id ||
        "100000";

      if (!buyerId || buyerId === "privileged") {
        req.error(
          400,
          "Buyer ID is required for reading Product Catalog Items."
        );
      }

      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await productsCollection.countDocuments();
        return { "@odata.count": count };
      }

      // Build aggregation pipeline
      const pipeline = buildPipeline([
        buildMatchStage(query),

        buildLookupStage(
          "BuyerFavorites",
          "ProductId",
          "FavProductId",
          "userFavorites"
        ),

        buildAddFieldsStage({
          isFavorite: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$userFavorites",
                    as: "fav",
                    cond: {
                      $and: [
                        { $eq: ["$$fav.BuyerId", buyerId] },
                        { $eq: ["$$fav.FavProductId", "$ProductId"] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        }),

        buildProjectStage({
          userFavorites: 0,
        }),

        buildSortStage(sortOrder),

        buildSkipStage(skip),
        buildLimitStage(limit),
      ]);

      // Execute aggregation
      const productsWithFavorites = await productsCollection
        .aggregate(pipeline)
        .toArray();
      productsWithFavorites["$count"] = productsWithFavorites.length;

      return productsWithFavorites;
    } catch (error) {
      console.error("Failed to read Product Catalog Items:", error);
      req.error(
        500,
        "Unexpected error occurred while reading Product Catalog Items."
      );
    }
  });

  // Auto-filter BuyerFavorites by current user
  srv.on("READ", "BuyerFavorites", async (req) => {
    try {
      const buyerId = "100000";

      if (!buyerId) {
        return req.error(401, "Authentication required");
      }

      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(
        req
      );

      // Check if Product is being expanded
      const shouldExpandProduct = req.query?.SELECT?.columns?.some(
        (col) => col.ref && col.ref[0] === "Product"
      );

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        const count = await favoritesCollection.countDocuments({
          BuyerId: buyerId,
        });
        return { "@odata.count": count };
      }

      let pipeline;

      if (shouldExpandProduct) {
        // Client requested $expand=Product - resolve the association
        pipeline = buildPipeline([
          buildMatchStage({ ...query, BuyerId: buyerId }),

          // Lookup product details only when expanded
          buildLookupStage(
            "ProductCatalogItems",
            "FavProductId",
            "ProductId",
            "_productData"
          ),

          // Extract product from array
          buildAddFieldsStage({
            Product: {
              $cond: {
                if: { $gt: [{ $size: "$_productData" }, 0] },
                then: { $arrayElemAt: ["$_productData", 0] },
                else: null,
              },
            },
          }),

          // Remove temporary field
          buildProjectStage({
            _productData: 0,
          }),

          buildSortStage(sortOrder),
          buildSkipStage(skip),
          buildLimitStage(limit),
        ]);
      } else {
        // No expansion - just return the base entity
        pipeline = buildPipeline([
          buildMatchStage({ ...query, BuyerId: buyerId }),
          buildSortStage(sortOrder),
          buildSkipStage(skip),
          buildLimitStage(limit),
        ]);
      }

      const result = await favoritesCollection.aggregate(pipeline).toArray();
      result["$count"] = result.length;

      return result;
    } catch (error) {
      console.error("Failed to read Buyer Favorites:", error);
      req.error(
        500,
        "Unexpected error occurred while reading Buyer Favorites."
      );
    }
  });

  // Toggle favorite action
  srv.on("toggleFavorite", async (req) => {
    const { productId } = req.data;
    const buyerId = "100000";
    // req.user?.id;

    if (!buyerId) {
      return req.error(401, "Authentication required");
    }

    const existingFavorite = await favoritesCollection.findOne({
      BuyerId: buyerId,
      FavProductId: productId,
    });

    if (existingFavorite) {
      await favoritesCollection.deleteOne({
        BuyerId: buyerId,
        FavProductId: productId,
      });
      return {
        success: true,
        isFavorite: false,
        message: "Product removed from favorites",
      };
    } else {
      const favoriteId = require("uuid").v4();
      await favoritesCollection.insertOne({
        FavoriteId: favoriteId,
        BuyerId: buyerId,
        FavProductId: productId,
        CreatedAt: new Date(),
        ModifiedAt: new Date(),
      });
      return {
        success: true,
        isFavorite: true,
        message: "Product added to favorites",
      };
    }
  });

  // srv.on("triggerProductRequestEmail", async (req) => {
  //   const {
  //     receiver,
  //     SupplierName,
  //     BuyerCompanyName,
  //     ProductName,
  //     ProductDescription,
  //     UnitOfMeasure,
  //     UnitPrice,
  //     PartNo,
  //     CommodityCode,
  //     BuyerName,
  //     BuyerContactInfo,
  //     BuyerEmailAddress,
  //   } = req.data;

  //   try {
  //     const requiredFields = [
  //       "receiver",
  //       "SupplierName",
  //       "BuyerCompanyName",
  //       "ProductName",
  //       "ProductDescription",
  //       "UnitOfMeasure",
  //       "UnitPrice",
  //       "BuyerName",
  //       "BuyerContactInfo",
  //       "BuyerEmailAddress",
  //     ];

  //     const requestData = req.data;

  //     const missingFields = requiredFields.filter(
  //       (field) => !requestData[field]
  //     );

  //     if (missingFields.length > 0) {
  //       throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  //     }

  //     // Email validation
  //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  //     if (!emailRegex.test(receiver)) {
  //       // ✅ FIX: Use destructured variable
  //       throw new Error("Invalid receiver email format");
  //     }

  //     if (!emailRegex.test(BuyerEmailAddress)) {
  //       // ✅ FIX: Use destructured variable
  //       throw new Error("Invalid buyer email format");
  //     }

  //     // Price validation
  //     if (UnitPrice <= 0) {
  //       // ✅ FIX: Use destructured variable
  //       throw new Error("Unit price must be greater than 0");
  //     }

  //     // String length validations
  //     if (ProductName.length > 100) {
  //       // ✅ FIX: Use destructured variable
  //       throw new Error("Product name must be less than 100 characters");
  //     }

  //     if (ProductDescription.length > 500) {
  //       // ✅ FIX: Use destructured variable
  //       throw new Error("Product description must be less than 500 characters");
  //     }

  //     // ✅ FIX: Await the async function and extract the event ID
  //     const eventData = await getEventID("Product Request");
  //     const eventId = eventData?._id;

  //     const payload = {
  //       event_id: eventId,
  //       payload: {
  //         receiver: receiver,
  //         "Supplier Name": SupplierName,
  //         "Buyer Company Name": BuyerCompanyName,
  //         "Product Name": ProductName,
  //         "Product Description": ProductDescription,
  //         "Unit of Measure": UnitOfMeasure,
  //         "Unit Price": UnitPrice,
  //         "Part No": PartNo,
  //         "Commodity Code": CommodityCode,
  //         "Buyer Name": BuyerName,
  //         "Buyer Contact Information": BuyerContactInfo,
  //         "Buyer E-mail Address": BuyerEmailAddress,
  //       },
  //     };

  //     console.log("Sending payload:", payload);

  //     // ✅ FIX: callMailTriggerAPI should return the data directly
  //     const apiResponse = await callMailTriggerAPI(payload);

  //     console.log("API Response:", apiResponse);

  //     return {
  //       message: "Product request email triggered successfully",
  //       queue_id: apiResponse?.queue_id || eventId, // ✅ FIX: Remove .data
  //       event: apiResponse?.event || "EMAIL_QUEUED", // ✅ FIX: Remove .data
  //     };
  //   } catch (error) {
  //     console.error("Error in triggerProductRequestEmail:", error.message);

  //     req.error(500, {
  //       message: error.message,
  //     });
  //   }
  // });

  srv.on("triggerProductRequestEmail", async (req) => {
    const {
      receiver,
      SupplierName,
      BuyerCompanyName,
      BuyerName,
      BuyerContactInfo,
      BuyerEmailAddress,
      Products
    } = req.data;

    try {
      const requiredFields = [
        "receiver",
        "SupplierName",
        "BuyerCompanyName",
        "BuyerName",
        "BuyerContactInfo",
        "BuyerEmailAddress",
        "Products"
      ];

      const requestData = req.data;

      const missingFields = requiredFields.filter(
        (field) => !requestData[field]
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Validate products array
      if (!Array.isArray(Products) || Products.length === 0) {
        throw new Error("Products array is required and cannot be empty");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(receiver)) {
        throw new Error("Invalid receiver email format");
      }

      if (!emailRegex.test(BuyerEmailAddress)) {
        throw new Error("Invalid buyer email format");
      }

      // Validate each product
      Products.forEach((product, index) => {
        if (!product.ProductName) {
          throw new Error(`Product ${index + 1} is missing ProductName`);
        }
        if (!product.UnitPrice || product.UnitPrice <= 0) {
          throw new Error(`Product ${index + 1} must have a valid UnitPrice greater than 0`);
        }
      });

      const eventData = await getEventID("Product Request");
      const eventId = eventData?._id;

      const productRows = generateProductRowsHTML(Products);

      const totals = calculateTotals(Products);

      const payload = {
        event_id: "6926d2ecf64850bc593d94aa",
        payload: {
          receiver: receiver,
          "Supplier Name": SupplierName,
          "Buyer Company Name": BuyerCompanyName,
          "Buyer Name": BuyerName,
          "Buyer Contact Information": BuyerContactInfo,
          "Buyer E-mail Address": BuyerEmailAddress,
          "productRows": productRows,
          "totalProducts": totals.totalProducts,
          "totalItems": totals.totalItems,
          "grandTotal": totals.grandTotal,
          "currency": totals.currency,
        },
      };

      console.log("Sending payload:", payload);

      const apiResponse = await callMailTriggerAPI(payload);

      console.log("API Response:", apiResponse);

      return {
        message: "Product request email triggered successfully",
        queue_id: apiResponse?.queue_id || eventId,
        event: apiResponse?.event || "EMAIL_QUEUED",
      };
    } catch (error) {
      console.error("Error in triggerProductRequestEmail:", error.message);

      req.error(500, {
        message: error.message,
      });
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

      const categoriesData = await CatalogCategoriesColl.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .toArray();

      categoriesData["$count"] = categoriesData.length;
      return categoriesData;
    } catch (error) {
      console.error("Failed to fetch Catalog categories:", error);
      req.error(
        500,
        "Failed to retrieve Catalog categories. Please try again later."
      );
    }
  });

  srv.on("READ", "DistinctProductNames", async (req) => {
    try {
      const { database } = await getConnection();
      const productsCollection = database.collection("ProductCatalogItems");

      const { query, sortOrder, selectFields, skip, limit } = await buildQuery(req);

      // Handle $count
      if (req._queryOptions?.$count === "true") {
        // Count distinct ProductNames using pipeline
        const countPipeline = buildPipeline([
          buildMatchStage(query),
          { $match: { ProductName: { $ne: null, $ne: "" } } },
          { $group: { _id: "$ProductName" } },
          { $count: "total" }
        ]);

        const countResult = await productsCollection.aggregate(countPipeline).toArray();
        return { "@odata.count": countResult[0]?.total || 0 };
      }

      // Build pipeline with your helper functions
      const pipeline = buildPipeline([
        buildMatchStage(query),

        // Filter out null/empty ProductNames
        { $match: { ProductName: { $ne: null, $ne: "" } } },

        // Group by ProductName only, get first ProductId
        buildGroupStage({
          _id: "$ProductName",
          ProductId: { $first: "$ProductId" }
        }),

        // Project to final format
        buildProjectStage({
          _id: 0,
          ProductName: "$_id",
          ProductId: 1
        }),

        // Sort alphabetically
        buildSortStage(sortOrder),
        buildSkipStage(skip),
        buildLimitStage(limit)
      ]);

      const rows = await productsCollection.aggregate(pipeline).toArray();
      return rows;

    } catch (error) {
      console.error("DistinctProductNames error:", error);
      req.error(500, "Error fetching distinct product names");
    }
  });

}