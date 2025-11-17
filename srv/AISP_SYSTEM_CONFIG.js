const cds = require("@sap/cds");
const { getConnection } = require("./Library/DBConn");

module.exports = async (srv) => {
  //filtr on the basis of application name
  srv.on("READ", "VIM_FORM_CONFIG", async (req) => {
    const { client, database } = await getConnection();
    const collection = database.collection("PROCUREMENT_FORM_FIELDS");

    try {
      const filters = req.query?.SELECT?.where || [];
      let query = {};

      // Optional: parse $filter from UI5 or CAP client
      for (let i = 0; i < filters.length; i += 4) {
        if (filters[i]?.ref && filters[i + 2]?.val !== undefined) {
          query[filters[i].ref[0]] = filters[i + 2].val;
        }
      }

      const result = await collection.find(query).toArray();
      return result;
    } catch (error) {
      console.error("Error reading VIM_FORM_CONFIG:", error);
      req.error(500, "Failed to fetch VIM_FORM_CONFIG");
    }
  });

  // GET Request to fetch Vendor Account Group details
  srv.on("READ", "VENDOR_ACCOUNT_GROUP", async (req) => {
    try {
      // Extract CODE from the $filter if provided
      const filterExpression = req.query.SELECT.where;
      let CODE = null;

      // Check if a filter is applied for CODE
      if (filterExpression && filterExpression.length > 0) {
        for (let i = 0; i < filterExpression.length; i += 2) {
          if (filterExpression[i].ref && filterExpression[i + 1] === "=") {
            const field = filterExpression[i].ref[0];
            const value = filterExpression[i + 2].val;

            // If filtering by CODE, extract it
            if (field === "CODE") {
              CODE = value;
              break;
            }
          }
        }
      }

      const { database } = await getConnection();
      const groupCol = database.collection("VENDOR_ACCOUNT_GROUP");
      const questionCol = database.collection("RFQ_QUESTION_CONFIG");
      const attachmentCol = database.collection(
        "VENDOR_ACCOUNT_GROUP_ATTACHMENT"
      );

      let groups;

      // If CODE is passed, filter the Vendor Account Group by CODE
      if (CODE) {
        groups = await groupCol.find({ CODE }).toArray();

        // If no matching Vendor Account Group is found, return an error
        if (groups.length === 0) {
          return req.error(
            404,
            `No Vendor Account Group found with CODE: ${CODE}`
          );
        }

        // Fetch associated questions and attachments for the matched group
        const questionnaires = await questionCol
          .find({ ACCOUNT_GROUP: CODE })
          .toArray();
        const attachments = await attachmentCol
          .find({ ACCOUNT_GROUP: CODE })
          .toArray();

        // Combine the data and return the result
        const result = {
          CODE: groups[0].CODE,
          DESCRIPTION: groups[0].DESCRIPTION,
          questionnaires,
          attachments,
        };

        return result; // Return the combined result with Vendor Account Group, questions, and attachments
      } else {
        // If CODE is not passed, fetch all Vendor Account Groups
        groups = await groupCol.find({}).toArray();

        // If no groups are found, return an error
        if (groups.length === 0) {
          return req.error(404, "No Vendor Account Groups found");
        }

        // Fetch associated questions and attachments for all groups
        const allResults = await Promise.all(
          groups.map(async (group) => {
            const questionnaires = await questionCol
              .find({ ACCOUNT_GROUP: group.CODE })
              .toArray();
            const attachments = await attachmentCol
              .find({ ACCOUNT_GROUP: group.CODE })
              .toArray();

            return {
              CODE: group.CODE,
              DESCRIPTION: group.DESCRIPTION,
              // questionnaires,
              // attachments
            };
          })
        );

        return allResults; // Return all Vendor Account Groups with their associated data
      }
    } catch (err) {
      console.error("Error fetching Vendor Account Group details:", err);
      req.error(500, "Failed to fetch Vendor Account Group details");
    }
  });
};