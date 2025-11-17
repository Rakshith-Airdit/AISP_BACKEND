const cds = require("@sap/cds");
const { auth } = require("@sap/cds"); //
const { getConnection } = require("../srv/Library/DBConn");
const qs = require("qs");
const axios = require("axios");
const {
  sendPostPayloadToSAPforCreateVimWithOCR,
  sendPostPayloadToSAPforCreateVimWithOutOCR,
  sendPostPayloadToSAPforCreateNPOInvoice,
} = require("./Library/VIM_WITH_OCR");

const LOGIN_URL = "https://login.cf.ap10.hana.ondemand.com/oauth/token";
const CLIENT_ID = "cf";
const USERNAME = "ramchandra@airditsoftware.com";
const PASSWORD = "Ramchandra@1999";

// The function to get the OAuth token
async function getOAuthToken() {
  try {
    const response = await axios.post(
      LOGIN_URL,
      qs.stringify({
        grant_type: "password", // Password grant type
        username: USERNAME, // Your username
        password: PASSWORD, // Your password
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:`).toString(
            "base64"
          )}`, // "cf" client with empty secret
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("Access Token:", response.data.access_token);
    console.log("Token Expiry:", response.data.expires_in);

    return response.data.access_token; // Use this token in CF v3 API calls
  } catch (error) {
    console.error(
      "Error fetching OAuth token:",
      error.response ? error.response.data : error.message
    );
  }
}

async function getAppGuid(token, appName) {
  const url = `https://api.cf.ap10.hana.ondemand.com/v3/apps?names=${appName}`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.data.resources || res.data.resources.length === 0) {
    throw new Error(`App ${appName} not found in CF`);
  }

  console.log(res.data.resources[0].guid);

  return res.data.resources[0].guid;
}

//START SERVICE
async function startApp(token, guid) {
  const url = `https://api.cf.ap10.hana.ondemand.com/v3/apps/${guid}/actions/start`;
  const res = await axios.post(
    url,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return res.data;
}
//STOP SERVICE
async function stopApp(token, guid) {
  const url = `https://api.cf.ap10.hana.ondemand.com/v3/apps/${guid}/actions/stop`;
  const res = await axios.post(
    url,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return res.data;
}

//RESTART SERVICE
async function restartApp(token, guid) {
  const url = `https://api.cf.ap10.hana.ondemand.com/v3/apps/${guid}/actions/restart`;
  const res = await axios.post(
    url,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return res.data;
}

module.exports = cds.service.impl(async function () {
  const { GlobalMailConfig } = this.entities;
  const { database } = await getConnection();
  const collection = database.collection("GlobalMailConfig");

  // Validation logic
  const validateData = (data, req) => {
    const {
      MAIL_ID,
      EMAIL_EXCHANGE_SERVER,
      POLL_INTERVAL,
      FILE_TYPES,
      FILE_SIZE_MB,
      MAIL_SUBJECT_PATTERN,
      CLIENT_ID,
      CLIENT_SECRET,
      TENANT_ID,
      HOST,
      APP_PASSWORD,
    } = data;

    // Check mandatory fields
    if (
      !MAIL_ID ||
      !EMAIL_EXCHANGE_SERVER ||
      !POLL_INTERVAL ||
      !FILE_TYPES ||
      !FILE_SIZE_MB ||
      !MAIL_SUBJECT_PATTERN
    ) {
      return req.error(
        400,
        "All fields are mandatory: MAIL_ID, EMAIL_EXCHANGE_SERVER, POLL_INTERVAL, FILE_TYPES, FILE_SIZE_MB, MAIL_SUBJECT_PATTERN"
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(MAIL_ID)) {
      return req.error(400, "Invalid email format for MAIL_ID");
    }

    // Validate file types
    const validFileTypes = ["PDF", "JPEG", "PNG"];
    const fileTypesArray = FILE_TYPES.split(",").map((type) =>
      type.trim().toUpperCase()
    );
    for (let type of fileTypesArray) {
      if (!validFileTypes.includes(type)) {
        return req.error(
          400,
          `Invalid file type: ${type}. Allowed types: ${validFileTypes.join(
            ", "
          )}`
        );
      }
    }

    // Validate POLL_INTERVAL (e.g., 1–60 minutes)
    if (
      !Number.isInteger(POLL_INTERVAL) ||
      POLL_INTERVAL < 1 ||
      POLL_INTERVAL > 60
    ) {
      return req.error(
        400,
        "POLL_INTERVAL must be an integer between 1 and 60"
      );
    }

    // Validate FILE_SIZE_MB (e.g., positive integer)
    if (!Number.isInteger(FILE_SIZE_MB) || FILE_SIZE_MB <= 0) {
      return req.error(400, "FILE_SIZE_MB must be a positive integer");
    }

    // Conditional validation for Microsoft Exchange Server
    if (EMAIL_EXCHANGE_SERVER === "M") {
      if (!CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
        return req.error(
          400,
          "CLIENT_ID, CLIENT_SECRET, and TENANT_ID are required for Microsoft Exchange Server"
        );
      }
    }

    // Conditional validation for Google Workspace
    if (EMAIL_EXCHANGE_SERVER === "G") {
      if (!HOST || !APP_PASSWORD) {
        return req.error(
          400,
          "HOST and APP_PASSWORD are required for Google Workspace"
        );
      }
    }
  };

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
              query.$or.push({
                [field]: {
                  $ne: val,
                },
              });
              break;
            case ">":
              query.$or = query.$or || [];
              query.$or.push({
                [field]: {
                  $gt: val,
                },
              });
              break;
            case ">=":
              query.$or = query.$or || [];
              query.$or.push({
                [field]: {
                  $gte: val,
                },
              });
              break;
            case "<":
              query.$or = query.$or || [];
              query.$or.push({
                [field]: {
                  $lt: val,
                },
              });
              break;
            case "<=":
              query.$or = query.$or || [];
              query.$or.push({
                [field]: {
                  $lte: val,
                },
              });
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
            query[field] = {
              $ne: val,
            };
            break;
          case ">":
            query[field] = {
              $gt: val,
            };
            break;
          case ">=":
            query[field] = {
              $gte: val,
            };
            break;
          case "<":
            query[field] = {
              $lt: val,
            };
            break;
          case "<=":
            query[field] = {
              $lte: val,
            };
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

      console.log("Search Field:", searchField);
      console.log("Search Value:", searchValue);

      // Ensure the search value is treated as a string
      if (typeof searchValue !== "string") {
        searchValue = String(searchValue);
      }

      // Only add search condition if both the field and value are valid
      if (searchField && searchValue) {
        const escapedSearchValue = escapeRegexString(searchValue);
        query[searchField] = new RegExp(escapedSearchValue, "i");
        console.log("Query Built:", query);
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

  // CREATE operation
  this.on("CREATE", GlobalMailConfig, async (req) => {
    const data = req.data;
    validateData(data, req);

    try {
      // Check for duplicate MAIL_ID
      const existing = await collection.findOne({ MAIL_ID: data.MAIL_ID });
      if (existing) {
        return req.error(409, `Mailbox with ID ${data.MAIL_ID} already exists`);
      }

      // Prepare persisted data (exclude non-persisted fields)
      const persistedData = {
        MAIL_ID: data.MAIL_ID,
        EMAIL_EXCHANGE_SERVER: data.EMAIL_EXCHANGE_SERVER,
        POLL_INTERVAL: data.POLL_INTERVAL,
        FILE_TYPES: data.FILE_TYPES,
        FILE_SIZE_MB: data.FILE_SIZE_MB,
        MAIL_SUBJECT_PATTERN: data.MAIL_SUBJECT_PATTERN,
        DESCRIPTION: data.DESCRIPTION, // Fixed typo from DESCRIPTIO to DESCRIPTION
        CREATED_AT: new Date(), // Auto-populate timestamp
      };

      const token = await getOAuthToken();
      const guid = await getAppGuid(token, "aisp-mail-rose");
      const startRes = await startApp(token, guid);
      console.log("App started, CF response:", startRes.state || startRes);
      // Insert the data into the collection
      const result = await collection.insertOne(persistedData);

      return {
        ...persistedData,
        _id: result.insertedId,
      };
    } catch (err) {
      req.error(500, `Create failed: ${err.message}`);
    }
  });

  this.on("READ", GlobalMailConfig, async (req) => {
    try {
      const { supplisr, error } =
        await sendPostPayloadToSAPforCreateVimWithOutOCR(1000001004);

      if (error) {
        // return { error: `SAP invoice creation failed: ${error}` }; // Send error response back
        throw new Error(`SAP invoice creation failed: ${error}`);
      }
      return supplisr;
    } catch (err) {
      var iErrorCode = err.code ?? 500;
      req.error({ code: iErrorCode, message: err.message ? err.message : err });
    }
  });

  this.on("PUT", GlobalMailConfig, async (req) => {
    const data = req.data;
    validateData(data, req);

    try {
      // Prepare persisted data (exclude non-persisted fields)
      const persistedData = {
        EMAIL_EXCHANGE_SERVER: data.EMAIL_EXCHANGE_SERVER,
        POLL_INTERVAL: data.POLL_INTERVAL,
        FILE_TYPES: data.FILE_TYPES,
        FILE_SIZE_MB: data.FILE_SIZE_MB,
        MAIL_SUBJECT_PATTERN: data.MAIL_SUBJECT_PATTERN,
      };

      // Update the database record
      const result = await collection.updateOne(
        { MAIL_ID: data.MAIL_ID },
        { $set: persistedData },
        { upsert: false }
      );

      if (result.matchedCount === 0) {
        return req.error(404, `Mailbox with ID ${data.MAIL_ID} not found`);
      }

      // Restart the app using Cloud Foundry API
      const token = await getOAuthToken();
      const guid = await getAppGuid(token, "aisp-mail-rose");

      // Restart the app
      const restartRes = await restartApp(token, guid);
      
      console.log(
        "App restarted, CF response:",
        restartRes.state || restartRes
      );

      return data; // Return the updated data
    } catch (err) {
      req.error(500, `Update failed: ${err.message}`);
    }
  });

  //Vaibhav
  this.on("DELETE", GlobalMailConfig, async (req) => {
    const { MAIL_ID } = req.data;
    try {
      const existing = await collection.findOne({ MAIL_ID });
      if (!existing) {
        return req.error(404, `Mailbox with ID ${MAIL_ID} not found`);
      }

      const token = await getOAuthToken();
      const guid = await getAppGuid(token, "aisp-mail-rose");

      const stopRes = await stopApp(token, guid);
      console.log("App stopped, CF response:", stopRes.state || stopRes);

      const result = await collection.deleteOne({ MAIL_ID });
      if (result.deletedCount === 0) {
        return req.error(404, `Mailbox with ID ${MAIL_ID} not found`);
      }

      return { success: true };
    } catch (err) {
      console.error("⚠️ Error during DELETE:", err.message);
      req.error(500, `Delete failed: ${err.message}`);
    }
  });
});
