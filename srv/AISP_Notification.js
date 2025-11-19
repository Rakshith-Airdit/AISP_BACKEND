const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");
const { v4: uuidv4 } = require("uuid");
const { buildQuery } = require("./mongo-query-builder");


// ------------------------- SUPPLIER API CALLS -------------------------
async function getSupplierDetails(ConERP) {
  try {
    const path = "/API_BUSINESS_PARTNER/A_BusinessPartner";
    console.log("📌 Calling S/4 BP API:", path);

    const bpResult = await ConERP.send({
      method: "GET",
      path,
      headers: {
        Accept: "application/json",
        "sap-client": "200",
      },
    });

    return bpResult;
  } catch (err) {
    console.error("❌ Supplier API Error:", err.message);
    throw new Error(`S/4 API Failed → ${err.message || "Unknown Error"}`);
  }
}

async function getSupplierEmailList(ConERP) {
  try {
    const path ="/API_BUSINESS_PARTNER/A_AddressEmailAddress";
    console.log("📌 Calling S/4 Email API:", path);

    const response = await ConERP.send({
      method: "GET",
      path,
      headers: {
        Accept: "application/json",
        "sap-client": "200",
      },
    });

    return response;
  } catch (err) {
    console.error("❌ Email API Failed:", err.message);
    throw new Error(`Email API Failed → ${err.message}`);
  }
}



// ----------------------------------------------------------------------
module.exports = async function (srv) {

  // ------------------------- READ NOTIFICATION -------------------------
  srv.on("READ", "Notification", async (req) => {
    try {
      const { database } = await getConnection();
      const reqNotificationCollection = database.collection("AISP_NOTIFICATION");

      let key =
        req.data.NotificationID ||
        (req.params?.[0] ? req.params[0].NotificationID : undefined);

      if (key) {
        const result = await reqNotificationCollection.findOne({
          NotificationID: key,
        });
        if (!result) return req.reject(404, `Notification with ID ${key} not found`);
        return result;
      }

      const filters = req.query?.SELECT?.where || [];
      let query = {};

      for (let i = 0; i < filters.length; i += 4) {
        if (filters[i]?.ref && filters[i + 2]?.val !== undefined) {
          query[filters[i].ref[0]] = filters[i + 2].val;
        }
      }

      const notificationData = await reqNotificationCollection.find(query).toArray();
      notificationData["$count"] = notificationData.length;

      return notificationData;
    } catch (err) {
      console.error("Error reading Notifications:", err);
      return req.reject(500, "Failed to read notifications due to server error");
    }
  });


  // ------------------------- CREATE -------------------------
  srv.on("CREATE", "Notification", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("AISP_NOTIFICATION");

      const count = await collection.countDocuments();
      const nextID = 201 + count;

      const notification = {
        NotificationID: nextID,
        NotificationType: req.data.NotificationType || "",
        Title: req.data.Title || "",
        Body: req.data.Body || "",
        Priority: req.data.Priority || "Low",
        Mail: !!req.data.Mail,
        Schedule: !!req.data.Schedule,
        ValidFrom: req.data.ValidFrom || null,
        ValidTo: req.data.ValidTo || null,
        DateTime: new Date().toISOString(),
        Status: req.data.Status || "Draft",
      };

      await collection.insertOne(notification);
      return notification;

    } catch (err) {
      console.error("Error creating Notification:", err);
      return req.reject(500, "Failed to create notification");
    }
  });



  // ------------------------- UPDATE -------------------------
  srv.on("UPDATE", "Notification", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("AISP_NOTIFICATION");

      const key =
        req.data.NotificationID || req.params?.[0]?.NotificationID;
      if (!key) return req.reject(400, "Missing NotificationID");

      const existing = await collection.findOne({ NotificationID: key });
      if (!existing) return req.reject(404, `Notification ${key} not found`);

      if (existing?.Status === "Sent") {
        return req.reject(409, `Cannot edit Notification ${key}. Already Sent.`);
      }

      const updateFields = {
        NotificationType: req.data.NotificationType || existing.NotificationType,
        Title: req.data.Title || existing.Title,
        Body: req.data.Body || existing.Body,
        Priority: req.data.Priority || existing.Priority,
        Mail: !!req.data.Mail,
        Schedule: !!req.data.Schedule,
        ValidFrom: req.data.ValidFrom || existing.ValidFrom,
        ValidTo: req.data.ValidTo || existing.ValidTo,
        Status: req.data.Status || existing.Status,
        DateTime: new Date().toISOString(),
      };

      await collection.updateOne({ NotificationID: key }, { $set: updateFields });
      return { NotificationID: key, ...updateFields };

    } catch (err) {
      console.error("Error updating Notification:", err);
      return req.reject(500, "Failed to update notification");
    }
  });



  // ------------------------- DELETE -------------------------
  srv.on("DELETE", "Notification", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("AISP_NOTIFICATION");

      const key = req.data.NotificationID;
      if (!key) return req.reject(400, "Missing NotificationID");

      const result = await collection.deleteOne({ NotificationID: key });
      if (!result.deletedCount) return req.reject(404, `Notification ${key} not found`);

      return { message: `Notification ${key} deleted successfully` };

    } catch (err) {
      console.error("Error deleting Notification:", err);
      return req.reject(500, "Failed to delete notification");
    }
  });





  // ------------------------- SUPPLIER DETAILS -------------------------
srv.on('READ', 'SupplierDetails', async (req) => {
  try {
    const ConERP = await cds.connect.to("AIRDIT_HANA_S4P_CC");

    // Business partners with address expand
    const bpResult = await ConERP.send({
      method: "GET",
      path: "/API_BUSINESS_PARTNER/A_BusinessPartner?$expand=to_BusinessPartnerAddress&$top=2000",
      headers: { Accept: "application/json", "sap-client": "200" }
    });

    const suppliers = bpResult?.d?.results || [];

    // Emails
    const emailResult = await ConERP.send({
      method: "GET",
      path: "/API_BUSINESS_PARTNER/A_AddressEmailAddress?$top=2000",
      headers: { Accept: "application/json", "sap-client": "200" }
    });

    const emails = emailResult?.d?.results || [];

    // Build map: AddressID → Email
    const emailMap = {};
    for (const e of emails) {
      if (e.AddressID && e.EmailAddress) {
        emailMap[e.AddressID] = e.EmailAddress;
      }
    }

    

    // Merge suppliers with emails
    const finalList = suppliers.map(s => {
      const addr = s.to_BusinessPartnerAddress?.results?.[0];
      const email = addr ? emailMap[addr.AddressID] : "";
      const country = addr?.Country || "IN";
      
      
      return {
        SUPPLIER_CODE: s.BusinessPartner,
        SupplierName: s.BusinessPartnerName,
        Email: email || "upasana2993@outlook.com",
        Country: country
      };
    });
    
    return finalList;

  } catch (error) {
    console.error("❌ SupplierDetails Error:", error);
    req.error(500, "Failed to fetch Supplier Details: " + error.message);
  }
});


};
