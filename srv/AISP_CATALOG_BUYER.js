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
};
