const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");
const { v4: uuidv4 } = require("uuid");
// Import the new Query Builder
const { buildQuery } = require("./mongo-query-builder");

module.exports = async function (srv) {
  // --- READ ---
  srv.on("READ", "Notification", async (req) => {
    try {
      // 1. Get database connection
      const { database } = await getConnection();
      const reqNotificationCollection =
        database.collection("AISP_NOTIFICATION");

      // 2. Handle Single Read vs. Collection Read
      // Determine the key: Check req.data (V4 named key) or req.params (V2/simple key)
      let key =
        req.data.NotificationID ||
        (req.params?.[0] ? req.params[0].NotificationID : undefined);

      // Single Read Check (e.g., /Notification(111) or /Notification(NotificationID=111))
      if (key) {
        const result = await reqNotificationCollection.findOne({
          NotificationID: key,
        });
        if (!result) {
          return req.reject(404, `Notification with ID ${key} not found`);
        }
        return result;
      }

      // 3. Collection Read: Use the Query Builder for OData $filter, $top, $skip, $orderby
      const {
        query: filter,
        selectFields: select,
        sortOrder: sort,
        skip,
        limit,
      } = await buildQuery(req);

      // Build the MongoDB query chain
      let cursor = reqNotificationCollection.find(filter);

      // Apply select (projection) if specified.
      if (select && Object.keys(select).length > 0) {
        cursor = cursor.project(select);
      }

      // Apply sorting if specified
      if (sort && Object.keys(sort).length > 0) {
        cursor = cursor.sort(sort);
      }

      // Apply skip and limit
      cursor = cursor.skip(skip).limit(limit);

      // Fetch the data
      const notificationData = await cursor.toArray();

      // If $count=true was requested, CAP expects the total number in $count property
      if (req._queryOptions?.$count === true) {
        // Calculate total count ignoring skip/limit for OData $count
        const totalCount = await reqNotificationCollection.countDocuments(
          filter
        );
        req.results.$count = totalCount;
      }

      return notificationData;
    } catch (err) {
      console.error("Error reading Notifications:", err);
      // Log the incoming request query for better debugging in case of an error
      return req.reject(
        500,
        "Failed to read notifications due to server error"
      );
    }
  });

  // --- CREATE ---
  srv.on("CREATE", "Notification", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("AISP_NOTIFICATION");

      // Generate next Notification ID
      const count = await collection.countDocuments();
      const nextID = 201 + count; // Adjust nextID as necessary

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
        Status: req.data.Status || "Draft", // Set status as 'Draft' by default
      };

      // Insert the new notification into the collection
      await collection.insertOne(notification);

      return notification;
    } catch (err) {
      console.error("Error creating Notification:", err);
      return req.reject(500, "Failed to create notification");
    }
  });

  // --- UPDATE ---
  srv.on("UPDATE", "Notification", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("AISP_NOTIFICATION");

      const key = req.data.NotificationID || req.params?.[0]?.NotificationID;
      if (!key) return req.reject(400, "Missing Notification NotificationID");

      // Check if notification exists
      const existing = await collection.findOne({ NotificationID: key });
      if (!existing) {
        return req.reject(404, `Notification with ID ${key} not found`);
      }

      // Prevent update if the status is 'Sent'
      if (existing?.Status === "Sent") {
        return req.reject(
          409,
          `Cannot edit Notification ID ${key}. Notifications with status 'Sent' are final.`
        );
      }

      // Define update fields
      const updateFields = {
        NotificationType:
          req.data.NotificationType || existing.NotificationType,
        Title: req.data.Title || existing.Title,
        Body: req.data.Body || existing.Body,
        Priority: req.data.Priority || existing.Priority || "Low",
        Mail: !!req.data.Mail,
        Schedule: !!req.data.Schedule,
        ValidFrom: req.data.ValidFrom || existing.ValidFrom,
        ValidTo: req.data.ValidTo || existing.ValidTo,
        Status: req.data.Status || existing.Status, // Keep existing status if not provided
        DateTime: new Date().toISOString(),
      };

      // Update notification in DB
      await collection.updateOne(
        { NotificationID: key },
        { $set: updateFields }
      );

      // Return updated notification object
      return { NotificationID: key, ...updateFields };
    } catch (err) {
      console.error("Error updating Notification:", err);
      return req.reject(500, "Failed to update notification");
    }
  });

  // --- DELETE ---
  srv.on("DELETE", "Notification", async (req) => {
    try {
      const { database } = await getConnection();
      const collection = database.collection("AISP_NOTIFICATION");

      let key = req.data.NotificationID;
      if (!key) return req.reject(400, "Missing NotificationID");

      // Attempt to delete the document
      const result = await collection.deleteOne({ NotificationID: key });

      if (result.deletedCount === 0) {
        return req.reject(404, `NotificationID ${key} not found`);
      }

      return { message: `Notification ${key} deleted successfully` };
    } catch (err) {
      console.error("Error deleting Notification:", err);
      return req.reject(500, "Failed to delete notification");
    }
  });
};
