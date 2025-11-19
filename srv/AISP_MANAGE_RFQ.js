const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");
const cron = require("node-cron");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { mongoRead } = require("./Library/helper");
const {
  createRFQInS4,
  AwardSupplierAgainstRFQ,
} = require("./Library/RFQConfirmation");

module.exports = cds.service.impl(async function (srv) {
  // Using CDS API
  const ZC_AISP_VALUEHELP_BND = await cds.connect.to("ZC_AISP_VALUEHELP_BND");

  // srv.on('READ', 'SAP__Currencies', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'SAP__UnitsOfMeasure', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_COMPANYCODE_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_CURRENCY_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_MATERIALDETAILS_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_INCOTERMS_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_MATERIALGROUP_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_PAYMENTTERMS_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_PLANT_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_PURCHASEGROUP_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_PURCHASEORG_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));
  // srv.on('READ', 'ZC_AISP_VENDORDETAILS_VH', req => ZC_AISP_VALUEHELP_BND.run(req.query));

  // === READ RFQ Headers ===
  srv.on("READ", "RFQHeaders", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("ZC_AISP_RFQ_WORK_HDR");
    const hdrCollection = database.collection("ZC_AISP_RFQ_HDR");

    try {
      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      // SIMPLE FIX: Convert RfqNumber to _id in the filter
      if (filter && typeof filter === "object") {
        const convertFilter = (obj) => {
          if (Array.isArray(obj)) {
            return obj.map((item) => convertFilter(item));
          }
          if (obj && typeof obj === "object") {
            const newObj = {};
            for (const [key, value] of Object.entries(obj)) {
              if (key === "RfqNumber") {
                newObj._id = convertFilter(value);
              } else {
                newObj[key] = convertFilter(value);
              }
            }
            return newObj;
          }
          return obj;
        };

        filter = convertFilter(filter);
      }

      const now = new Date();
      const aggregationPipeline = [
        {
          $group: {
            _id: "$RfqNumber",
            EventStartDate: { $first: "$Published_d" },
            EventEndDate: { $first: "$Deadline_dt" },
            CreatedBy: { $first: "$CreatedBy" },
            TargetValue: { $first: "$TargetValue" },
            ReceivedQuotations: {
              $sum: {
                $cond: [{ $in: ["$Status", ["Submitted", "Awarded"]] }, 1, 0],
              },
            },
            hasAwardedQuotation: {
              $max: {
                $cond: [{ $eq: ["$Status", "Awarded"] }, true, false],
              },
            },
          },
        },
        {
          $addFields: {
            Status: {
              $cond: {
                if: { $eq: ["$EventEndDate", null] },
                then: "No Deadline",
                else: {
                  $cond: {
                    if: { $gt: [{ $toDate: "$EventEndDate" }, now] },
                    then: "Open",
                    else: {
                      $cond: {
                        if: "$hasAwardedQuotation",
                        then: "Completed",
                        else: "Action needed",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        // Now the filter will use _id instead of RfqNumber
        { $match: filter },
        // Also convert sort field if needed
        {
          $sort:
            sort && Object.keys(sort).length ? sort : { EventStartDate: -1 }, // -1 = descending (latest first)
        },
        { $skip: skip },
        { $limit: limit },
      ];

      // Add projection stage
      if (select && Object.keys(select).length > 0) {
        const projection = { _id: 0 };
        Object.keys(select).forEach((field) => {
          if (field === "RfqNumber") {
            projection.RfqNumber = "$_id";
          } else {
            projection[field] = 1;
          }
        });
        aggregationPipeline.push({ $project: projection });
      } else {
        aggregationPipeline.push({
          $project: {
            RfqNumber: "$_id",
            EventStartDate: 1,
            EventEndDate: 1,
            CreatedBy: 1,
            TargetValue: 1,
            ReceivedQuotations: 1,
            hasAwardedQuotation: 1,
            Status: 1,
            _id: 0,
          },
        });
      }

      let data = await collection.aggregate(aggregationPipeline).toArray();

      if (!data || data.length === 0) {
        return req.error({
          code: 404,
          message: `No data found!!`,
        });
      }

      return data;
    } catch (error) {
      console.error("Error in RFQHeaders READ:", error);
      throw error;
    }
  });

  srv.on("READ", "RFQItems", async (req) => {
    const { database } = await getConnection();
    const itemCol = database.collection("ZC_AISP_RFQ_WORK_ITEM");
    const hdrCol = database.collection("ZC_AISP_RFQ_WORK_HDR");
    const responseCol = database.collection("RFQ_QUESTION_RESPONSES");

    // Build the MongoDB query from the CAP request
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);

    // Step 1: Filter by RfqNumber (required filter)
    if (!filter.RfqNumber) {
      return req.error(400, "RfqNumber filter is required to fetch items");
    }

    const rfqNumber = filter.RfqNumber;

    // Remove RfqNumber from filter since we'll handle it separately
    const { RfqNumber: rfqFilter, ...otherFilters } = filter;

    try {
      const aggregationPipeline = [
        // Step 1: Match items by RfqNumber (static filter)
        { $match: { RfqNumber: rfqNumber } },

        // Step 2: Lookup header information to get SupplierQuotation
        {
          $lookup: {
            from: "ZC_AISP_RFQ_WORK_HDR",
            let: { rfqNum: "$RfqNumber", bidder: "$Bidder" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$RfqNumber", "$$rfqNum"] },
                      { $eq: ["$Bidder", "$$bidder"] },
                    ],
                  },
                },
              },
            ],
            as: "headerInfo",
          },
        },
        {
          $addFields: {
            SupplierQuotation: {
              $arrayElemAt: ["$headerInfo.SupplierQuotation", 0],
            },
          },
        },

        // Step 3: Calculate total Netwr by Bidder (QuotationValue)
        {
          $group: {
            _id: { RfqNumber: "$RfqNumber", Bidder: "$Bidder" },
            items: { $push: "$$ROOT" },
            QuotationValue: { $sum: "$Netwr" },
          },
        },

        // Step 4: Lookup response scores
        {
          $lookup: {
            from: "RFQ_QUESTION_RESPONSES",
            let: { rfqNum: "$_id.RfqNumber", bidder: "$_id.Bidder" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$RfqNumber", "$$rfqNum"] },
                      { $eq: ["$Bidder", "$$bidder"] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  TOTAL_SCORE: { $max: "$TOTAL_SCORE" },
                },
              },
            ],
            as: "scoreInfo",
          },
        },
        {
          $addFields: {
            TOTAL_SCORE: {
              $ifNull: [{ $arrayElemAt: ["$scoreInfo.TOTAL_SCORE", 0] }, 0],
            },
          },
        },

        // Step 5: Unwind the items array to get back to individual items
        { $unwind: "$items" },

        // Step 6: Merge the calculated fields back into each item
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                "$items",
                {
                  QuotationValue: "$QuotationValue",
                  TOTAL_SCORE: "$TOTAL_SCORE",
                },
              ],
            },
          },
        },

        // Step 7: Apply dynamic filtering on calculated fields (TOTAL_SCORE, QuotationValue, etc.)
        { $match: otherFilters },

        // Step 8: Apply sorting if specified
        { $sort: sort || { Bidder: 1 } },

        // Step 9: Apply pagination
        { $skip: skip },
        { $limit: limit },
      ];

      // Execute the aggregation pipeline
      const items = await itemCol.aggregate(aggregationPipeline).toArray();

      // Handle empty result
      if (!items || items.length === 0) {
        return req.error(404, "No items found for the specified filters");
      }

      return items;
    } catch (error) {
      console.error("Error in RFQItems READ:", error);
      throw error;
    }
  });

  srv.on("READ", "ZC_AISP_CURRENCY_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const currenciesCol = database.collection("ZC_AISP_CURRENCY_VH");

      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await currenciesCol.countDocuments(filter);
        return { "@odata.count": count };
      }

      let currenciesData = currenciesCol.find(filter);
      if (select) currenciesData.project(select);
      if (sort) currenciesData.sort(sort);
      if (skip) currenciesData.skip(skip);
      if (limit) currenciesData.limit(limit);

      // Data for this page
      currenciesData = await currenciesData.toArray();

      const response = {};

      response["$count"] = currenciesData.length;
      response["results"] = currenciesData;

      return currenciesData;
    } catch (error) {
      console.error("error in fetching Currencies:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Currencies");
    }
  });

  // Company Code handler
  srv.on("READ", "ZC_AISP_COMPANYCODE_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("ZC_AISP_COMPANYCODE_VH");
      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);

      data = await data.toArray();

      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Company Codes:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Company Codes");
    }
  });

  // Material Details handler
  srv.on("READ", "ZC_AISP_MATERIALDETAILS_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("MATERIALS");

      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);

      data = await data.toArray();

      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Material Details:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Material Details");
    }
  });

  // Incoterms handler
  srv.on("READ", "ZC_AISP_INCOTERMS_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("INCOTERMS");
      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);

      data = await data.toArray();

      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Incoterms:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Incoterms");
    }
  });

  // Material Group handler
  srv.on("READ", "ZC_AISP_MATERIALGROUP_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("ZC_AISP_MATERIALGROUP_VH");
      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);
      data = await data.toArray();

      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Material Groups:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Material Groups");
    }
  });

  // Payment Terms handler
  srv.on("READ", "ZC_AISP_PAYMENTTERMS_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("PAYMENTTERMS");
      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);

      data = data.toArray();

      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Payment Terms:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Payment Terms");
    }
  });

  // Plant handler
  srv.on("READ", "ZC_AISP_PLANT_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("PLANTS");

      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);

      data = await data.toArray();

      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Plants:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Plants");
    }
  });

  // Purchase Group handler
  srv.on("READ", "ZC_AISP_PURCHASEGROUP_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("PURCHASEGROUPS");
      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = await collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);

      data = await data.toArray();

      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Purchase Groups:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Purchase Groups");
    }
  });

  // Purchase Organization handler
  srv.on("READ", "ZC_AISP_PURCHASEORG_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("PURCHASEORGS");
      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);
      data = await data.toArray();
      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Purchase Organizations:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Purchase Organizations");
    }
  });

  // Vendor Details handler
  srv.on("READ", "ZC_AISP_VENDORDETAILS_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const collection = database.collection("VENDORS");
      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await collection.countDocuments(filter);
        return { "@odata.count": count };
      }

      let data = collection.find(filter);
      if (select) data.project(select);
      if (sort) data.sort(sort);
      if (skip) data.skip(skip);
      if (limit) data.limit(limit);
      data = await data.toArray();

      const response = {
        $count: data.length,
        results: data,
      };

      return data;
    } catch (error) {
      console.error("Error in fetching Vendor Details:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Vendor Details");
    }
  });

  srv.on("READ", "Currencies_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const currenciesCol = database.collection("CURRENCY");

      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await currenciesCol.countDocuments(filter);
        return { "@odata.count": count };
      }

      let currenciesData = currenciesCol.find(filter);
      if (select) currenciesData.project(select);
      if (sort) currenciesData.sort(sort);
      if (skip) currenciesData.skip(skip);
      if (limit) currenciesData.limit(limit);

      currenciesData = await currenciesData.toArray();

      const response = {};

      response["$count"] = currenciesData.length;
      response["results"] = currenciesData;
      return currenciesData;
    } catch (error) {
      console.error("error in fetching Currencies:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Currencies");
    }
  });

  srv.on("READ", "CompanyCodes_VH", async (req) => {
    const { database } = await getConnection();

    try {
      const CompanyCodesCol = database.collection("COMPANY_CODE");

      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await CompanyCodesCol.countDocuments(filter);
        return { "@odata.count": count };
      }

      let companyCodesData = CompanyCodesCol.find(filter);
      if (select) companyCodesData.project(select);
      if (sort) companyCodesData.sort(sort);
      if (skip) companyCodesData.skip(skip);
      if (limit) companyCodesData.limit(limit);
      companyCodesData = await companyCodesData.toArray();

      const response = {};

      response["$count"] = companyCodesData.length;
      response["results"] = companyCodesData;
      return companyCodesData;
    } catch (error) {
      console.error("error in fetching Currencies:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Currencies");
    }
  });

  // Service Handler Code
  srv.on("READ", "Status_VH", async (req) => {
    const { database } = await getConnection();
    // Assuming the data source for statuses is the same collection as RFQHeaders' base
    const collection = database.collection("ZC_AISP_RFQ_WORK_HDR");

    try {
      const now = new Date();

      const aggregationPipeline = [
        // 1. Group by RfqNumber to consolidate the RFQ data (same as in RFQHeaders READ)
        {
          $group: {
            _id: "$RfqNumber",
            EventEndDate: { $first: "$Deadline_dt" },
            hasAwardedQuotation: {
              $max: {
                $cond: [{ $eq: ["$Status", "Awarded"] }, true, false],
              },
            },
          },
        },
        // 2. Calculate the dynamic 'Status' field (same logic as in RFQHeaders READ)
        {
          $addFields: {
            Status: {
              $cond: {
                if: { $eq: ["$EventEndDate", null] },
                then: "No Deadline",
                else: {
                  $cond: {
                    if: { $gt: [{ $toDate: "$EventEndDate" }, now] },
                    then: "Open",
                    else: {
                      $cond: {
                        if: "$hasAwardedQuotation",
                        then: "Completed",
                        else: "Action needed",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        // 3. CRITICAL: Group by the calculated 'Status' to get distinct values
        {
          $group: {
            _id: "$Status", // Group by the calculated Status
          },
        },
        // 4. Project the result into the expected Value Help format
        {
          $project: {
            _id: 0, // Exclude MongoDB internal _id
            StatusKey: "$_id", // The unique status value
            StatusText: "$_id", // Use the status value as the display text
          },
        },
        // 5. Sort the results (optional)
        { $sort: { StatusKey: 1 } },
      ];

      const distinctStatuses = await collection
        .aggregate(aggregationPipeline)
        .toArray();

      // The result is an array of objects like:
      // [{ StatusKey: "Open", StatusText: "Open" }, { StatusKey: "Completed", StatusText: "Completed" }, ...]

      // Return the distinct status list to the CAP runtime
      return distinctStatuses;
    } catch (error) {
      console.error("error in fetching Status Value Help:", error);
      // You should return a meaningful error message
      return req.reject(500, "Failed to fetch Status Value Help");
    }
  });

  srv.on("READ", "SupplierStatusDistribution", async (req) => {
    // Build the MongoDB query from the CAP request
    let { filter, select, sort, skip, limit } = buildMongoQuery(req);

    let rfqNumber = filter.RfqNumber;

    if (!rfqNumber) {
      return req.reject(400, "RfqNumber is required for this query.");
    }

    const { database } = await getConnection();
    const workHdrCol = database.collection("ZC_AISP_RFQ_WORK_HDR");
    const rfqHdrCol = database.collection("ZC_AISP_RFQ_HDR");

    // Fetch all suppliers from both collections for the given RFQ
    const workHdrSuppliers = await workHdrCol
      .find({ RfqNumber: rfqNumber })
      .toArray();
    const rfqHdrSuppliers = await rfqHdrCol
      .find({ RfqNumber: rfqNumber })
      .toArray();

    // Create a map to hold the final, reconciled supplier data
    const mergedSuppliers = {};
    let deadlineDate = null;
    let publishedDate = null;

    // Populate from ZC_AISP_RFQ_HDR first (base data)
    rfqHdrSuppliers.forEach((s) => {
      mergedSuppliers[s.Bidder] = {
        Bidder: s.Bidder,
        VendorName: s.VendorName,
        VendorEmail: s.Email,
        VendorAccountGroup: s.VendorAccgrp,
        VendorAccountGroupName: s.VendorAccgrpName,
        Status: s.Status,
      };
      if (s.Deadline_dt) deadlineDate = new Date(s.Deadline_dt);
      if (s.Published_d) publishedDate = new Date(s.Published_d);
    });

    // Overlay with statuses from ZC_AISP_RFQ_WORK_HDR (priority source)
    workHdrSuppliers.forEach((s) => {
      if (mergedSuppliers[s.Bidder]) {
        mergedSuppliers[s.Bidder].Status = s.Status;
      } else {
        // Handle a case where a supplier exists in WORK but not RFQ_HDR (unlikely but good practice)
        mergedSuppliers[s.Bidder] = {
          Bidder: s.Bidder,
          VendorName: s.VendorName,
          VendorEmail: s.Email,
          VendorAccountGroup: s.VendorAccgrp,
          VendorAccountGroupName: s.VendorAccgrpName,
          Status: s.Status,
        };
      }
    });

    // Initialize status counters
    const statusCounts = {
      Accepted: 0,
      Not_Accepted: 0,
      Submitted: 0,
      Pending: 0,
    };

    const supplierDetails = Object.values(mergedSuppliers);

    // Map statuses and update counters
    supplierDetails.forEach((supplier) => {
      const currentStatus = supplier.Status;
      switch (currentStatus) {
        case "Accepted":
        case "Draft":
          supplier.Status = "Accepted";
          statusCounts.Accepted++;
          break;
        case "Submitted":
          supplier.Status = "Submitted";
          statusCounts.Submitted++;
          break;
        case "Not_Accepted":
        case "Rejected": // Assuming 'Rejected' maps to 'Not_Accepted'
          supplier.Status = "Not_Accepted";
          statusCounts.Not_Accepted++;
          break;
        case "Pending":
          supplier.Status = "Pending";
          statusCounts.Pending++;
          break;
      }
    });

    // Build the final response object
    const finalResponse = {
      RfqNumber: rfqNumber,
      AcceptedCount: statusCounts.Accepted,
      NotAcceptedCount: statusCounts.Not_Accepted,
      SubmittedCount: statusCounts.Submitted,
      RejectedCount: statusCounts.Not_Accepted, // Your enum name is Rejected, mapping from Not_Accepted
      PendingCount: statusCounts.Pending, // Added to include the pending count
      SupplierDetails: supplierDetails,
      DeadlineDate: deadlineDate,
      PublishedDate: publishedDate,
    };

    return finalResponse;
  });

  srv.on("READ", "RFQSuppliers", async (req) => {
    const { database } = await getConnection();
    const itemCol = database.collection("ZC_AISP_RFQ_WORK_ITEM");
    const hdrCol = database.collection("ZC_AISP_RFQ_HDR");
    const wrkHdrCol = database.collection("ZC_AISP_RFQ_WORK_HDR");

    let { filter, select, sort, skip, limit } = buildMongoQuery(req);

    if (!filter.RfqNumber) {
      return req.error(400, "RfqNumber filter is required to fetch suppliers");
    }

    const rfqNumber = filter.RfqNumber;
    const { RfqNumber: rfqFilter, ...otherFilters } = filter;

    try {
      // 🔹 Check award status
      const hdrawardCheck = await hdrCol.findOne({
        RfqNumber: rfqNumber,
        Status: "Awarded",
      });

      const wrkhdrawardCheck = await wrkHdrCol.findOne({
        RfqNumber: rfqNumber,
        Status: "Awarded",
      });

      const isRfqAwarded = !!hdrawardCheck || !!wrkhdrawardCheck;
      const awardedBidder = isRfqAwarded ? wrkhdrawardCheck?.Bidder : null;

      // 🔹 Aggregation pipeline
      const aggregationPipeline = [
        // Step 1: Match items by RFQ number
        { $match: { RfqNumber: rfqNumber } },

        // Step 1.5: Lookup submitted work header
        {
          $lookup: {
            from: "ZC_AISP_RFQ_WORK_HDR",
            let: { bidder: "$Bidder" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$RfqNumber", rfqNumber] },
                      { $eq: ["$Bidder", "$$bidder"] },
                      { $in: ["$Status", ["Submitted", "Awarded"]] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "submittedWorkHeaderInfo",
          },
        },

        // Step 1.6: Filter out non-submitted bidders
        {
          $match: {
            "submittedWorkHeaderInfo.0": { $exists: true },
          },
        },

        // Step 2: Group by Bidder
        {
          $group: {
            _id: {
              RfqNumber: "$RfqNumber",
              Bidder: "$Bidder",
            },
            MaterialCount: { $sum: 1 },
            QuotationValue: { $sum: "$Netwr" },
            Currency: { $first: "$Currency" },
            Items: {
              $push: {
                ItemNumber: "$ItemNumber",
                MaterialNo: "$MaterialNo",
                MaterialDesc: "$MaterialDesc",
                Quantity: "$Quantity",
                Netpr: "$Netpr",
                Netwr: "$Netwr",
                UnitOfMeasure: "$UnitOfMeasure",
                Plant: "$Plant",
                PlantAddress: "$PlantAddress",
                LotType: "$LotType",
              },
            },
            submittedWorkHeaderInfo: { $first: "$submittedWorkHeaderInfo" },
          },
        },

        // Step 2.5: Supplier-level award check
        {
          $lookup: {
            from: "ZC_AISP_RFQ_HDR",
            let: { rfqNum: "$_id.RfqNumber", bidder: "$_id.Bidder" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$RfqNumber", "$$rfqNum"] },
                      { $eq: ["$Bidder", "$$bidder"] },
                      { $eq: ["$Status", "Awarded"] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "supplierAwardCheck",
          },
        },

        // Step 2.6: Add RFQ-level award status
        {
          $addFields: {
            rfqAwardStatus: isRfqAwarded,
          },
        },

        // Step 3: Lookup question responses (score data)
        {
          $lookup: {
            from: "RFQ_QUESTION_RESPONSES",
            let: { rfqNum: "$_id.RfqNumber", bidder: "$_id.Bidder" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$RfqNumber", "$$rfqNum"] },
                      { $eq: ["$Bidder", "$$bidder"] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  TOTAL_SCORE: { $max: "$TOTAL_SCORE" },
                  MAX_POSSIBLE_SCORE: { $max: "$MAX_POSSIBLE_SCORE" },
                  PERCENTAGE_SCORE: { $max: "$PERCENTAGE_SCORE" },
                },
              },
            ],
            as: "scoreInfo",
          },
        },

        // Step 4: Extract fields (VendorName only)
        {
          $addFields: {
            RfqNumber: "$_id.RfqNumber",
            Bidder: "$_id.Bidder",
            workHeader: { $arrayElemAt: ["$submittedWorkHeaderInfo", 0] },

            Email: {
              $ifNull: [
                {
                  $getField: {
                    field: "Email",
                    input: { $arrayElemAt: ["$submittedWorkHeaderInfo", 0] },
                  },
                },
                "",
              ],
            },
            CreatedDate: {
              $ifNull: [
                {
                  $getField: {
                    field: "CREATED_ON",
                    input: { $arrayElemAt: ["$submittedWorkHeaderInfo", 0] },
                  },
                },
                new Date(),
              ],
            },
            LastUpdated: {
              $ifNull: [
                {
                  $getField: {
                    field: "LAST_UPDATED_ON",
                    input: { $arrayElemAt: ["$submittedWorkHeaderInfo", 0] },
                  },
                },
                new Date(),
              ],
            },
            SupplierQuotation: {
              $ifNull: [
                {
                  $getField: {
                    field: "SupplierQuotation",
                    input: { $arrayElemAt: ["$submittedWorkHeaderInfo", 0] },
                  },
                },
                "No Data",
              ],
            },
            VendorName: {
              $ifNull: [
                {
                  $getField: {
                    field: "VendorName",
                    input: { $arrayElemAt: ["$submittedWorkHeaderInfo", 0] },
                  },
                },
                "$_id.Bidder",
              ],
            },
            SupplierStatus: {
              $ifNull: [
                {
                  $getField: {
                    field: "Status",
                    input: { $arrayElemAt: ["$submittedWorkHeaderInfo", 0] },
                  },
                },
                "Submitted",
              ],
            },
            TOTAL_SCORE: {
              $ifNull: [{ $arrayElemAt: ["$scoreInfo.TOTAL_SCORE", 0] }, 0],
            },
            MAX_POSSIBLE_SCORE: {
              $ifNull: [
                { $arrayElemAt: ["$scoreInfo.MAX_POSSIBLE_SCORE", 0] },
                0,
              ],
            },
            PERCENTAGE_SCORE: {
              $ifNull: [
                { $arrayElemAt: ["$scoreInfo.PERCENTAGE_SCORE", 0] },
                0,
              ],
            },
            IsAwarded: { $gt: [{ $size: "$supplierAwardCheck" }, 0] },
            RfqAwarded: "$rfqAwardStatus",
          },
        },

        // Step 5: Apply additional filters
        { $match: otherFilters },

        // Step 6: Final projection
        {
          $project: {
            _id: 0,
            RfqNumber: 1,
            Bidder: 1,
            VendorName: 1,
            Email: 1,
            CreatedDate: 1,
            LastUpdated: 1,
            SupplierQuotation: 1,
            QuotationValue: 1,
            TOTAL_SCORE: 1,
            MAX_POSSIBLE_SCORE: 1,
            PERCENTAGE_SCORE: 1,
            MaterialCount: 1,
            Currency: 1,
            IsAwarded: 1,
            RfqAwarded: 1,
            SupplierStatus: 1,
            Items: 1,
          },
        },

        // Step 7: Sorting
        { $sort: sort || { QuotationValue: 1 } },

        // Step 8: Pagination
        { $skip: skip || 0 },
        { $limit: limit || 100 },
      ];

      const suppliers = await itemCol.aggregate(aggregationPipeline).toArray();

      if (!suppliers || suppliers.length === 0) {
        console.log(`[INFO] No suppliers found for RFQ ${rfqNumber}`);
        return [];
      }

      return suppliers;
    } catch (error) {
      console.error("Error in RFQSuppliers READ:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  });

  srv.on("createRFQ", async (req) => {
    const { database } = await getConnection();

    try {
      const {
        RFQProjectName,
        ReferenceInput,
        QuotationDeadline,
        CurrencyCode,
        PaymentTermCode,
        IncoTermCode,
        CompanyCode,
        PurchaseOrgCode,
        PurchaseGroupCode,
        Description,
        RFQType,
        RFQToItem,
        RFQToSupplier,
      } = req.data;

      // Validate required fields
      if (
        !RFQProjectName ||
        !CurrencyCode ||
        !CompanyCode ||
        !PurchaseOrgCode ||
        !PurchaseGroupCode ||
        !QuotationDeadline
      ) {
        return req.reject(400, "Missing required fields");
      }

      // Validate items
      if (!RFQToItem || !Array.isArray(RFQToItem) || RFQToItem.length === 0) {
        return req.reject(400, "At least one item is required");
      }

      // Validate suppliers
      if (
        !RFQToSupplier ||
        !Array.isArray(RFQToSupplier) ||
        RFQToSupplier.length === 0
      ) {
        return req.reject(400, "At least one supplier is required");
      }

      // const rfqHeaderCollection = database.collection("ZC_AISP_RFQ_WORK_HDR");
      // const rfqItemsCollection = database.collection("ZC_AISP_RFQ_WORK_ITEM");
      const rfqMaterialsCollection = database.collection("MATERIALS");
      const rfqPlantsCollection = database.collection("PLANTS");
      const rfqSuppliersCollection = database.collection("VENDORS");
      const rfqCreationLogs = database.collection("ZC_AISP_RFQ_CREATION_LOGS");
      const rfqWorkflowCollection = database.collection(
        "ZC_AISP_RFQ_PROCESS_WORKFLOW"
      );

      const rfqItems = [];
      const rfqSuppliers = [];

      const now = new Date();

      // Validate Item Details
      for (let i = 0; i < RFQToItem.length; i++) {
        const item = RFQToItem[i];
        const itemPosition = i + 1;

        const requiredFields = [
          "MaterialNo",
          "MaterialDesc",
          "PlantCode",
          "Quantity",
        ];

        for (const field of requiredFields) {
          if (!item[field]) {
            throw new Error(
              `Field ${field} is required for item ${itemPosition}`
            );
          }
        }

        // Validate material exists
        const existingMaterial = await rfqMaterialsCollection.findOne({
          Matnr: item.MaterialNo,
        });

        if (!existingMaterial) {
          throw new Error(
            `Material ${item.MaterialNo} does not exist for item ${itemPosition}`
          );
        }

        // Validate plant exists
        const existingPlant = await rfqPlantsCollection.findOne({
          Werks: item.PlantCode,
        });

        if (!existingPlant) {
          throw new Error(
            `Plant ${item.PlantCode} does not exist for item ${itemPosition}`
          );
        }

        // Validate Quantity
        const quantity = parseInt(item.Quantity);

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(
            `Quantity must be a positive number for item ${itemPosition}`
          );
        }

        // Validate type-specific fields
        if (RFQType === "Material") {
          if (!item.DeliveryDate) {
            throw new Error(
              `DeliveryDate is required for Material items (Item ${itemPosition})`
            );
          }
          const deliveryDate = new Date(item.DeliveryDate);
          if (isNaN(deliveryDate.getTime())) {
            throw new Error(
              `Invalid DeliveryDate format for item ${itemPosition}`
            );
          }
          if (deliveryDate < new Date()) {
            throw new Error(
              `DeliveryDate cannot be in the past for item ${itemPosition}`
            );
          }
        } else if (RFQType === "Service") {
          if (!item.ExpectedServicePeriodStart) {
            throw new Error(
              `ExpectedServicePeriodStart is required for Service items (Item ${itemPosition})`
            );
          }
          if (!item.ExpectedServicePeriodEnd) {
            throw new Error(
              `ExpectedServicePeriodEnd is required for Service items (Item ${itemPosition})`
            );
          }

          const startDate = new Date(item.ExpectedServicePeriodStart);
          const endDate = new Date(item.ExpectedServicePeriodEnd);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error(
              `Invalid date format for Service period in item ${itemPosition}`
            );
          }
          if (endDate <= startDate) {
            throw new Error(
              `ExpectedServicePeriodEnd must be after ExpectedServicePeriodStart for item ${itemPosition}`
            );
          }
          if (startDate < new Date()) {
            throw new Error(
              `ExpectedServicePeriodStart cannot be in the past for item ${itemPosition}`
            );
          }
        } else {
          throw new Error(
            `Invalid RFQType: ${RFQType}. Must be "Material" or "Service"`
          );
        }

        // Build item object
        const itemData = {
          RequestForQuotationItem: item.ItemNo,
          RequestForQuotation: "",
          PurchasingDocumentCategory: "R",
          PurchasingDocumentItemText: item.MaterialDesc,
          Material: item.MaterialNo,
          ManufacturerMaterial: "11",
          ManufacturerPartNmbr: "",
          Manufacturer: "",
          MaterialGroup: item.LotType || "",
          Plant: item.PlantCode,
          ManualDeliveryAddressID: "",
          ReferenceDeliveryAddressID: "",
          IncotermsClassification: "",
          IncotermsTransferLocation: "",
          IncotermsLocation1: "",
          IncotermsLocation2: "",
          ScheduleLineOrderQuantity: quantity.toString(),
          OrderQuantityUnit:
            item.UnitOfMeasure || existingMaterial.UnitOfMeasure || "EA",
          OrderItemQtyToBaseQtyNmrtr: "1",
          OrderItemQtyToBaseQtyDnmntr: "1",
          BaseUnit: "EA",
          ScheduleLineDeliveryDate:
            RFQType === "Material"
              ? `/Date(${new Date(item.DeliveryDate).getTime()})/`
              : RFQType === "Service"
              ? `/Date(${new Date(item.ExpectedServicePeriodStart).getTime()})/`
              : null,
          PurchaseRequisition: "",
          PurchaseRequisitionItem: "0",
          IsInfoRecordUpdated: false,
          // RFQType: RFQType,
          // ExpectedServicePeriodStart: RFQType === "Service" ? new Date(item.ExpectedServicePeriodStart) : null,
          // ExpectedServicePeriodEnd: RFQType === "Service" ? new Date(item.ExpectedServicePeriodEnd) : null,
        };

        rfqItems.push(itemData);
      }

      // Validate Supplier Details
      for (let j = 0; j < RFQToSupplier.length; j++) {
        const supplier = RFQToSupplier[j];

        const existingSupplier = await rfqSuppliersCollection.findOne({
          Lifnr: supplier.SupplierCode,
        });

        if (!existingSupplier) {
          throw new Error(
            `Supplier with code ${supplier.SupplierCode} does not exist`
          );
        }

        const supplierData = {
          RequestForQuotation: "",
          PartnerCounter: "1",
          PartnerFunction: "BI",
          Supplier: supplier.SupplierCode,
        };

        rfqSuppliers.push(supplierData);
      }

      const payloadForS4 = {
        RequestForQuotation: "",
        CompanyCode: CompanyCode,
        PurchasingDocumentCategory: "R",
        PurchasingDocumentType: "RQ",
        CreatedByUser: "SHIVA0427",
        CreationDate: `/Date(${now.getTime()})/`,
        LastChangeDateTime: `/Date(${now.getTime()})/`,
        Language: "EN",
        PurchasingOrganization: "1100", //PurchaseOrgCode,
        PurchasingGroup: PurchaseGroupCode,
        DocumentCurrency: CurrencyCode,
        IncotermsClassification: "",
        IncotermsTransferLocation: "",
        IncotermsVersion: "",
        IncotermsLocation1: "",
        IncotermsLocation2: "",
        PaymentTerms: "",
        CashDiscount1Days: "0",
        CashDiscount2Days: "0",
        CashDiscount1Percent: "0.000",
        CashDiscount2Percent: "0.000",
        NetPaymentDays: "0",
        RFQPublishingDate: `/Date(${now.getTime()})/`,
        QuotationLatestSubmissionDate: `/Date(${new Date(
          QuotationDeadline
        ).getTime()})/`,
        TargetAmount: "1000.00",
        CorrespncInternalReference: "",
        RFQLifecycleStatus: "02",
        RequestForQuotationName: RFQProjectName,
        QuotationEarliestSubmsnDate: null,
        FollowOnDocumentCategory: "F",
        FollowOnDocumentType: "NB",
        IsEndOfPurposeBlocked: "",
        to_RequestForQuotationItem: rfqItems,
        to_RequestForQuotationBidder: rfqSuppliers,
      };

      const RequestForQuotation = await createRFQInS4(payloadForS4);

      if (RequestForQuotation) {
        let RFQNumber = RequestForQuotation;

        // Create workflow entry only (S4 will handle header and items)
        const processID = cds.utils.uuid();

        const rfqWorkflow = {
          WorkFlowID: processID,
          RFQNumber,
          QuotationDeadline: new Date(QuotationDeadline),
          CreatedBy: req.user?.id || "SYSTEM",
          CreatedAt: new Date(),
          Suppliers: RFQToSupplier.map((supplier) => ({
            SupplierCode: supplier.SupplierCode,
            SupplierName: supplier.SupplierName,
            Status: "Pending",
            SupplierQuotation: null,
            QuotationCreationDate: null,
          })),
          isAwarded: false,
          AwardedDate: null,
          purchaseOrderCreated: false,
          purchaseOrderNumber: null,
        };

        const workFlowResult = await rfqWorkflowCollection.insertOne(
          rfqWorkflow
        );

        // Create success log entry
        const successLog = {
          Id: cds.utils.uuid(),
          createdAt: new Date(),
          rfqNumber: RFQNumber,
          status: "SUCCESS",
          createdBy: req.user?.id || "SYSTEM",
          itemsCount: RFQToItem.length,
          suppliersCount: RFQToSupplier.length,
        };

        await rfqCreationLogs.insertOne(successLog);

        return {
          rfqnumber: RFQNumber,
          workflowId: processID,
          message: "RFQ created successfully in S4 system",
          success: true,
          details: {
            itemsCreated: RFQToItem.length,
            suppliers: RFQToSupplier.length,
          },
        };
      } else {
        throw new Error(`S4 API returned status: ${rfqCreationResult.Status}`);
      }
    } catch (error) {
      console.error("[RFQ_CREATION] Error creating RFQ:", error);

      return req.reject(500, "Failed to create RFQ: " + error.message);
    }
  });

  // Handler to fetch process flow data
  srv.on("READ", "RFQProcessFlows", async (req) => {
    const { database } = await getConnection();

    try {
      const processFlowCol = database.collection(
        "ZC_AISP_RFQ_PROCESS_WORKFLOW"
      );

      // Build the MongoDB query from the CAP request
      let { filter, select, sort, skip, limit } = buildMongoQuery(req);

      if (req.query.SELECT.count === "true") {
        const count = await processFlowCol.countDocuments(filter);
        return { "@odata.count": count };
      }

      let workFlowData = processFlowCol.find(filter);
      if (select) workFlowData.project(select);
      if (sort) workFlowData.sort(sort);
      if (skip) workFlowData.skip(skip);
      if (limit) workFlowData.limit(limit);
      workFlowData = await workFlowData.toArray();

      const response = {};

      response["$count"] = workFlowData.length;
      response["results"] = workFlowData
      return workFlowData;
    } catch (error) {
      console.error("error in fetching Currencies:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to fetch Currencies");
    }
  });

  // === Award function // As soon as awarding happens update the workflow table
  srv.on("AwardorRejectRFQ", async (req) => {
    const { RfqNumber, Bidder, SupplierQuotation, NewStatus, Remarks } =
      req.data;
    const { database } = await getConnection();

    try {
      const RFQHeaderColl = database.collection("ZC_AISP_RFQ_HDR");
      const RFQWorkHeaderColl = database.collection("ZC_AISP_RFQ_WORK_HDR");
      const rfqWorkflowCollection = database.collection(
        "ZC_AISP_RFQ_PROCESS_WORKFLOW"
      );
      const RFQLogsColl = database.collection("ZC_AISP_RFQ_LOGS");

      if (!RfqNumber || !Bidder || !NewStatus || !SupplierQuotation) {
        throw {
          code: 400,
          message:
            "RfqNumber, Bidder, SupplierQuotation and NewStatus are required",
        };
      }

      // Validate NewStatus is either 'Awarded' or 'Rejected'
      if (!["Award", "Reject"].includes(NewStatus)) {
        throw {
          code: 400,
          message: 'NewStatus must be either "Award" or "Reject"',
        };
      }

      const now = new Date();

      // Check for awarded status in any combination
      const hdrhasAwardedStatus = await RFQHeaderColl.find({
        RfqNumber,
        Status: "Awarded",
      }).toArray();

      const workHdrhasAwardedStatus = await RFQWorkHeaderColl.find({
        RfqNumber,
        Status: "Awarded",
      }).toArray();

      if (
        hdrhasAwardedStatus.length > 0 ||
        workHdrhasAwardedStatus.length > 0
      ) {
        throw new Error(
          "Cannot proceed: A Bidder has already been awarded to this RFQ."
        );
      }

      // Find RFQ header
      const rfqHeader = await RFQHeaderColl.findOne({ RfqNumber, Bidder });

      const rfqWorkHeader = await RFQWorkHeaderColl.findOne({
        RfqNumber,
        Bidder,
      });

      if (!rfqHeader) {
        throw { code: 404, message: "RFQ header not found for this supplier" };
      }

      // Check if RFQ is in Submitted status
      if (
        rfqHeader.Status !== "Submitted" ||
        rfqWorkHeader.Status !== "Submitted"
      ) {
        throw {
          code: 400,
          message: `RFQ is not in Submitted status. Current status: ${rfqHeader.Status}`,
        };
      } else if (
        rfqHeader.Status === "Awarded" ||
        rfqHeader.Status === "Rejected"
      ) {
        throw {
          code: 400,
          message: `RFQ is Already ${rfqHeader.Status}`,
        };
      }

      const rfqAwardingResult = await AwardSupplierAgainstRFQ(
        SupplierQuotation
      );

      if (rfqAwardingResult.QTNLifecycleStatus === "06") {
        // return `RFQ ${RfqNumber} Awarded to Supplier ${Bidder} `;
        // Find workflow
        const rfqProcessFlow = await rfqWorkflowCollection.findOne({
          RFQNumber: RfqNumber,
        });

        if (rfqProcessFlow && !rfqProcessFlow.isAwarded) {
          // Check if the bidder exists in the workflow
          const supplierInWorkflow = rfqProcessFlow.Suppliers.find(
            (supplier) => supplier.SupplierCode === Bidder
          );

          if (supplierInWorkflow && supplierInWorkflow.Status !== "Awarded") {
            // Update the specific supplier status in workflow
            const workflowUpdate = {
              $set: {
                "Suppliers.$[supplier].Status": NewStatus,
                "Suppliers.$[supplier].LastUpdated": now,
                // ...(Remarks && { "Suppliers.$[supplier].Remarks": Remarks }),
                isAwarded: true,
                AwardedDate: now,
                // UdpatedAt: now,
              },
            };

            const arrayFilters = [{ "supplier.SupplierCode": Bidder }];

            await rfqWorkflowCollection.updateOne(
              { RFQNumber: RfqNumber },
              workflowUpdate,
              { arrayFilters }
            );

            // Reject all other suppliers automatically when one is awarded
            const rejectOtherSuppliersUpdate = {
              $set: {
                "Suppliers.$[otherSupplier].Status": "Rejected",
                "Suppliers.$[otherSupplier].LastUpdated": now,
                "Suppliers.$[otherSupplier].Remarks":
                  "Automatically rejected as another supplier was awarded",
                LAST_UPDATED_ON: now,
              },
            };

            const otherSuppliersArrayFilters = [
              { "otherSupplier.SupplierCode": { $ne: Bidder } },
            ];

            await rfqWorkflowCollection.updateOne(
              { RFQNumber: RfqNumber },
              rejectOtherSuppliersUpdate,
              { arrayFilters: otherSuppliersArrayFilters }
            );
          }

          // If Not present create one

          await RFQWorkHeaderColl.updateOne(
            {
              RfqNumber,
              Bidder,
            },
            {
              $set: {
                Status: "Awarded",
                LAST_UPDATED_ON: now,
              },
            }
          );
        }

        // Log the action
        await RFQLogsColl.insertOne({
          REQUEST_NO: RfqNumber,
          BIDDER: Bidder,
          ACTION: NewStatus.toUpperCase(),
          TIMESTAMP: now,
          APPROVER_ID: req.user?.id || "SYSTEM",
          COMMENT:
            Remarks || `Status changed to ${NewStatus} for supplier ${Bidder}`,
        });

        return {
          success: true,
          message: `Supplier ${Bidder} status changed to ${NewStatus} successfully`,
          rfqNumber: RfqNumber,
          supplier: Bidder,
          newStatus: NewStatus,
          awarded: NewStatus === "Awarded",
        };
      } else {
        throw new Error(`S4 API returned status: ${rfqAwardingResult}`);
      }
    } catch (error) {
      console.error("Error in AwardorRejectRFQ:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(
        500,
        "Failed to process award/reject action " + error.message
      );
    }
  });

  // === adding suppliers to Workflow action
  srv.on("addSuppliersToWorkflow", async (req) => {
    const {
      RfqNumber,
      isAwarded,
      awardedDate,
      purchaseOrderCreated,
      purchaseOrderNumber,
      suppliers,
    } = req.data;
    const { database } = await getConnection();
    try {
      const headerCol = database.collection("ZC_AISP_RFQ_WORK_HDR");
      const suppliersCol = database.collection("ZC_AISP_VENDORS"); // ZC_AISP_VENDORS [Suppliers]
      const processWorkflow = database.collection(
        "ZC_AISP_RFQ_PROCESS_WORKFLOW"
      ); // ZC_AISP_RFQ_PROCESS_WORKFLOW

      //Check if Workflow is present or not [if not throw error];
      const workflowPresent = await RFQWorkHeaderColl.findOne({
        RfqNumber,
        Bidder,
        Status: "Draft",
      });
      if (!workflowPresent) {
      }

      //From the workflow fetch RFQNumber and check if the same data is present in the header or not
      //Check if the supplier is present in the suppliers table or not
      //Check if the status fields in the supplier field [Only one awarded case should be present - if the outer isAwarded field is set as true]
      //if already awarded you cannot add suppliers to the process since its already completed
      //if not then add the suppliers
    } catch (error) {
      console.error("error in adding Suppliers:", error);
      if (error.code) return req.reject(error.code, error.message);
      return req.reject(500, "Failed to add Suppliers");
    }
  });

  // ++++++++++++++++++++++++++++++++++++++++++++++++++ CRON JOB ++++++++++++++++++++++++++++++++++++++++++++++++++
  async function fetchAllData(entityName, pageSize = 100) {
    try {
      const all = [];
      let skip = 0;
      const srv = await cds.connect.to("ZC_AISP_VALUEHELP_BND");

      while (true) {
        const page = await srv.run(
          SELECT.from(entityName).limit(pageSize, skip)
        );
        if (!page.length) break;
        all.push(...page);
        skip += page.length;
        if (page.length < pageSize) break;
      }
      return all;
    } catch (err) {
      console.error(`[ERROR] Failed to fetch ${entityName}:`, err.message);
      return [];
    }
  }

  async function upsertData(collection, data, keyField, entityName) {
    let successCount = 0;
    let errorCount = 0;

    // Use bulk operations for better performance with large datasets
    const bulkOps = [];

    for (const item of data) {
      const keyValue = item[keyField];

      if (!keyValue) {
        console.warn(`[WARN] Skipping malformed ${entityName}:`, item);
        errorCount++;
        continue;
      }

      const itemToInsert = {
        ...item,
        CREATED_ON: new Date(),
        LAST_UPDATED_ON: new Date(),
      };

      bulkOps.push({
        updateOne: {
          filter: { [keyField]: keyValue },
          update: { $set: itemToInsert },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      try {
        const result = await collection.bulkWrite(bulkOps, { ordered: false });
        successCount += result.upsertedCount + result.modifiedCount;
      } catch (err) {
        console.error(
          `[ERROR] Bulk operation failed for ${entityName}:`,
          err.message
        );
        errorCount += bulkOps.length;

        // Fallback to individual operations if bulk fails
        console.log(
          `[INFO] Falling back to individual operations for ${entityName}`
        );
        for (const item of data) {
          const keyValue = item[keyField];
          if (!keyValue) continue;

          try {
            const itemToInsert = {
              ...item,
              CREATED_ON: new Date(),
              LAST_UPDATED_ON: new Date(),
            };

            await collection.updateOne(
              { [keyField]: keyValue },
              { $set: itemToInsert },
              { upsert: true }
            );
            successCount++;
          } catch (fallbackErr) {
            console.error(
              `[ERROR] Failed to upsert ${entityName} ${keyValue}:`,
              fallbackErr.message
            );
            errorCount++;
          }
        }
      }
    }

    return { successCount, errorCount };
  }

  // Entity configuration - only the ones we need to sync
  const entityConfig = {
    // Already Present as CURRENCY Table
    ZC_AISP_CURRENCY_VH: {
      keyField: "Waers",
      collectionName: "ZC_AISP_CURRENCY_VH",
      displayName: "Currencies",
    },

    // Already Present as COMPANY_CODE Table
    ZC_AISP_COMPANYCODE_VH: {
      keyField: "CompanyCode",
      collectionName: "ZC_AISP_COMPANYCODE_VH",
      displayName: "Company Codes",
    },

    // Already Present as MATERIAL_GROUP Table
    ZC_AISP_MATERIALGROUP_VH: {
      keyField: "Matkl",
      collectionName: "ZC_AISP_MATERIALGROUP_VH",
      displayName: "Material Groups",
    },

    ZC_AISP_MATERIALDETAILS_VH: {
      keyField: "Matnr",
      collectionName: "MATERIALS",
      displayName: "Material Details",
    },

    ZC_AISP_INCOTERMS_VH: {
      keyField: "Inco1",
      collectionName: "INCOTERMS",
      displayName: "Incoterms",
    },

    ZC_AISP_PAYMENTTERMS_VH: {
      keyField: "Zterm",
      collectionName: "PAYMENTTERMS",
      displayName: "Payment Terms",
    },

    ZC_AISP_PLANT_VH: {
      keyField: "Werks",
      collectionName: "PLANTS",
      displayName: "Plants",
    },

    ZC_AISP_PURCHASEGROUP_VH: {
      keyField: "Ekgrp",
      collectionName: "PURCHASEGROUPS",
      displayName: "Purchase Groups",
    },

    ZC_AISP_PURCHASEORG_VH: {
      keyField: "Ekorg",
      collectionName: "PURCHASEORGS",
      displayName: "Purchase Organizations",
    },

    ZC_AISP_VENDORDETAILS_VH: {
      keyField: "Lifnr",
      collectionName: "VENDORS",
      displayName: "Vendor Details",
    },
  };

  // Main cron job
  cron.schedule("*/15 * * * *", async () => {
    const startTime = new Date();

    try {
      const { database } = await getConnection();

      let totalSuccess = 0;
      let totalErrors = 0;

      // Process entities with controlled concurrency
      const entities = Object.entries(entityConfig);

      for (let i = 0; i < entities.length; i++) {
        const [entityName, config] = entities[i];

        try {
          console.log(
            `[INFO] Processing ${config.displayName} (${i + 1}/${
              entities.length
            })...`
          );

          // Fetch data with timeout protection
          const data = await Promise.race([
            fetchAllData(entityName),
            new Promise(
              (_, reject) =>
                setTimeout(
                  () =>
                    reject(new Error(`Timeout fetching ${config.displayName}`)),
                  300000
                ) // 5 min timeout
            ),
          ]);

          if (data.length === 0) {
            console.log(`[INFO] Skipping ${config.displayName} - no data`);
            continue;
          }

          // Process in batches to avoid memory issues
          const batchSize = 1000;
          for (let j = 0; j < data.length; j += batchSize) {
            const batch = data.slice(j, j + batchSize);
            const batchNumber = Math.floor(j / batchSize) + 1;
            const totalBatches = Math.ceil(data.length / batchSize);

            const collection = database.collection(config.collectionName);
            const result = await upsertData(
              collection,
              batch,
              config.keyField,
              `${config.displayName} (batch ${batchNumber}/${totalBatches})`
            );

            totalSuccess += result.successCount;
            totalErrors += result.errorCount;

            // Small delay between batches to prevent overwhelming the database
            if (j + batchSize < data.length) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        } catch (error) {
          console.error(
            `[ERROR] Failed to process ${config.displayName}:`,
            error.message
          );
          totalErrors++; // Count this as an error for the summary
          continue; // Continue with next entity even if this one fails
        }
      }
    } catch (err) {
      console.error("[CRON] RFQ sync failed:", err.message);
    }
  });
});
