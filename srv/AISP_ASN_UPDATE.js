// const cds = require('@sap/cds');

// module.exports = async (srv) =>
// {
//     // Using CDS API
//     const ZP_AISP_ASNUPDATE_HEAD_BND = await cds.connect.to("ZP_AISP_ASNUPDATE_HEAD_BND");
//       srv.on('READ', 'SAP__Currencies', req => ZP_AISP_ASNUPDATE_HEAD_BND.run(req.query));
//       srv.on('READ', 'SAP__UnitsOfMeasure', req => ZP_AISP_ASNUPDATE_HEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_AISP_ASNUPDATE_HEAD', req => ZP_AISP_ASNUPDATE_HEAD_BND.run(req.query));
//       srv.on('READ', 'ZP_AISP_ASNUPDATE_ITEM', req => ZP_AISP_ASNUPDATE_HEAD_BND.run(req.query));
// }

//------------------------------------------------

const cron = require("node-cron");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { getConnection } = require("./Library/DBConn");
const { mongoRead } = require("./Library/helper");

// ✅ CAPM Service Definition
module.exports = async (srv) => {
  // Connect to OData Service
  const ZP_AISP_ASNUPDATE_HEAD_BND = await cds.connect.to(
    "ZP_AISP_ASNUPDATE_HEAD_BND"
  );

  srv.on("READ", "ZP_AISP_ASNUPDATE_ITEM", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_AISP_ASNUPDATE_ITEM");

    try {
      const data = await mongoRead("ZP_AISP_ASNUPDATE_ITEM", req, []);
      return data;
    } catch (error) {
      console.error("Error reading data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "ZP_AISP_ASNUPDATE_HEAD", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_AISP_ASNUPDATE_HEAD");

    try {
      const data = await mongoRead("ZP_AISP_ASNUPDATE_HEAD", req, []);
      return data;
    } catch (err) {
      console.error("Error reading data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  srv.on("READ", "ASN_UPDATE_HEAD", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("ZP_AISP_ASNUPDATE_HEAD");

    try {
      const data = await mongoRead("ZP_AISP_ASNUPDATE_HEAD", req, []);
      return data;
    } catch (error) {
      console.error("Error reading data:", err);
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

  srv.on("updateASN", async (req) => {
    const { client, database } = await getConnection();

    const asnItems = req.data.asnItems;
    const asnHead = req.data.asnHead;
    // const headerCollection = database.collection("ZP_AISP_ASNUPDATE_HEAD");
    const ShipmentAndTransportCol = database.collection(
      "ZP_ASN_SHIPMENT_TRANSPORT_DATA"
    );

    const boundary = `batch_${Date.now()}`;
    const changeset = `changeset_${Date.now()}_put`;

    let body = `--${boundary}\r\nContent-Type: multipart/mixed; boundary=${changeset}\r\n\r\n`;

    asnItems.forEach((item) => {
      const {
        Ebeln,
        Vbeln,
        Ebelp,
        posnr,
        Ebtyp,
        Deliverydate,
        Menge,
        wbsta,
        matnr,
        meins,
        POquantity,
      } = item;

      const customDate = new Date(Deliverydate);
      const timestamp = customDate.getTime();
      const formattedDeliveryDate = `/Date(${timestamp})/`;

      body += `--${changeset}\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\n`;
      body += `PUT ZP_AISP_ASNUPDATE_ITEM(Ebeln='${Ebeln}',Vbeln='${Vbeln}',Ebelp='${Ebelp}') HTTP/1.1\r\nContent-Type: application/json\r\n\r\n`;
      body += `{
      "Ebeln" : "${Ebeln}",
      "Vbeln" : "${Vbeln}",
      "Ebelp" : "${Ebelp}",
      "posnr" : "${posnr}",
      "Ebtyp" : "${Ebtyp}",
      "Deliverydate" : "${formattedDeliveryDate}",
      "POquantity" :"${POquantity}",
      "Menge" : "${Menge}",
      "wbsta" : "${wbsta}",
      "matnr" : "${matnr}",
      "meins" : "${meins}"
    }\r\n`;
    });

    body += `--${changeset}--\r\n`;
    body += `--${boundary}--`;

    const baseURL =
      "http://airdithanaprd.airditsoftware.com:8010/sap/opu/odata/sap/ZP_AISP_ASNUPDATE_HEAD_BND";
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

      csrfToken = csrfResponse.headers.get("x-csrf-token");
      const cookies = csrfResponse.headers.get("set-cookie");
      cookieHeader = cookies
        ? cookies
            .split(",")
            .map((c) => c.trim())
            .join("; ")
        : "";

      if (!csrfToken) throw new Error("CSRF Token missing.");
    } catch (err) {
      return { error: "Failed to fetch CSRF token: " + err.message };
    }

    const sapResponse = await fetch(`${baseURL}/$batch`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": `multipart/mixed; boundary=${boundary}`,
        "X-CSRF-Token": csrfToken,
        Cookie: cookieHeader,
      },
      body: body,
    });

    const responseText = await sapResponse.text();
    console.log(" SAP Response:\n", responseText);

    const vbeln = asnItems[0].Vbeln;

    const results = [];
    const parts = responseText.split(`--${changeset}`);

    for (const part of parts) {
      if (part.includes("HTTP/1.1 204 No Content")) {
        const msgMatch = part.match(/<message[^>]*>(.*?)<\/message>/);
        if (msgMatch) {
          results.push(`SAP Error: ${msgMatch[1]}`);
        } else {
          results.push("Success: ASN item updated.");
        }
      } else if (part.includes("HTTP/1.1 4")) {
        results.push(" Client error (4xx)");
      } else if (part.includes("HTTP/1.1 5")) {
        results.push(" Server error (5xx)");
      }
    }

    const headerData = asnHead[0]?.ShipmentDetails[0];
    const transportData = asnHead[0]?.TransportDetails[0];

    // let trackingID = cds.utils.uuid();

    // const result = await headerCollection.updateOne(
    //   { Ebeln: asnItems[0].Ebeln, Vbeln: asnItems[0].Vbeln },
    //   {
    //     $set: {
    //       ShipmentDetails: {
    //         trackingNumber: headerData?.trackingNumber,
    //         // trackingNumber: trackingID,
    //         originLocation: headerData?.originLocation,
    //         destinationLocation: headerData?.destinationLocation,
    //         scheduledShipmentDate: new Date(headerData?.scheduledShipmentDate),
    //         expectedDeliveryDate: new Date(headerData?.expectedDeliveryDate),
    //         ShipmentWeight: headerData?.ShipmentWeight
    //       },
    //       TransportDetails: {
    //         carrierName: transportData?.carrierName,
    //         transportMode: transportData?.transportMode,
    //         driverName: transportData?.driverName,
    //         driverWhatsappNumber: transportData?.driverWhatsappNumber,
    //         vehicleNumber: transportData?.vehicleNumber
    //       }
    //     }
    //   }
    // );

    // Build the document to insert
    const doc = {
      Ebeln: asnItems?.[0]?.Ebeln,
      Vbeln: vbeln || null,
      ShipmentDetails: {
        trackingNumber: headerData?.trackingNumber,
        originLocation: headerData?.originLocation,
        destinationLocation: headerData?.destinationLocation,
        scheduledShipmentDate: headerData?.scheduledShipmentDate
          ? new Date(headerData.scheduledShipmentDate)
          : undefined,
        expectedDeliveryDate: headerData?.expectedDeliveryDate
          ? new Date(headerData.expectedDeliveryDate)
          : undefined,
        ShipmentWeight: headerData?.ShipmentWeight,
      },
      TransportDetails: {
        carrierName: transportData?.carrierName,
        transportMode: transportData?.transportMode,
        driverName: transportData?.driverName,
        driverWhatsappNumber: transportData?.driverWhatsappNumber,
        vehicleNumber: transportData?.vehicleNumber,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ShipmentAndTransportCol.updateOne(
      { Ebeln: asnItems[0].Ebeln },
      { $set: doc },
      { upsert: true }
    );

    if (!result.upsertedCount > 0 && !result.modifiedCount > 0) {
      return {
        status: "Failure",
        rawResponse: `Document with Ebeln: ${asnItems[0].Ebeln} was found but not modified (data may be identical)`,
      };
    }

    if (result.modifiedCount === 0) {
      return {
        status: "Failure",
        rawResponse: `Document with Ebeln: ${asnItems[0].Ebeln} was found but not modified (data may be identical)`,
      };
    }

    return {
      value: results.map((msg) => {
        const match = msg.match(/ASN\s+.*Successfully/i);
        return match ? match[0] : msg;
      }),
    };
  });

  // DELETE ASN Handler working dynamically delete from DB as well.
  srv.on("DeleteASN", async (req) => {
    const items = req.data.asnItems;
    const results = [];

    const baseURL =
      "http://airdithanaprd.airditsoftware.com:8010/sap/opu/odata/sap/ZP_AISP_ASNUPDATE_HEAD_BND";
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

      csrfToken = csrfResponse.headers.get("x-csrf-token");
      const cookies = csrfResponse.headers.get("set-cookie");
      cookieHeader = cookies
        ? cookies
            .split(",")
            .map((c) => c.trim())
            .join("; ")
        : "";

      if (!csrfToken) throw new Error("CSRF Token missing.");
    } catch (err) {
      return { error: "Failed to fetch CSRF token: " + err.message };
    }

    const { client, database } = await getConnection();
    const itemCollection = database.collection("ZP_AISP_ASNUPDATE_ITEM");
    const headCollection = database.collection("ZP_AISP_ASNUPDATE_HEAD");

    const headKeysToCheck = new Set();

    for (const { Ebeln, Vbeln, Ebelp } of items) {
      const deleteURL = `${baseURL}/ZP_AISP_ASNUPDATE_ITEM(Ebeln='${Ebeln}',Vbeln='${Vbeln}',Ebelp='${Ebelp}')`;

      try {
        const deleteResponse = await fetch(deleteURL, {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${auth}`,
            "X-CSRF-Token": csrfToken,
            Cookie: cookieHeader,
          },
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          results.push(
            ` Failed to delete ${Ebeln}/${Vbeln}/${Ebelp}: ${errorText}`
          );
        } else {
          await itemCollection.deleteOne({ Ebeln, Vbeln, Ebelp });
          results.push(`Deleted ASN Item: ${Ebeln}/${Vbeln}/${Ebelp}`);
          headKeysToCheck.add(`${Ebeln}|${Vbeln}`);
        }
      } catch (err) {
        results.push(
          ` Error deleting ${Ebeln}/${Vbeln}/${Ebelp}: ${err.message}`
        );
      }
    }

    // After item deletions, check which heads should be deleted
    for (const key of headKeysToCheck) {
      const [Ebeln, Vbeln] = key.split("|");

      const remainingItems = await itemCollection.countDocuments({
        Ebeln,
        Vbeln,
      });

      if (remainingItems === 0) {
        await headCollection.deleteOne({ Ebeln, Vbeln });
        results.push(
          ` Deleted ASN Head: ${Ebeln}/${Vbeln} (all items removed)`
        );
      } else {
        results.push(
          `Kept ASN Head: ${Ebeln}/${Vbeln} (still has ${remainingItems} item(s))`
        );
      }
    }

    return results;
  });
};

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

// Boolean Conversion (for fields like confirm_ac, Delete_mc, etc.)
function convertToBoolean(fieldValue) {
  return fieldValue === "true" || fieldValue === true;
}

// Function to Fetch ASN Update Head Data from API
async function fetchASNUpdateHead() {
  let skip = 0;
  const batchSize = 1000;
  let allRecords = [];

  try {
    const db = await cds.connect.to("ZP_AISP_ASNUPDATE_HEAD_BND");

    while (true) {
      const asnUpdateHeadData = await db.run(
        `ZP_AISP_ASNUPDATE_HEAD?$top=${batchSize}&$skip=${skip}`
      );

      if (!asnUpdateHeadData || asnUpdateHeadData.length === 0) {
        break;
      }

      allRecords = allRecords.concat(asnUpdateHeadData);

      skip += batchSize;
    }

    return allRecords;
  } catch (error) {
    console.error(
      `[ERROR] Failed to fetch ASN Update Head Data:`,
      error.message
    );
    return [];
  }
}

// Function to Fetch ASN Update Item Data from API
async function fetchASNUpdateItem() {
  let skip = 0;
  const batchSize = 1000;
  let allRecords = [];

  try {
    const db = await cds.connect.to("ZP_AISP_ASNUPDATE_HEAD_BND");

    while (true) {
      const asnUpdateItemData = await db.run(
        `ZP_AISP_ASNUPDATE_ITEM?$top=${batchSize}&$skip=${skip}`
      );

      if (!asnUpdateItemData || asnUpdateItemData.length === 0) {
        break;
      }

      allRecords = allRecords.concat(asnUpdateItemData);

      skip += batchSize;
    }

    return allRecords;
  } catch (error) {
    console.error(
      `[ERROR] Failed to fetch ASN Update Item Data:`,
      error.message
    );
    return [];
  }
}

async function storeASNUpdateHead(data) {
  const { client, database } = await getConnection();
  const collection = database.collection("ZP_AISP_ASNUPDATE_HEAD");

  const bulkOps = [];
  const fetchedKeys = new Set();

  for (const asn of data) {
    const ebeln = String(asn.Ebeln).trim();
    const vbeln = String(asn.vbeln).trim();
    const ASNamount = new Decimal128(asn.ASNamount);
    const Delete_mc = convertToBoolean(asn.Delete_mc);
    const Update_mc = convertToBoolean(asn.Update_mc);
    const to_asnupditem_oc = convertToBoolean(asn.to_asnupditem_oc);
    const Bedat = convertSAPDate(asn.Bedat);

    const key = `${ebeln}|${vbeln}`;
    fetchedKeys.add(key);

    bulkOps.push({
      updateOne: {
        filter: { Ebeln: ebeln, Vbeln: vbeln },
        update: {
          $set: {
            ...asn,
            Ebeln: ebeln,
            Vbeln: vbeln,
            GRNStatus: "Pending",
            ASNamount,
            Delete_mc,
            Update_mc,
            to_asnupditem_oc,
            Bedat,
          },
        },
        upsert: true,
      },
    });

    if (bulkOps.length >= 100) {
      await collection.bulkWrite(bulkOps);
      bulkOps.length = 0;
    }
  }

  if (bulkOps.length > 0) {
    await collection.bulkWrite(bulkOps);
  }

  // ✅ Mark old records as GRN Done
  await collection.updateMany(
    {
      $expr: {
        $not: {
          $in: [
            { $concat: ["$Ebeln", "|", "$Vbeln"] },
            Array.from(fetchedKeys),
          ],
        },
      },
    },
    { $set: { GRNStatus: "Done" } }
  );
}

//Function to Store ASN Update Item Data in MongoDB (Check for duplicates using Ebeln, Vbeln, and Ebelp)
async function storeASNUpdateItem(data) {
  const { client, database } = await getConnection();
  const collection = database.collection("ZP_AISP_ASNUPDATE_ITEM");

  const bulkOps = [];

  for (const asnItem of data) {
    const ebeln = String(asnItem.Ebeln).trim();
    const vbeln = String(asnItem.Vbeln).trim();
    const ebelp = String(asnItem.Ebelp).trim();
    const Delete_mc = convertToBoolean(asnItem.Delete_mc);
    const Update_mc = convertToBoolean(asnItem.Update_mc);
    const Kzdis = convertToBoolean(asnItem.Kzdis);
    const Imwrk = convertToBoolean(asnItem.Imwrk);
    const POquantity = new Decimal128(asnItem.POquantity);
    const Menge = new Decimal128(asnItem.Menge);
    const Amount = new Decimal128(asnItem.Amount);
    const Taxper = new Decimal128(asnItem.Taxper);
    const Taxval = new Decimal128(asnItem.Taxval);
    const Rate = new Decimal128(asnItem.Rate);
    const Discount = new Decimal128(asnItem.Discount);
    const Total = new Decimal128(asnItem.Total);
    const Dabmg = new Decimal128(asnItem.Dabmg);
    const Mahnz = new Decimal128(asnItem.Mahnz);
    const xcwmxmenge = new Decimal128(asnItem.xcwmxmenge);
    const xcwmxdabmg = new Decimal128(asnItem.xcwmxdabmg);
    const ExpectedValue = new Decimal128(asnItem.ExpectedValue);
    const FshSallocQty = new Decimal128(asnItem.FshSallocQty);
    const Ormng = new Decimal128(asnItem.Ormng);
    const Handoverdate = convertSAPDate(asnItem.Handoverdate);
    const Startdate = convertSAPDate(asnItem.Startdate);
    const Enddate = convertSAPDate(asnItem.Enddate);
    const Dataaging = convertSAPDate(asnItem.Dataaging);
    // Prepare bulk operations to insert or replace (check duplicates based on Ebeln, Vbeln, and Ebelp)
    bulkOps.push({
      updateOne: {
        filter: { Ebeln: ebeln, Vbeln: vbeln, Ebelp: ebelp },
        update: {
          $set: {
            ...asnItem,
            Ebeln: ebeln,
            Vbeln: vbeln,
            Ebelp: ebelp,
            Delete_mc,
            Update_mc,
            Kzdis,
            Imwrk,
            POquantity,
            Menge,
            Amount,
            Taxper,
            Taxval,
            Rate,
            Discount,
            Total,
            Dabmg,
            Mahnz,
            xcwmxmenge,
            xcwmxdabmg,
            ExpectedValue,
            FshSallocQty,
            Ormng,
            Handoverdate,
            Startdate,
            Enddate,
            Dataaging,
          },
        },
        upsert: true,
      },
    });

    if (bulkOps.length >= 100) {
      await collection.bulkWrite(bulkOps);
      bulkOps.length = 0; // Clear the array for next batch
    }
  }

  if (bulkOps.length > 0) {
    await collection.bulkWrite(bulkOps); // Perform remaining updates
  }
}

//Cron job to run every second and fetch and store ASN data
cron.schedule("*/15 * * * *", async () => {
  // Fetch ASN Update Head and Item data from the API
  const asnUpdateHeadData = await fetchASNUpdateHead();
  const asnUpdateItemData = await fetchASNUpdateItem();

  // Store ASN Update Head and Item data in MongoDB
  if (asnUpdateHeadData.length > 0) {
    await storeASNUpdateHead(asnUpdateHeadData);
  }
  if (asnUpdateItemData.length > 0) {
    await storeASNUpdateItem(asnUpdateItemData);
  }
});
