// const cds = require('@sap/cds');

// module.exports = async (srv) =>
// {
//     // Using CDS API
//     const ZP_AISP_PAYMNTMON_HEAD_BND = await cds.connect.to("ZP_AISP_PAYMNTMON_HEAD_BND");
//       srv.on('READ', 'ZP_AISP_PAYMENTMON_HEAD', req => ZP_AISP_PAYMNTMON_HEAD_BND.run(req.query));
// }

const cds = require("@sap/cds");
const cron = require("node-cron");
const { getConnection } = require("./Library/DBConn");
const { buildMongoQuery } = require("../srv/Library/MongoHelper");
const { mongoRead } = require("./Library/helper");

function convertSAPDate(sapDate) {
  // Ensure sapDate is not null or undefined before calling match()
  if (!sapDate) {
    return null; // Or handle this case as per your requirement
  }

  return new Date(sapDate);
}

const BATCH_SIZE = 500; // Reduced from 1000 to handle timeout issues

async function fetchAndStorePaymentMonHead() {
  let skip = 0;
  let totalProcessed = 0;

  try {
    const ZP_AISP_PAYMNTMON_HEAD_BND = await cds.connect.to(
      "ZP_AISP_PAYMNTMON_HEAD_BND"
    );

    const { database } = await getConnection();

    const collection = database.collection("PAYMENT_SES");

    // Create index
    await collection.createIndex(
      { RefinvoiceNumber: 1, purchaseOrder: 1 },
      { unique: true }
    );

    while (true) {
      try {
        const page = await ZP_AISP_PAYMNTMON_HEAD_BND.run(
          `ZP_AISP_PAYMENTMON_HEAD?$top=${BATCH_SIZE}&$skip=${skip}`
        );

        if (!page || page.length === 0) {
          console.log(
            `[INFO] No more records found. Total processed: ${totalProcessed}`
          );
          break;
        }

        // Process batch
        const bulkOps = page.map((item) => ({
          updateOne: {
            filter: {
              RefinvoiceNumber: String(item.Belnr || "").trim(),
              purchaseOrder: String(item.Ebeln || "").trim(),
            },
            update: {
              $set: {
                RefinvoiceNumber: String(item.Belnr || "").trim(),
                purchaseOrder: String(item.Ebeln || "").trim(),
                companyCode: item.Bukrs || "",
                invoiceAmount: parseInt(item.Invoiceamt) || 0,
                invoiceNumber: item.Xblnr || "",
                invoiceDate: convertSAPDate(item.Budat),
                paymentDate: convertSAPDate(item.augdt),
                paymentReferenceNumber: item.augbl || "",
                paymentStatus: item.Paymentstatus || "",
                downPaymentStatus: item.Downpymntstatus || "",
                downPaymentAmount: parseInt(item.Dpamt) || 0,
                localAmount: parseInt(item.Wrbtr) || 0,
                invoicePayee: item.Invoicepayee || "",
                supplierCode: item.Lifnr || "",
                paymentRecipientName: item.name1 || "",
                paymentRecipientEmail: item.Email || "",
                paymentRecipientAddress: item.Paymentrecpnt || "",
                SupplierOrgName: item.name1 || "",
                purchaseOrderType: item.POtype || "",
                currency: item.Waers || "",
                supplierEmail: item.Email || "",
                lastSynced: new Date(),
              },
            },
            upsert: true,
          },
        }));

        if (bulkOps.length > 0) {
          await collection.bulkWrite(bulkOps, { ordered: false });
          totalProcessed += bulkOps.length;
        }

        // Check if we've reached the end
        if (page.length < BATCH_SIZE) {
          console.log(
            `[SUCCESS] Sync completed. Total records: ${totalProcessed}`
          );
          break;
        }

        skip += BATCH_SIZE;

        // Add small delay between batches to reduce load on SAP
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (batchError) {
        console.error(
          `[ERROR] Failed to process batch (skip=${skip}):`,
          batchError.message
        );

        // If it's a timeout error, wait and retry with smaller batch
        if (batchError.statusCode === 502 || batchError.statusCode === 504) {
          console.log(
            `[INFO] Timeout detected. Waiting 5 seconds before continuing...`
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        } else {
          throw batchError; // Re-throw other errors
        }
      }
    }
  } catch (error) {
    console.error(`[ERROR] PAYMENT MON HEAD sync failed:`, error.message);
    throw error;
  }
}

// Initialize the sync
async function initializePaymentSync() {
  try {
    await fetchAndStorePaymentMonHead();

    // Schedule recurring sync
    cron.schedule("*/15 * * * *", async () => {
      try {
        await fetchAndStorePaymentMonHead();
      } catch (err) {
        console.error(`[CRON ERROR] Scheduled sync failed:`, err.message);
      }
    });
  } catch (error) {
    console.error(
      `[INIT ERROR] Failed to initialize PAYMENT MON HEAD sync:`,
      error.message
    );
  }
}

// Initialize the sync
// initializePaymentSync();

module.exports = async (srv) => {
  srv.on("GET", "PaymentStatusEntity", async (req) => {
    try {
      const { database } = await getConnection();
      const PAYMENT_STATUS = database.collection("PAYMENT_STATUS");

      const results = await PAYMENT_STATUS.find().toArray();
      return results;
    } catch (error) {
      console.error("Error fetching data from PAYMENT_STATUS:", error);
      req.error(500, "Error fetching data from PAYMENT_STATUS");
    }
  });

  srv.on("READ", "PaymentGet", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("PAYMENT_SES");

      const data = await mongoRead("PAYMENT_SES", req, []);
      return data;
    } catch (err) {
      console.error("Error reading SES Vim data:", err);
      req.error({ code: 500, message: err.message });
    }
  });

  // Helper function to format the date fields (timestamp to human-readable date)
  function formatDate(date) {
    if (typeof date === "string" && date.includes("/Date(")) {
      const timestamp = parseInt(date.replace("/Date(", "").replace(")/", ""));
      const formattedDate = new Date(timestamp);
      return formattedDate.toISOString().split("T")[0]; // Returns date in 'YYYY-MM-DD' format
    }
    return date;
  }
};
