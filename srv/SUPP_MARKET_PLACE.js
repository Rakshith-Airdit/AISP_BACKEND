const cds = require("@sap/cds");
const axios = require("axios");
const lib_email = require("./Library/Email");
const emailTemplates = require("./Library/EmailTemplate");
const Email = require("./Library/Email");

module.exports = async function (srv) {
  // Handler 1: Company Search (No change needed for keyWord logic)
  srv.on("READ", "apolloServiceSupplierOrganisation", async (req) => {
    const filters = req.query?.SELECT?.where || [];
    let query = {};

    // Optional: parse $filter from UI5 or CAP client
    for (let i = 0; i < filters.length; i += 4) {
      if (filters[i]?.ref && filters[i + 2]?.val !== undefined) {
        query[filters[i].ref[0]] = filters[i + 2].val;
      }
    }

    try {
      // Inputs from UI5 query parameters (Fields in the CDS entity: keyWord, limit, Location)
      const {
        Location = "",
        keyWord = "",
        SupplierName = "",
        limit = "",
      } = query;

      // 1. Define the Apollo API endpoint (for POST search)
      const sApolloUrl = "https://api.apollo.io/api/v1/mixed_companies/search";

      // 2. Construct the JSON request body
      const iPerPage = limit ? parseInt(limit, 10) : 10;
      const oRequestBody = {};

      if (Location) oRequestBody.organization_locations = [Location];

      if (keyWord) {
        // Company Search (Handler 1) retains multi-keyword support for 'keyWord'
        oRequestBody.q_organization_keyword_tags = keyWord
          .split(",")
          .map((key) => key.trim())
          .filter(Boolean);
      }

      if (SupplierName) oRequestBody.q_organization_name = SupplierName;

      if (!isNaN(iPerPage) && iPerPage > 0) {
        oRequestBody.per_page = iPerPage;
      }

      // 3. Execute the POST request
      const response = await axios.post(sApolloUrl, oRequestBody, {
        headers: {
          accept: "application/json",
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "x-api-key": "nG-YyNUWp7XqrtIpsv0Jaw",
        },
      });

      const data = response.data;
      if (!data.accounts) return [];

      // Map data to the apolloServiceSupplierOrganisation entity
      return data.accounts.map((acc) => ({
        Id: acc.id,
        SupplierName: acc.name,
        PhoneNumber: acc.phone || acc.primary_phone?.number || "",
        Address: `${acc.organization_state}, ${acc.organization_country}` || "",
        PostalCode: acc.organization_postal_code || "",
        LogoUrl: acc.logo_url || "",
        WebSite: acc.website_url || "", // Updated: Website -> WebSite
        CompanyId: acc.organization_id,
      }));
    } catch (error) {
      req.error(500, `Failed to fetch Apollo data: ${error.message}`);
    }
  });

  srv.on("READ", "ContactDetails", async (req) => {
    try {
      // ... (Filter and Keyword Parsing - KEPT AS BEFORE) ...
      // --- 1. INITIAL SETUP AND FILTER/KEYWORD PARSING ---

      const filters = req.query?.SELECT?.where || [];
      let query = {};

      for (let i = 0; i < filters.length; i += 4) {
        if (filters[i]?.ref && filters[i + 2]?.val !== undefined) {
          query[filters[i].ref[0]] = filters[i + 2].val;
        }
      }

      const {
        orgId = "",
        seniority = "",
        location = "",
        keyWord = "",
        Name = "",
        Address = "",
      } = query || {};

      let apolloSearchTerm = "";

      if (req._queryOptions && req._queryOptions.$search) {
        try {
          apolloSearchTerm = JSON.parse(req._queryOptions.$search);
        } catch (error) {
          apolloSearchTerm = req._queryOptions.$search || "";
        }
        if (typeof apolloSearchTerm !== "string") {
          apolloSearchTerm = String(apolloSearchTerm);
        }
      }

      // --- 2. BUILD COMMON APOLLO REQUEST BODY (FILTERS/KEYWORDS) ---
      const sApolloUrl = "https://api.apollo.io/api/v1/mixed_people/search";
      const oRequestBody = {};
      const apolloHeaders = {
        accept: "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": "nG-YyNUWp7XqrtIpsv0Jaw",
      };

      // Apply standard filters
      if (seniority) {
        oRequestBody.person_seniorities = seniority
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (orgId) oRequestBody.organization_ids = [orgId];
      if (location) {
        oRequestBody.person_locations = [location];
      } else if (Address) {
        oRequestBody.person_locations = [Address];
      }

      // Apply combined keywords
      let individualKeywords = [];
      if (keyWord) {
        individualKeywords.push(
          ...keyWord
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        );
      }
      if (apolloSearchTerm) {
        individualKeywords.push(apolloSearchTerm);
      }
      if (individualKeywords.length > 0) {
        oRequestBody.q_keywords = individualKeywords.join(" ");
      }

      // Check if the request is for $count (must be a standalone endpoint call)
      const isCountRequest =
        Array.isArray(req.query.SELECT?.columns) &&
        req.query.SELECT.columns.length === 1 &&
        req.query.SELECT.columns[0].func === "count" &&
        req.query.SELECT.columns[0].as === "$count";

      if (isCountRequest) {
        oRequestBody.per_page = 1;
        oRequestBody.page = 1;

        // Execute the request to Apollo just to get the total_results
        const response = await axios.post(sApolloUrl, oRequestBody, {
          headers: apolloHeaders,
        });

        const totalCount = response.data.total_results || 0;
        console.log(`Apollo total_results: ${totalCount}`);
        return totalCount;
      }

      // --- 4. HANDLE DATA REQUEST (PAGINATION LOGIC - CORRECTED) ---
      // Extract $top and $skip (accessing the .val property)
      const topObject = req.query.SELECT?.limit?.rows;
      // If $top is not present, use the default (e.g., 10)
      const top = topObject ? parseInt(topObject.val, 10) : 10;

      const skipObject = req.query.SELECT?.limit?.offset;
      const skip = skipObject ? parseInt(skipObject.val, 10) : 0;

      // Apply Standard Pagination Calculation:
      const iPerPage = top;
      // Calculation: page = ($skip / $top) + 1
      const iPage = skip / top + 1;

      // Apply pagination to the request body
      if (iPerPage > 0) {
        oRequestBody.per_page = iPerPage;
      }
      oRequestBody.page = iPage; // NO LONGER HARDCODED TO 1

      // 5. Execute the POST request for data
      const response = await axios.post(sApolloUrl, oRequestBody, {
        headers: apolloHeaders,
      });

      const data = response.data;
      if (!data.people) return [];

      // ... (Client-Side Filter and Mapping Logic - KEPT AS BEFORE) ...
      let filteredPeople = data.people;

      // Client-Side Filter on Name
      if (Name) {
        const nameFilterLower = Name.toLowerCase();
        filteredPeople = data.people.filter((person) => {
          const fullName = `${person.first_name || ""} ${
            person.last_name || ""
          }`.trim();
          const nameToMatch = person.name || fullName;
          return nameToMatch.toLowerCase().includes(nameFilterLower);
        });
      }

      // Map data to the ContactDetails entity
      return filteredPeople.map((person) => ({
        Id: person.id,
        Name:
          person.name ||
          `${person.first_name || ""} ${person.last_name || ""}`.trim(),
        Photo: person.photo_url || "",
        Address:
          person.state && person.country
            ? `${person.state}, ${person.country}`
            : person.formatted_address || "",
        LinkdeIn: person.linkedin_url || "",
        seniority: person.title || "",
        Email: "N/A",
        Phone: "N/A",
      }));
    } catch (error) {
      // Re-throwing the error to ensure the 500 status code is correct
      req.error(500, `Failed to fetch Apollo contact data: ${error.message}`);
    }
  });

  // Handler 3: Enriched Contact (No change)
  srv.on("READ", "EnrichedContact", async (req) => {
    try {
      const filters = req.query?.SELECT?.where || [];
      let query = {};

      // 1. Parse filter (Expecting: Id eq '123,456,789')
      for (let i = 0; i < filters.length; i += 4) {
        if (filters[i]?.ref && filters[i + 2]?.val !== undefined) {
          query[filters[i].ref[0]] = filters[i + 2].val;
        }
      }

      // Inputs from UI5 query parameters
      const { Id = "" } = query; // Id now holds the string '123,456,789' or a single ID

      let idsToEnrich = [];

      if (Id) {
        // Split the comma-separated string into an array of IDs
        idsToEnrich = Id.split(",")
          .map((id) => id.trim())
          .filter(Boolean);
      }

      // Also check for single key read (e.g., /EnrichedContact('123'))
      if (idsToEnrich.length === 0 && req.params.length > 0) {
        // For /EnrichedContact('123'), req.params[0] is the key value
        idsToEnrich.push(req.params[0].ID || req.params[0]);
      }

      idsToEnrich = [...new Set(idsToEnrich)].filter(Boolean); // Deduplicate and clean up

      if (idsToEnrich.length === 0) {
        return req.error(
          400,
          "Missing required parameter: ID(s) in filter or key"
        );
      }

      const sApiKey = "nG-YyNUWp7XqrtIpsv0Jaw";
      const aEnrichedContacts = [];

      // ----------------------------------------------------------------------
      // SINGLE ENRICHMENT LOGIC
      // ----------------------------------------------------------------------
      if (idsToEnrich.length === 1) {
        const singleId = idsToEnrich[0];

        // The Apollo API for single enrichment is a standard GET endpoint.
        const url = `https://api.apollo.io/api/v1/people/match?reveal_personal_emails=true&id=${encodeURIComponent(
          singleId
        )}`;

        const response = await axios.get(url, {
          headers: {
            accept: "application/json",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "x-api-key": sApiKey,
          },
        });

        const person = response.data?.person;
        if (person) {
          aEnrichedContacts.push({
            Id: person.id,
            EmailId: person.email || "",
            Photo: person.photo_url || "",
            Name: person.name,
          });
        }
      }
      // ----------------------------------------------------------------------
      // BULK ENRICHMENT LOGIC
      // ----------------------------------------------------------------------
      else {
        // idsToEnrich.length > 1
        const sApolloUrl =
          "https://api.apollo.io/api/v1/people/bulk_match?reveal_personal_emails=false&reveal_phone_number=false";

        // Construct the JSON request body for bulk match
        const oRequestBody = {
          details: idsToEnrich.map((id) => ({ id })),
        };

        const response = await axios.post(sApolloUrl, oRequestBody, {
          headers: {
            accept: "application/json",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "x-api-key": sApiKey,
          },
        });
        const data = response.data;
        const aPeople = data?.matches || [];

        aPeople.forEach((person) => {
          aEnrichedContacts.push({
            Id: person.id,
            EmailId: person.email || "",
            Photo: person.photo_url || "",
            Name: person.name,
          });
        });
      }

      // Return the final list of enriched contacts
      return aEnrichedContacts;
    } catch (error) {
      req.error(
        500,
        `Failed to fetch Apollo enriched contact: ${error.message}`
      );
    }
  });

  srv.on("CREATE", "SendEmail", async (req) => {
    try {
      // 1. Get the payload data from the UI5 oModel.create() request
      const { RecieverName, RecieverEmail } = req.data;

      if (!RecieverEmail) {
        return req.error(
          400,
          "Recipient email address (RecieverEmail) is missing."
        );
      }

      // 2. Define the email content
      const subject =
        "Expression of Interest – Airdit Infrastructure Solutions Pvt. Ltd.";

      //const emailBodyHtml = ExpressionOfInterestMail(RecieverName);
      const emailBodyHtml =
        emailTemplates.ExpressionOfInterestMail(RecieverName);
      // You can replace 'Arora Cables Pvt. Ltd.' with a dynamic company name if available.

      // 3. Call your imported sendEmail function
      const result = await lib_email.sendEmail(
        RecieverEmail, // ToEmails
        "cc@airditinfra.com", // CCEmail (Add a fixed CC or read from config)
        "html", // type
        subject, // subject
        emailBodyHtml // body
      );

      // 4. Check the result and handle the CAP response
      if (result.success) {
        // Return the ID and a success status back to the UI5 frontend
        return {
          Id: req.data.Id || "0", // Use the temp ID or a generated one
          RecieverName: RecieverName,
          RecieverEmail: RecieverEmail,
          Status: "Success",
          Message: "Email successfully sent.",
        };
      } else {
        console.error("Email sending failed:", result.error);
        // Throw a CAP error to trigger the oModel.create() error handler in UI5
        req.error(500, `Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error("Error in SendEmail handler:", error.message);
      req.error(
        500,
        `Internal server error during email process: ${error.message}`
      );
    }
  });
};
