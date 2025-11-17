// const cds = require('@sap/cds');
// // Standard ASN CODE -------------------------------------START
// module.exports = async (srv) =>
// {
//     // Using CDS API
//     const ZP_MM_ASNPOHEAD_BND = await cds.connect.to("ZP_MM_ASNPOHEAD_BND");
//       srv.on('READ', 'SAP__Currencies', req => ZP_MM_ASNPOHEAD_BND.run(req.query));
//       srv.on('READ', 'SAP__UnitsOfMeasure', req => ZP_MM_ASNPOHEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_MM_ASNPOHEAD', req => ZP_MM_ASNPOHEAD_BND.run(req.query));   //188
//       srv.on('READ', 'ZP_MM_ASNPOITEM', req => ZP_MM_ASNPOHEAD_BND.run(req.query));  //252
//       srv.on('READ', 'ZP_MM_SHIPHEAD', req => ZP_MM_ASNPOHEAD_BND.run(req.query));
// }

//Standard ASN CODE -------------------------------------END

const cds = require("@sap/cds");
const cron = require("node-cron");
const { getConnection } = require("./Library/DBConn");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { mongoRead } = require("./Library/helper");
const { createASNBatch } = require("./Library/VIM_WITH_OCR");
const { Decimal128 } = require("mongodb");

async function logFetch(entity, status, message) {
  const { client, database } = await getConnection();
  const logCollection = database.collection(`LOG_${entity}`);
}

function convertSAPDate(sapDate) {
  // Ensure sapDate is not null or undefined before calling match()
  if (!sapDate) {
    return null; // Or handle this case as per your requirement
  }

  // The OData format for dates/timestamps is /Date(timestamp)/
  const match = sapDate.match(/\/Date\((\d+)\)\//);
  if (match && match[1]) {
    const timestamp = parseInt(match[1], 10);
    return new Date(timestamp);
  }

  // If the match fails, return null. Note: This assumes only /Date()/ format for conversion.
  return null;
}

module.exports = async (srv) => {
  srv.on("READ", "ZP_MM_SHIPHEAD", async (req) => {
    try {
      const data = await mongoRead("ZP_MM_SHIPHEAD", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "ZP_MM_ASNPOHEAD", async (req) => {
    const { client, database } = await getConnection();
    // const collection = database.collection("ZP_MM_ASNPOHEAD");
    try {
      const data = await mongoRead("ZP_MM_ASNPOHEAD", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "ASN_CREATION_HEAD", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_MM_ASNPOHEAD");
    try {
      const data = await mongoRead("ZP_MM_ASNPOHEAD", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "ZP_MM_ASNPOITEM", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_MM_ASNPOITEM");
    try {
      const data = await mongoRead("ZP_MM_ASNPOITEM", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "ASN_SHIPMENT_AND_TRANSPORT_DATA", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_ASN_SHIPMENT_TRANSPORT_DATA");

    try {
      // Build the MongoDB query from the CAP request
      const { filter, select, sort, skip, limit } = buildMongoQuery(req);

      const cursor = collection.find(filter);
      if (select) cursor.project(select);
      if (sort) cursor.sort(sort);
      if (skip) cursor.skip(skip);
      if (limit) cursor.limit(limit);

      let data = await cursor.toArray();

      if (!data) {
        return req.error({
          code: 404,
          message: `No data found!!`,
        });
      }

      data = data.map((item) => {
        if (item.TransportDetails) {
          item.TransportDetails = [item.TransportDetails];
        }
        if (item.ShipmentDetails) {
          item.ShipmentDetails = [item.ShipmentDetails];
        }
        return item;
      });

      return data;
    } catch (error) {
      console.error("Error in ASN_SHIPMENT_AND_TRANSPORT_DATA READ:", error);
      throw error;
    }
  });

  srv.on("createASN", async (req) => {
    let results = [];
    const { deliveryNumber } = await createASNBatch({
      asnHead: req.data.asnHead,
      asnItems: req.data.asnItems,
      DeliveryDate: req.data.DeliveryDate,
    });
    console.log("Returned Delivery Number: ", deliveryNumber);
    // return `In-Bound Delivery No${deliveryNumber}`;
    results.push({
      message: `In-Bound Delivery No :- ${deliveryNumber}`,
    });
    return {
      "@odata.context": "$metadata#Collection(Result)",
      value: results,
    };
  });
};

async function fetchAndStoreASNHead() {
  let skip = 0;
  const batchSize = 1000;

  try {
    const db = await cds.connect.to("ZP_MM_ASNPOHEAD_BND");

    const { client, database } = await getConnection();
    const collection = database.collection("ZP_MM_ASNPOHEAD");

    // Create index for Ebeln field
    await collection.createIndex({ Ebeln: 1 }, { unique: true });

    // Bulk update operations
    const bulkOps = [];

    while (true) {
      // Fetch ASN Head data in batches
      const asnHeadData = await db.run(
        `ZP_MM_ASNPOHEAD?$top=${batchSize}&$skip=${skip}`
      );

      if (!asnHeadData || asnHeadData.length === 0) {
        break;
      }

      // Process and prepare bulk operations
      for (let asn of asnHeadData) {
        const ebeln = String(asn.Ebeln).trim();
        const Amount = new Decimal128(asn.Amount);
        const Bedat = convertSAPDate(asn.Bedat);
        const Delete_mc = Boolean(asn.Delete_mc);
        const Update_mc = Boolean(asn.Update_mc);
        const to_poasnitem_oc = Boolean(asn.to_poasnitem_oc);

        bulkOps.push({
          updateOne: {
            filter: { Ebeln: ebeln },
            update: {
              $set: {
                ...asn,
                Ebeln: ebeln,
                Amount,
                Bedat,
                Delete_mc,
                Update_mc,
                to_poasnitem_oc,
              },
            },
            upsert: true,
          },
        });
      }

      // Perform bulk write operation when the batch reaches 100 operations
      if (bulkOps.length >= 100) {
        await collection.bulkWrite(bulkOps);
        bulkOps.length = 0; // Clear the array for next batch
      }

      skip += batchSize; // Increment skip to fetch next set of records
    }

    // Perform any remaining bulk operations
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error(`[ERROR] Failed to fetch ASN HEAD Data:`, error.message);
    // Log the error to your logging system (if needed)
    await logFetch("ZP_MM_ASNPOHEAD", "FAILED", error.message);
  }
}

async function fetchAndStoreASNItem() {
  let skip = 0;
  const batchSize = 1000;

  try {
    const db = await cds.connect.to("ZP_MM_ASNPOHEAD_BND");

    const { client, database } = await getConnection();
    const collection = database.collection("ZP_MM_ASNPOITEM");

    // Create index for Ebeln and Ebelp (item number)
    await collection.createIndex({ Ebeln: 1, Ebelp: 1 }, { unique: true });

    const bulkOps = [];

    while (true) {
      // Fetch ASN Item data in batches
      const asnItemData = await db.run(
        `ZP_MM_ASNPOITEM?$top=${batchSize}&$skip=${skip}`
      );

      if (!asnItemData || asnItemData.length === 0) {
        break; // Exit loop when no more records are found
      }

      // Process and prepare bulk operations
      for (let asnItem of asnItemData) {
        const ebeln = String(asnItem.Ebeln).trim();
        const ebelp = String(asnItem.Ebelp).trim();
        const Delete_mc = Boolean(asnItem.Delete_mc);
        const Update_mc = Boolean(asnItem.Update_mc);
        const to_shipheaddet_oc = Boolean(asnItem.to_shipheaddet_oc);
        const Discount = new Decimal128(asnItem.Discount);
        const Menge = new Decimal128(asnItem.Menge);
        const Pendingqty = new Decimal128(asnItem.Pendingqty);
        const Deliveryqty = new Decimal128(asnItem.Deliveryqty);
        const Taxper = new Decimal128(asnItem.Taxper);
        const Taxval = new Decimal128(asnItem.Taxval);
        const Rate = new Decimal128(asnItem.Rate);
        const Total = new Decimal128(asnItem.Total);
        const Netpr = new Decimal128(asnItem.Netpr);
        const Netwr = new Decimal128(asnItem.Netwr);
        bulkOps.push({
          updateOne: {
            filter: { Ebeln: ebeln, Ebelp: ebelp },
            update: {
              $set: {
                ...asnItem,
                Ebeln: ebeln,
                Ebelp: ebelp,
                Delete_mc,
                Update_mc,
                to_shipheaddet_oc,
                Menge,
                Pendingqty,
                Deliveryqty,
                Taxper,
                Taxval,
                Rate,
                Total,
                Netpr,
                Netwr,
                Discount,
              },
            },
            upsert: true,
          },
        });
      }

      // Perform bulk write operation when the batch reaches 100 operations
      if (bulkOps.length >= 100) {
        await collection.bulkWrite(bulkOps);
        bulkOps.length = 0; // Clear the array for next batch
      }

      skip += batchSize; // Increment skip to fetch next set of records
    }

    // Perform any remaining bulk operations
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error(`[ERROR] Failed to fetch ASN ITEM Data:`, error.message);
  }
}

async function fetchAndStoreSHIPHEAD() {
  let skip = 0;
  const batchSize = 1000;

  try {
    const db = await cds.connect.to("ZP_MM_ASNPOHEAD_BND");

    const { client, database } = await getConnection();
    const collection = database.collection("ZP_MM_SHIPHEAD");

    // Create index for Vbeln (Delivery Number)
    await collection.createIndex({ Vbeln: 1 }, { unique: true });

    // Bulk update operations
    const bulkOps = [];

    while (true) {
      // Fetch SHIPHEAD data in batches
      const shipHeadData = await db.run(
        `ZP_MM_SHIPHEAD?$top=${batchSize}&$skip=${skip}`
      );

      if (!shipHeadData || shipHeadData.length === 0) {
        break; // Exit loop when no more records are found
      }

      // Process and prepare bulk operations
      for (let ship of shipHeadData) {
        const vbeln = String(ship.Vbeln).trim();
        const Delete_mc = Boolean(ship.Delete_mc);
        const Update_mc = Boolean(ship.Update_mc);
        const Wadat = convertSAPDate(ship.Wadat);
        const Tddat = convertSAPDate(ship.Tddat);
        const Lfdat = convertSAPDate(ship.Lfdat);
        const Deliverydate = convertSAPDate(ship.Deliverydate);
        const Eindt = convertSAPDate(ship.Eindt);
        const Erdat = convertSAPDate(ship.Erdat);
        const Menge = new Decimal128(ship.Menge);
        const Dabmg = new Decimal128(ship.Dabmg);
        const Mahnz = new Decimal128(ship.Mahnz);
        const xcwmxmenge = new Decimal128(ship.xcwmxmenge);
        const xcwmxdabmg = new Decimal128(ship.xcwmxdabmg);
        const ExpectedValue = new Decimal128(ship.ExpectedValue);
        const FshSallocQty = new Decimal128(ship.FshSallocQty);
        const Netwr = new Decimal128(ship.Netwr);
        const Akkur = new Decimal128(ship.Akkur);
        const Akprz = new Decimal128(ship.Akprz);
        const xbev1xrpfaess = new Decimal128(ship.xbev1xrpfaess);
        const xbev1xrpkist = new Decimal128(ship.xbev1xrpkist);
        const xbev1xrpcont = new Decimal128(ship.xbev1xrpcont);
        const xbev1xrpsonst = new Decimal128(ship.xbev1xrpsonst);
        const Handoverdate = convertSAPDate(ship.Handoverdate);
        const Startdate = convertSAPDate(ship.Startdate);
        const Enddate = convertSAPDate(ship.Enddate);
        const Dataaging = convertSAPDate(ship.Dataaging);
        const Lddat = convertSAPDate(ship.Lddat);
        const Kodat = convertSAPDate(ship.Kodat);
        const Cmfre = convertSAPDate(ship.Cmfre);
        const Cmngv = convertSAPDate(ship.Cmngv);
        const Bldat = convertSAPDate(ship.Bldat);
        const WadatIst = convertSAPDate(ship.WadatIst);
        const Podat = convertSAPDate(ship.Podat);

        bulkOps.push({
          updateOne: {
            filter: { Vbeln: vbeln },
            update: {
              $set: {
                ...ship,
                Vbeln: vbeln,
                Delete_mc,
                Update_mc,
                Wadat,
                Tddat,
                Lfdat,
                Deliverydate,
                Eindt,
                Erdat,
                Menge,
                Dabmg,
                Mahnz,
                xcwmxmenge,
                xcwmxdabmg,
                ExpectedValue,
                FshSallocQty,
                Netwr,
                Akkur,
                Akprz,
                xbev1xrpfaess,
                xbev1xrpkist,
                xbev1xrpcont,
                xbev1xrpsonst,
                Handoverdate,
                Startdate,
                Enddate,
                Dataaging,
                Lddat,
                Kodat,
                Cmfre,
                Cmngv,
                Bldat,
                WadatIst,
                Podat,
              },
            },
            upsert: true,
          },
        });
      }

      // Perform bulk write operation when the batch reaches 100 operations
      if (bulkOps.length >= 100) {
        await collection.bulkWrite(bulkOps);
        bulkOps.length = 0; // Clear the array for next batch
      }

      skip += batchSize; // Increment skip to fetch next set of records
    }

    // Perform any remaining bulk operations
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error(`[ERROR] Failed to fetch SHIPHEAD Data:`, error.message);
    // Log the error to your logging system (if needed)
    await logFetch("ZP_MM_SHIPHEAD", "FAILED", error.message);
  }
}

cron.schedule("*/5 * * * *", async () => {
  await fetchAndStoreASNItem();
  await fetchAndStoreASNHead();
  await fetchAndStoreSHIPHEAD();
});
