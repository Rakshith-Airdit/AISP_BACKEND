const cds = require("@sap/cds");
const axios = require('axios');
const { getConnection } = require("./Library/DBConn");
const { v4: uuidv4 } = require("uuid");
const { buildQuery } = require("./mongo-query-builder");
const { getAllDestinationsFromDestinationService } = require("@sap-cloud-sdk/connectivity");
//const EmailService = require("./Library/Email");
//const EmailTemplate = require("./Library/NotificationEmailTemplate")


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



async function buildMongoFilter(whereClause, req) {
    let query = {};

    for (let i = 0; i < whereClause.length; i++) {
        const clause = whereClause[i];

        if (clause.xpr) {
            const parts = flattenXpr(clause.xpr);
            for (let i = 0; i < parts.length; i += 4) {
                const left = parts[i];
                const op = parts[i + 1];
                const right = parts[i + 2];
                
                if (left.ref && op === "=" && right.val != null) {
                    query[left.ref[0]] = right.val; // Equal to
                } else if (left.ref && (op === "!=" || op === "NE") && right.val != null) {
                    query[left.ref[0]] = { $ne: right.val };  // Not equal to
                } else if (left.func && op === "<" && right.val != null) {
                    query[left.ref[0]] = { $lt: right.val }; // Less than
                } else if (left.ref && op === "<=" && right.val != null) {
                    query[left.ref[0]] = { $lte: right.val }; // Less than or equal to
                } else if (left.ref && op === ">" && right.val != null) {
                    query[left.ref[0]] = { $gt: right.val }; // Greater than
                } else if (left.ref && op === ">=" && right.val != null) {
                    query[left.ref[0]] = { $gte: right.val }; // Greater than or equal to
                }
            }
        } else if (clause.ref) {
            const field = clause.ref[0];
            const operator = whereClause[i + 1];
            const value = whereClause[i + 2].val;

            // Handle "equal" and "not equal" cases explicitly
            if (operator === "=") {
                query[field] = value; // Equal to
            } else if (operator === "!=" || operator === "NE") {
                query[field] = { $ne: value }; // Not equal to
            } else if (operator === "<") {
                query[field] = { $lt: value }; // Less than
            } else if (operator === "<=") {
                query[field] = { $lte: value }; // Less than or equal to
            } else if (operator === ">") {
                query[field] = { $gt: value }; // Greater than
            } else if (operator === ">=") {
                query[field] = { $gte: value }; // Greater than or equal to
            }
        } else if (clause.args && clause.func) {
            const field = clause.args[0]?.ref?.[0]; // The field name
            const value = clause.args[1]?.val; // The value to compare

            if (!field) return; // skip if field is undefined

            switch (clause.func.toLowerCase()) {
                case "eq":
                case "=":
                    query[field] = value;
                    break;
                case "ne":
                case "notequalto":
                    query[field] = { $ne: value }; // Not equal to
                    break;
                case "lt":
                    query[field] = { $lt: value }; // Less than
                    break;
                case "le":
                    query[field] = { $lte: value }; // Less than or equal to
                    break;
                case "gt":
                    query[field] = { $gt: value }; // Greater than
                    break;
                case "ge":
                    query[field] = { $gte: value }; // Greater than or equal to
                    break;
                default:
                    query[field] = value; // Fallback: exact match
            }
        }
    }

    // Return the final MongoDB query object
    return query;
}



// ----------------------------------------------------------------------
module.exports = async function (srv) {
  const { Notification } = srv.entities;
  // ------------------------- READ NOTIFICATION -------------------------
srv.on("READ", "Notification", async (req) => {
  try {
    const { database } = await getConnection();
    const reqNotificationCollection = database.collection("AISP_NOTIFICATION");

    // Handle specific notification by ID if provided
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

    // Parse the filters from the request query
    const filters = req.query?.SELECT?.where || [];
    let query = {};

    // Debugging: Log the filters received
    console.log("Filters received:", filters);

    // Build MongoDB query based on the filters using your buildMongoFilter function
    query = await buildMongoFilter(filters, req); // Pass req to buildMongoFilter

    // Debugging: Log the MongoDB query
    console.log("MongoDB query:", query);

    // Perform the MongoDB query and fetch the results
    const notificationData = await reqNotificationCollection.find(query).toArray();
    notificationData["$count"] = notificationData.length; // Add count to the response

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

//After creating send email
// ------------------------- AFTER CREATE → SEND NOTIFICATION EMAIL -------------------------
srv.after("CREATE", "Notification", async (data, req) => {
  try {
    console.log("📨 Notification created → Sending Email...");

    // ---------------- HARD CODED EMAILS ----------------
    const senderEmail = "no-reply@airditsoftware.com";
    const recipientEmail = "updates@airditinfra.com"; 
    //---------------------------------------------------

    // Pick template based on NotificationType
    const templateFunction = EmailTemplate[data.NotificationType];

    if (!templateFunction) {
      console.error("❌ No template found for:", data.NotificationType);
      return;
    }

    // Build HTML from template
    const htmlBody = templateFunction({
      Title: data.Title,
      Body: data.Body,
      Priority: data.Priority,
      ValidFrom: data.ValidFrom,
      ValidTo: data.ValidTo
    });

    // Email subject
    const subject = `📢 ${data.NotificationType}: ${data.Title}`;

    // SEND EMAIL
    const result = await EmailService.sendEmail(
      recipientEmail,     // To
      "",                 // CC
      "html",             // Type
      subject,            // Subject
      htmlBody,           // Email Body (HTML)
      senderEmail         // Optional → If your EmailService supports sender override
    );

    if (!result.success) {
      console.error("❌ Email Failed:", result.error);
    } else {
      console.log("📨 Email Sent Successfully:", result.mailres);
    }

  } catch (err) {
    console.error("❌ Error in Notification After-Create Email:", err);
  }
});



//   // ------------------------- SUPPLIER DETAILS -------------------------
// srv.on('READ', 'SupplierDetails', async (req) => {
//   try {
//     const ConERP = await cds.connect.to("AIRDIT_HANA_S4P_CC");

//     // Business partners with address expand
//     const bpResult = await ConERP.send({
//       method: "GET",
//       path: "/API_BUSINESS_PARTNER/A_BusinessPartner?$expand=to_BusinessPartnerAddress&$top=2000",
//       headers: { Accept: "application/json", "sap-client": "200" }
//     });

//     const suppliers = bpResult?.d?.results || [];

//     // Emails
//     const emailResult = await ConERP.send({
//       method: "GET",
//       path: "/API_BUSINESS_PARTNER/A_AddressEmailAddress?$top=2000",
//       headers: { Accept: "application/json", "sap-client": "200" }
//     });

//     const emails = emailResult?.d?.results || [];

//     // Build map: AddressID → Email
//     const emailMap = {};
//     for (const e of emails) {
//       if (e.AddressID && e.EmailAddress) {
//         emailMap[e.AddressID] = e.EmailAddress;
//       }
//     }

    

//     // Merge suppliers with emails
//     const finalList = suppliers.map(s => {
//       const addr = s.to_BusinessPartnerAddress?.results?.[0];
//       const email = addr ? emailMap[addr.AddressID] : "";
//       const country = addr?.Country || "IN";
      
      
//       return {
//         SUPPLIER_CODE: s.BusinessPartner,
//         SupplierName: s.BusinessPartnerName,
//         Email: email || "upasana2993@outlook.com",
//         Country: country
//       };
//     });
    
//     return finalList;

//   } catch (error) {
//     console.error("❌ SupplierDetails Error:", error);
//     req.error(500, "Failed to fetch Supplier Details: " + error.message);
//   }
// });

srv.on("CREATE", "SendEmail", async (req) => {
    console.log("action called");
    const { Email, Title, NotificationType, SupplierName, Body } = req.data;

    let data = JSON.stringify({
        "event_id": "69204f70e20520c8f65d4970",
        "payload": {
            "receiver": Email,
            "title": Title,
            "Notification Type": NotificationType,
            "SupplierName": SupplierName,
            "body": Body
        }
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://airdit-software-services-private-limite-airdit-190920232a7ee4d6.cfapps.ap10.hana.ondemand.com/trigger',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic QUlSRElUOkFpcmRpdEAxMjM='
        },
        data: data
    };

    try {
        // Await the API call
        const response = await axios.request(config);
        console.log('External API call successful. Response data:', response.data);

        // Return a structured object instead of a string
        return {
            message: "Notification Sent Successfully",
            statusCode: response.status
        };

    } catch (error) {
        console.error('Error during external API call for Email notification:', error.message);
        req.error(500, `Failed to send Email notification: ${error.message}`);
    }
})

// Notify through Whatsapp
// srv.on("CREATE", "SendWhatsapp", async (req) => {
//     console.log("action called");
//     const { Whatsapp, Title, NotificationType, SupplierName, Body } = req.data;

   

//     let config = {
//   method: 'get',
//   maxBodyLength: Infinity,
//   url: 'http://localhost:3000/send?number=919696395459&msg=hiii',
//   headers: { }
// };

// axios.request(config)
// .then((response) => {
//   console.log(JSON.stringify(response.data));
// })
// .catch((error) => {
//   console.log(error);
// });

//     try {
//         // Await the API call
//         const response = await axios.request(config);
//         console.log('External API call successful. Response data:', response.data);

//         // Return a structured object instead of a string
//         return {
//             message: "Notification Sent via Whatsapp Successfully",
//             statusCode: response.status
//         };

//     } catch (error) {
//         console.error('Error during external API call for whatsapp notification:', error.message);
//         req.error(500, `Failed to send whatsapp notification: ${error.message}`);
//     }
// })

srv.on("CREATE", "SendWhatsapp", async (req) => {
    console.log("Action called");
    const { Whatsapp, Title, NotificationType, SupplierName, Body } = req.data;

    if (!Whatsapp || !Body) {
        return req.reject(400, "Missing required fields: Whatsapp or Body");
    }

    // Format the WhatsApp number (example: number@c.us format required for whatsapp-web.js)
    const formattedWhatsapp = `${Whatsapp}@c.us`;

    // Construct the message body
    //const messageBody = `Dear ${SupplierName}, I wish this message finds you in good health. This is a ${NotificationType} about ${Title}. To inform ${Body}. Thanks, With Regards, Airdit.`;
    const messageBody = `Dear ${SupplierName}, a new notification regarding ${NotificationType} - ${Title}. ${Body} - AIRDIT Software Services Private Limited.`
    // Prepare the API URL
    //const apiUrl = `https://frenetic-nonpopulously-barbra.ngrok-free.dev/send?number=${formattedWhatsapp}&msg=${encodeURIComponent(messageBody)}`;
    const apiUrl=`https://frenetic-nonpopulously-barbra.ngrok-free.dev/send?number=${Whatsapp}&msg=${messageBody}`
    // Setup the HTTP request configuration
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: apiUrl,
        headers: {}
    };

    try {
        // Make the external API call to send WhatsApp message
        const response = await axios.request(config);
        console.log('External API call successful. Response data:', response.data);

        // Return a structured response indicating success
        return {
            message: "Notification Sent via WhatsApp Successfully",
            statusCode: response.status
        };

    } catch (error) {
        console.error('Error during external API call for WhatsApp notification:', error.message);
        req.error(500, `Failed to send WhatsApp notification: ${error.message}`);
    }
});






};
