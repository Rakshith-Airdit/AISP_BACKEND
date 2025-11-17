const cds = require('@sap/cds');
const { getConnection } = require('./Library/DBConn');
const { ObjectID } = require('mongodb'); // Ensure you have ObjectID for mapping _id

// Helper function to parse $filter from a CAP request
function getEmailFromRequest(req) {
    const filters = req.query?.SELECT?.where || [];
    let email = '';

    for (let i = 0; i < filters.length; i += 4) {
        if (filters[i]?.ref && filters[i].ref[0] === 'Email' && filters[i + 2]?.val !== undefined) {
            email = filters[i + 2].val;
            break; 
        }
    }
    if (!email && req.data?.Email) {
        email = req.data.Email;
    }

    return email;
}


async function getERPDetails(ConERP, Email) {
    // 1. Get AddressID using Email
    const addressIDresponse = await ConERP.send({
        method: "GET",
        path: `/API_BUSINESS_PARTNER/A_AddressEmailAddress?$filter=EmailAddress eq '${Email}'`,
        headers: { Accept: "application/json", "sap-client": "200" },
    });

    if (!addressIDresponse || !addressIDresponse.d?.results?.length) {
        throw new Error(`No AddressID found for email: ${Email}`);
    }
    const addressId = addressIDresponse.d.results[0].AddressID;

    // 2. Get BusinessPartner ID using AddressID
    const getAddressDetails = await ConERP.send({
        method: "GET",
        path: `/API_BUSINESS_PARTNER/A_BusinessPartnerAddress?$filter=AddressID eq '${addressId}'`,
        headers: { Accept: "application/json", "sap-client": "200" },
    });

    const businessPartner = getAddressDetails.d.results[0]?.BusinessPartner;
    if (!businessPartner) {
         throw new Error(`No BusinessPartner found for AddressID: ${addressId}`);
    }

    // 3. Get Supplier details
    const getBusinessPartner = await ConERP.send({
        method: "GET",
        path: `/API_BUSINESS_PARTNER/A_BusinessPartner('${businessPartner}')/to_Supplier`,
        headers: { Accept: "application/json", "sap-client": "200" }
    });
    
   
    // 4. Get Address details - Returns Array
    const erpAddressDetails = await ConERP.send({
        method: "GET",
        path: `/API_BUSINESS_PARTNER/A_BusinessPartnerAddress?$filter=BusinessPartner eq '${businessPartner}'`,
        headers: { Accept: "application/json", "sap-client": "200" },
    });
    const erpAddress = erpAddressDetails.d.results
    
    // 5. Get Bank details - Returns Array
    const erpBankDetails = await ConERP.send({
        method: "GET",
        path: `/API_BUSINESS_PARTNER/A_BusinessPartner('${businessPartner}')/to_BusinessPartnerBank`,
        headers: { Accept: "application/json", "sap-client": "200" }
    });
    const erpBank = erpBankDetails.d?.results

    return {
        supplierData: getBusinessPartner.d,
        erpAddress, // Array of Address objects
        erpBank,    // Array of Bank objects
    };
}

// ------------------------------------------------------------------------------------
// MAIN MODULE EXPORT WITH UPDATED HANDLER
// ------------------------------------------------------------------------------------
module.exports = async function (srv) {
  
    srv.on('READ', 'profileDetails', async (req) => {
        const Email = getEmailFromRequest(req);
        
        let profileDetails = [];

        if (!Email) {
            req.error(400, "Missing required parameter: Email");
            return profileDetails;
        }

        try {
            // 1. Get Connections
            const { database } = await getConnection();
            const ConERP = await cds.connect.to("AIRDIT_HANA_S4P_CC");
            
            // 2. Fetch REQUEST_INFO from MongoDB
            const requestInfoCollection = database.collection("REQUEST_INFO");
            const requestInfo = await requestInfoCollection.findOne({ REGISTERED_ID: Email });

            if (!requestInfo) {
                req.error(404, `No supplier found for email: ${Email}`);
                return profileDetails;
            }
            const requestNo = requestInfo.REQUEST_NO;
            const requestType =requestInfo.REQUEST_TYPE;
           
            
            // --- Get and convert SUPPLIER_CODE (SAP_VENDOR_CODE) ---
            const supplierCodeString = requestInfo.SAP_VENDOR_CODE;
            const supplierCode = supplierCodeString ? parseInt(supplierCodeString, 10) : null;
            
            if (supplierCode === null || isNaN(supplierCode)) {
                req.error(404, `Missing or invalid SAP_VENDOR_CODE (Supplier Code) for email: ${Email}`);
                return profileDetails;
            }
            
            // -----------------------------------------------------------

            // 3. Fetch ERP Data (Supplier, Address, Bank)
            const { supplierData, erpAddress, erpBank } = await getERPDetails(ConERP, Email);
            
            if (!supplierData) {
                console.log("No Supplier data found in ERP.");
            }
            
            // 4. Fetch MongoDB Data (Address, Bank, Products, Operational, Attachment, **Dynamic Fields**)
            
            const addressCollection = database.collection("REG_ADDRESS");
            const bankInfoCollection = database.collection("REG_BANKS");
            const productsCollection = database.collection("REG_PRODUCTS"); 
            const capacityCollection = database.collection("REG_CAPACITY"); 
            const attachmentCollection = database.collection("ATTACHMENTS_COMPANY_PROFILE"); 
            
            const dynamicFieldsCollection = database.collection("DYNAMIC_FORM_CONFIG_NEW"); 


            // 1:1 MongoDB data (used for additional fields not found in ERP/S4 data)
            const addressDetailsCapm = await addressCollection.findOne({ REQUEST_NO: requestNo });
            const bankDetailsCapm = await bankInfoCollection.findOne({ REQUEST_NO: requestNo });
            
            // 1:N MongoDB data
            const mongoProducts = await productsCollection.find({ REQUEST_NO: requestNo }).toArray();
            const mongoCapacities = await capacityCollection.find({ REQUEST_NO: requestNo }).toArray();
            const mongoAttachments = await attachmentCollection.find({ REQUEST_NO: requestNo }).toArray();
            
            const mongoDynamicFields = await dynamicFieldsCollection.find({ 
                COMPANY_CODE: requestInfo.COMPANY_CODE, 
                NEW_DYANAMIC_FORM_FIELD: true 
            }).toArray();

            // 5. Build the Final Nested Object
            
            // --- A. Profile Details (Root Entity) ---
            const rawDate = supplierData?.CreationDate;
            let formattedDate = null;
            if (rawDate) {
                const timestampMatch = rawDate.match(/\d+/);
                if (timestampMatch) {
                     const timestamp = parseInt(timestampMatch[0], 10);
                     const date = new Date(timestamp);
                     formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'long', year: 'numeric',
                    });
                }
            }
            
            let result = {
                SUPPLIER_CODE: supplierCode, 
               Contact: addressDetailsCapm?.CONTACT_NO,
                SupplierName: supplierData?.SupplierName,
                Email: Email,
                CREATED_ON: formattedDate,
                CompanyCode : requestInfo.COMPANY_CODE,
                VendorType: `${requestInfo.BP_TYPE_CODE}-${requestInfo.BP_TYPE_DESC}`,
                VendorSubType: `${requestInfo.SUPPL_TYPE}-${requestInfo.SUPPL_TYPE_DESC}`,
                SupplierWebsite: requestInfo.WEBSITE,
                
            };
            
            
            // --- B. 1:N Address Expansion (Mapping all addresses) ---
            result.Address = erpAddress.map((addr) => ({
                // FIX: Use AddressID as the key from the ERP data
                AddressID: addr.AddressID, 
                SUPPLIER_CODE: supplierCode,        // Mapped link field
                
                // Fields from ERP Address (addr)
                PostalCode: addr.PostalCode,
                Region: addr.Region,
                City: addr.CityName,
                Country: addr.Country,
                StreetNo: addr.HouseNumber, 
                Street01: addr.StreetName, 
                
                // Fallback/Supplemental fields from Mongo (assuming the Mongo fields apply to the primary address)
                Street02: addr.StreetPrefixName, 
                Email: Email, // Assuming Email is common
            }));
            
            // --- C. 1:N Bank Expansion (Mapping all bank details) ---
            result.Bank = erpBank.map((bank) => ({
                // FIX: Use BankIdentification as the key from the ERP data
                BankIdentification: bank.BankIdentification, 
                SUPPLIER_CODE: supplierCode,       // Mapped link field
                
                // Fields from ERP Bank (bank)
                BankName: bank.BankName ,
                IBANNumber: bank.IBAN,
                SwiftCode: bank.SwiftCode ,
                BeneficiaryName: bank.BankAccountHolderName,
                BankCountry: bank.BankCountryKey,
                AccountNumber: bank.BankNumber,

                // Fallback/Supplemental fields from Mongo
                //RoutingCode: bankDetailsCapm?.ROUTING_CODE,
                Email: Email 
            }));
            
            // --- D. 1:N Products Expansion (Existing) ---
            result.Products = mongoProducts.map(doc => ({
                Id: doc._id.toString(), 
                SUPPLIER_CODE: supplierCode, 
                ProductDescription: doc.PROD_DESCRIPTION,
                ProductType: doc.PROD_TYPE,
                ProductName: doc.PROD_NAME,
                ProductCategory: doc.PROD_CATEGORY
            }));
            
            // --- E. 1:N Operational Capacity Expansion (Existing) ---
            result.OperationalCapacity = mongoCapacities.map(doc => ({
                Id: doc._id.toString(), 
                SUPPLIER_CODE: supplierCode, 
                Maximum_order: doc.MAXMIMUM_ORDER_SIZE,
                Minimum_order: doc.MINIMUM_ORDER_SIZE,
                Total_Product_capacity: doc.TOTAL_PROD_CAPACITY,
                City: doc.CITY
            }));
            
            // --- F. 1:N Attachment Expansion (Existing) ---
            result.Attachments = mongoAttachments.map(doc => ({
                ID: doc._id.toString(), 
                SUPPLIER_CODE: supplierCode, 
                Name: doc.IMAGE_FILE_NAME,
                Description: doc.DESCRIPTION,
                URL: doc.IMAGEURL
            }));

            // --- G. 1:N Dynamic Fields Expansion (Existing) ---
            result.DynamicFields = mongoDynamicFields.map((doc, index) => ({
                Id: index + 1, // Retaining index for Mongo data without a reliable external key
                SupplierCode: supplierCode, 
                FieldName: doc.FIELD_LABEL,
                FieldValue: doc.FIELD_PATH, 
                FieldSection: doc.SECTION,
                FieldSubSection: doc.CATEGORY, 
            }));

            // Return the object inside an array
            return [result];

        } catch (error) {
            console.error("Error in profileDetails handler:", error.message);
            req.error(500, `An error occurred while fetching profile details: ${error.message}`);
            return profileDetails;
        }
    });

    srv.on('CREATE', 'profileDetails', async (req) => {
    
    // The data to be updated is available in req.data
    const updateData = req.data;
    
    // 1. Get the key (Supplier Code) from the request data
    const supplierCode = updateData.SUPPLIER_CODE;

    if (!supplierCode) {
        // Use req.error to send a standardized error back through CAP
        req.error(400, "Missing required key field: SUPPLIER_CODE");
        return;
    }

    try {
        // 2. Get Connections (Assumes getConnection() is available)
        const { database } = await getConnection(); 
        
        const collectionName = "EDITED_PROFILE_DATA";
        const editedProfileCollection = database.collection(collectionName);

        // --- Data Preparation ---
        // Prepare the complete profile document structure, including nested arrays
        const profileData = {
            SUPPLIER_CODE: updateData.SUPPLIER_CODE,
            Contact: updateData.Contact,
            SupplierName: updateData.SupplierName,
            Email: updateData.Email,
            CREATED_ON: updateData.CREATED_ON,
            CompanyCode: updateData.CompanyCode,
            VendorType: updateData.VendorType,
            VendorSubType: updateData.VendorSubType,
            SupplierWebsite: updateData.SupplierWebsite,
            
            // Nested arrays (expansions)
            Address: updateData.Address || [],
            Bank: updateData.Bank || [],
            Products: updateData.Products || [],
            OperationalCapacity: updateData.OperationalCapacity || [],
            Attachments: updateData.Attachments || [],
            DynamicFields: updateData.DynamicFields || [],
            
            // Metadata for tracking
            LAST_UPDATED_AT: new Date(),
            // Ensure this is reliable based on your authentication setup
            LAST_UPDATED_BY_EMAIL: updateData.Email || 'System/Unknown', 
        };

        // 3. Save/Update the document in MongoDB using the UPSERT logic
        // This single operation performs your required 'update-or-create' logic.
        // 
        const result = await editedProfileCollection.updateOne(
            { SUPPLIER_CODE: supplierCode }, // The search filter (WHERE clause in SQL)
            { $set: profileData },           // The data to set/replace
            { upsert: true }                 // The key option: Insert if no document matches the filter
        );

        // Logging the result to indicate whether an update or insert occurred
        if (result.upsertedId) {
            console.log(`New document INSERTED with _id: ${result.upsertedId}`);
        } else if (result.modifiedCount > 0) {
            console.log(`Existing document UPDATED for Supplier Code: ${supplierCode}`);
        } else {
            console.log(`Document found but NO CHANGES were made for Supplier Code: ${supplierCode}`);
        }

        // 4. Return the updated data structure as expected by CAP
        return updateData; 

    } catch (error) {
        console.error("Error in profileDetails UPDATE handler:", error.message);
        // Throw an error back to the client
        req.error(500, `An error occurred while saving profile details: ${error.message}`);
    }
});
    
}