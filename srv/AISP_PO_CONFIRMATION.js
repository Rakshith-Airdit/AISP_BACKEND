// // standard Code ------START

// const cds = require('@sap/cds');

// module.exports = async (srv) =>
// {
//     // Using CDS API
//     const ZP_MM_POHEAD_BND = await cds.connect.to("ZP_MM_POHEAD_BND");
//       srv.on('READ', 'SAP__Currencies', req => ZP_MM_POHEAD_BND.run(req.query));
//       srv.on('READ', 'SAP__UnitsOfMeasure', req => ZP_MM_POHEAD_BND.run(req.query));
//       srv.on('READ', 'ZC_MM_ESLL', req => ZP_MM_POHEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_MM_POHEAD', req => ZP_MM_POHEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_MM_POITEM', req => ZP_MM_POHEAD_BND.run(req.query));
// }

//standard Code ------END

//Modified code for CAP SERVICE :-

const cds = require("@sap/cds");
const cron = require("node-cron");
const { mongoRead } = require("./Library/helper");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { getConnection } = require("./Library/DBConn");
const { Decimal128 } = require("mongodb");
const xml2js = require("xml2js");

function convertSAPDate(sapDate) {
  // Ensure sapDate is not null or undefined before calling match()
  if (!sapDate) {
    return null; // Or handle this case as per your requirement
  }

  const match = sapDate.match(/\/Date\((\d+)\)\//);
  if (match && match[1]) {
    const timestamp = parseInt(match[1], 10);
    return new Date(timestamp);
  }

  return null; // If the match fails, return null or handle it as needed
}

function convertToString(fieldValue) {
  return String(fieldValue || "");
}

async function fetchAndStorePOHeads() {
  try {
    const db = await cds.connect.to("ZP_MM_POHEAD_BND");
    const pageSize = 1000;
    let skip = 0;
    let totalFetched = 0;

    const { client, database } = await getConnection();
    const collection = database.collection("ZP_MM_POHEAD");
    await collection.createIndex({ Ebeln: 1 }, { unique: true });

    while (true) {
      const query = `ZP_MM_POHEAD?$top=${pageSize}&$skip=${skip}`;
      const poHeads = await db.run(query);

      if (!poHeads || poHeads.length === 0) {
        console.log(`[INFO] No more PO Heads to fetch.`);
        break; // No more data
      }

      let newRecords = 0;
      for (let po of poHeads) {
        const ebeln = String(po.Ebeln).trim();

        // Convert each field using specific conversion functions
        const updatedPO = {
          ...po,
          confirm_ac: String(po.confirm_ac),
          Delete_mc: new Boolean(po.Delete_mc),
          Update_mc: Boolean(po.Update_mc),
          to_poitem_oc: Boolean(po.to_poitem_oc),
          Amount: new Decimal128(po.Amount),
          zdays: parseInt(po.zdays),
          Bedat: convertSAPDate(po.Bedat),
          Status: String(po.Status),
          // Any additional fields you want to convert go here...
        };

        // Use upsert to avoid duplication
        const result = await collection.updateOne(
          { Ebeln: ebeln },
          { $set: updatedPO },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          newRecords++;
        }
      }

      totalFetched += poHeads.length;
      skip += pageSize;

      if (poHeads.length < pageSize) {
        break; // Last page
      }
    }
  } catch (error) {
    console.error(`[ERROR] Failed to fetch PO Heads:`, error.message);
  }
}

async function fetchAndStorePOItems() {
  try {
    const db = await cds.connect.to("ZP_MM_POHEAD_BND");
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_MM_POITEM");

    await collection.createIndex({ Ebeln: 1, Ebelp: 1 }, { unique: true });

    const pageSize = 1000;
    let skip = 0;
    let totalFetched = 0;

    while (true) {
      const query = `ZP_MM_POITEM?$top=${pageSize}&$skip=${skip}`;
      const itemsBatch = await db.run(query);

      if (!itemsBatch || itemsBatch.length === 0) {
        break; // No more data
      }

      let newRecords = 0;
      for (let item of itemsBatch) {
        const ebeln = String(item.Ebeln).trim();
        const ebelp = String(item.Ebelp).trim();

        // Use upsert to avoid duplication
        const result = await collection.updateOne(
          { Ebeln: ebeln, Ebelp: ebelp },
          {
            $set: {
              Ebeln: String(item.Ebeln), // Convert Ebeln to String
              Ebelp: String(item.Ebelp), // Convert Ebelp to String
              confirm_ac: Boolean(item.confirm_ac), // Boolean conversion
              Delete_mc: Boolean(item.Delete_mc), // Boolean conversion
              Update_mc: Boolean(item.Update_mc), // Boolean conversion
              Amount: new Decimal128(item.Iamount), // Decimal conversion
              Total: new Decimal128(item.Total), // Integer conversion
              Total: new Decimal128(item.Total),
              Taxval: new Decimal128(item.Taxval),
              Taxper: new Decimal128(item.Taxper),
              Discount: new Decimal128(item.Discount),
              Menge: new Decimal128(item.Menge),
              Confirmedqty: new Decimal128(item.Confirmedqty),
              Rate: convertSAPDate(item.Rate), // Date conversion
              Status: String(item.Status), // Convert Status to String
              // Add more fields as per your data schema...
              ...item,
            },
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          newRecords++;
        }
      }

      totalFetched += itemsBatch.length;
      skip += pageSize;

      if (itemsBatch.length < pageSize) {
        break; // Last page
      }
    }
  } catch (error) {
    console.error(`[ERROR] Failed to fetch PO Items:`, error.message);
  }
}

async function fetchAndStoreESLL() {
  try {
    const db = await cds.connect.to("ZP_MM_POHEAD_BND");

    const { client, database } = await getConnection();
    const collection = database.collection("ZC_MM_ESLL");

    await collection.createIndex({ Packno: 1 }, { unique: true });

    let skip = 0;
    const pageSize = 1000;
    let newRecords = 0;

    while (true) {
      const esllData = await db.run(
        `ZC_MM_ESLL?$top=${pageSize}&$skip=${skip}`
      );

      if (!esllData || esllData.length === 0) {
        console.log(`[INFO] No more ESLL records found.`);
        break; // Exit loop when no more records are fetched
      }

      for (let record of esllData) {
        const packno = String(record.Packno).trim();

        // Convert fields here
        const convertedRecord = {
          Packno: packno,
          Introw: convertToString(record.Introw),
          Extrow: convertToString(record.Extrow),
          Srvpos: convertToString(record.Srvpos),
          SubPackno: convertToString(record.SubPackno),
          Ktext1: convertToString(record.Ktext1),
          Menge: parseInt(record.Menge),
          Meins: convertToString(record.Meins),
          Brtwr: parseInt(record.Brtwr),
          waers: convertToString(record.waers),
        };

        // Use upsert to avoid duplication
        await collection.updateOne(
          { Packno: packno },
          { $set: convertedRecord },
          { upsert: true }
        );
        newRecords++;
      }

      skip += pageSize; // Increase skip for the next batch of records
    }
  } catch (error) {
    console.error(`[ERROR] Failed to fetch ESLL Data:`, error.message);
  }
}

const formatDate = (timestamp) => {
  const date = new Date(
    parseInt(timestamp.replace("/Date(", "").replace(")/", ""))
  );
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of the year
  return `${day}/${month}/${year}`;
};

// Background Job: Run every 5 min to update PO HEADS, ITEMS, ESLL
cron.schedule("*/15 * * * *", async () => {
  await fetchAndStorePOHeads();
  await fetchAndStorePOItems();
  await fetchAndStoreESLL();
});

async function fetchFromMongoDB(entity, req) {
  const { database } = await getConnection();
  const collection = database.collection(entity);
  const data = await collection.find().toArray();
  return data;
}

// CAPM Service Definition
module.exports = async (srv) => {
  srv.on("READ", "ZP_MM_POHEAD", async (req) =>
    fetchFromMongoDB("ZP_MM_POHEAD", req)
  );

  srv.on("READ", "ZP_MM_POITEM", async (req) =>
    fetchFromMongoDB("ZP_MM_POITEM", req)
  );

  srv.on("READ", "FilteredPOHeaders", async (req) => {
    try {
      const data = await mongoRead("ZP_MM_POHEAD", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "FilteredPOItems", async (req) => {
    const { database } = await getConnection();
    try {
      const data = await mongoRead("ZP_MM_POITEM", req, []);
      return data;
    } catch (err) {
      console.error("Error reading po item data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "ZC_MM_ESLL_CAP", async (req) => {
    const { database } = await getConnection();
    const collection = database.collection("ZC_MM_ESLL");

    let query = {};

    // ✅ Extract all `$filter` parameters dynamically
    if (req.query && req.query.SELECT && req.query.SELECT.where) {
      const whereClause = req.query.SELECT.where;

      // Loop through the conditions to dynamically build the query
      for (let i = 0; i < whereClause.length; i += 2) {
        if (whereClause[i].ref && whereClause[i + 1] === "=") {
          const field = whereClause[i].ref[0]; // Field Name
          const value = whereClause[i + 2].val; // Value

          // Check if we're working with Packno or SubPackno, and adjust accordingly
          if (field === "SubPackno") {
            query["Packno"] = value; // Transform SubPackno to Packno
          } else {
            query[field] = value;
          }
          i++; // Move to the next condition
        }
      }
    }

    let data = await collection.find(query).toArray();

    // Format date fields if necessary
    data = data.map((item) => {
      if (item.Bedat) {
        item.Bedat = formatDate(item.Bedat); // Example of formatting a date field if required
      }
      return item;
    });

    //.close()();
    data["$count"] = data.length; // Include the count of records
    return data;
  });

  async function fetchUpdatedPOHeaderStatus(Ebeln) {
    const baseURL = `http://airdithanaprd.airditsoftware.com:8010/sap/opu/odata/sap/ZP_MM_POHEAD_BND/ZP_MM_POHEAD(Ebeln='${Ebeln}')`;

    const username = "BHABANI0366";
    const password = "Bhabani0366";
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    try {
      const response = await fetch(baseURL, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch PO Head Status. Status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.d.Status;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch PO Head Status: ${error.message}`);
      return null;
    }
  }

  //PO Confirmation
  srv.on("confirmPOItem", async (req) => {
    const { poItems } = req.data;

    if (!poItems || !Array.isArray(poItems) || poItems.length === 0) {
      return { error: "At least one PO item is required!" };
    }

    const { database } = await getConnection();
    const collection = database.collection("ZP_MM_POITEM");
    const poHeaderCollection = database.collection("ZP_MM_POHEAD");
    const logCollection = database.collection("LOG_ZP_MM_POITEM");

    const baseURL =
      "http://airdithanaprd.airditsoftware.com:8010/sap/opu/odata/sap/ZP_MM_POHEAD_BND";
    const username = "BHABANI0366";
    const password = "Bhabani0366";
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    let csrfToken, cookieHeader;
    try {
      const csrfResponse = await fetch(baseURL, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "X-CSRF-Token": "Fetch",
        },
      });

      if (!csrfResponse.ok) {
        throw new Error(
          `Failed to fetch CSRF Token. Status: ${csrfResponse.status}`
        );
      }

      csrfToken = csrfResponse.headers.get("x-csrf-token");

      // Fixed Cookie Handling
      const cookies = csrfResponse.headers.get("set-cookie");
      cookieHeader = cookies
        ? cookies
            .split(",")
            .map((c) => c.trim())
            .join("; ")
        : "";

      if (!csrfToken) {
        throw new Error("CSRF Token not received from SAP.");
      }
    } catch (error) {
      console.error(`[ERROR] CSRF Token Fetch Failed: ${error.message}`);
      return { error: `CSRF Token Fetch Failed: ${error.message}` };
    }

    // Process each PO item separately
    let results = [];

    for (const { Ebeln, Ebelp } of poItems) {
      try {
        // Update MongoDB Status to "In-Progress"
        await collection.updateOne(
          { Ebeln, Ebelp },
          { $set: { Status: "In-Progress" } }
        );
        await logCollection.insertOne({
          entity: "ZP_MM_POITEM",
          status: "In-Progress",
          timestamp: new Date(),
          message: `PO Item ${Ebeln}-${Ebelp} marked as In-Progress before confirmation.`,
        });

        // Call SAP API for Confirmation
        const confirmURL = `${baseURL}/confirm?Ebeln='${Ebeln}'&Ebelp='${Ebelp}'`;

        const response = await fetch(confirmURL, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": csrfToken,
            Cookie: cookieHeader,
          },
        });

        const textResult = await response.text();

        try {
          const result = JSON.parse(textResult);

          if (response.ok) {
            await collection.updateOne(
              { Ebeln, Ebelp },
              { $set: { Status: "Confirmed" } }
            );

            // Fetch Updated PO Header Status from SAP and Update MongoDB Immediately   from pending to In-Process
            const updatedStatus = await fetchUpdatedPOHeaderStatus(Ebeln);
            if (updatedStatus) {
              await poHeaderCollection.updateOne(
                { Ebeln },
                { $set: { Status: updatedStatus } }
              );
            }

            results.push({
              message: `PO Item ${Ebeln}-${Ebelp} confirmed successfully.`,
            });
          } else {
            // If SAP Fails, Revert Status to "Pending"
            await collection.updateOne(
              { Ebeln, Ebelp },
              { $set: { Status: "Pending" } }
            );

            results.push({
              message: `PO Item ${Ebeln}-${Ebelp} failed: ${
                result.error?.message || "Unknown error"
              }`,
            });
          }
        } catch (jsonError) {
          results.push({ message: `SAP Response Error: ${textResult}` });
        }
      } catch (error) {
        // Handle API Failure (Network Issues)
        await collection.updateOne(
          { Ebeln, Ebelp },
          { $set: { Status: "Pending" } }
        );

        results.push({
          message: `PO Item ${Ebeln}-${Ebelp} failed: API Error - ${error.message}`,
        });
      }
    }
    return {
      "@odata.context": "$metadata#Collection(Result)",
      value: results,
    };
  });
};
