using {Procurement} from '../db/schema';
using ZC_AISP_VALUEHELP_BND from './external/ZC_AISP_VALUEHELP_BND.cds';
using {
    cuid,
    managed
} from '@sap/cds/common';

@sap.Label    : 'RFQ Management Service'
@sap.QuickInfo: 'Service for managing Request for Quotation processes, including RFQ creation, supplier management, and workflow tracking'
service RFQService {
    @sap.Label    : 'RFQ Items Data'
    @sap.QuickInfo: 'Structure for RFQ line item information'
    type RFQItemsData     : {
        @sap.Label    : 'Item Number'
        @sap.QuickInfo: 'Unique identifier for the item line'
        ItemNo                     : String;

        @sap.Label    : 'Material Number'
        @sap.QuickInfo: 'Unique identifier for the material'
        MaterialNo                 : String;

        @sap.Label    : 'Material Description'
        @sap.QuickInfo: 'Description of the material or service'
        MaterialDesc               : String;

        @sap.Label    : 'Lot Type'
        @sap.QuickInfo: 'Material Group'
        LotType                    : String;

        @sap.Label    : 'Plant Code'
        @sap.QuickInfo: 'Plant or facility code'
        PlantCode                  : String;

        @sap.Label    : 'Unit of Measure'
        @sap.QuickInfo: 'Measurement unit for the item'
        UnitOfMeasure              : String;

        @sap.Label    : 'Quantity'
        @sap.QuickInfo: 'Requested quantity'
        Quantity                   : String;

        @sap.Label    : 'Delivery Date'
        @sap.QuickInfo: 'Expected delivery date'
        DeliveryDate               : Date null;

        @sap.Label    : 'Expected Service Period Start'
        @sap.QuickInfo: 'Start date for service period'
        ExpectedServicePeriodStart : Date null;

        @sap.Label    : 'Expected Service Period End'
        @sap.QuickInfo: 'End date for service period'
        ExpectedServicePeriodEnd   : Date null;
    };

    @sap.Label    : 'RFQ Suppliers Data'
    @sap.QuickInfo: 'Structure for supplier information in RFQ'
    type RFQSuppliersData : {
        @sap.Label    : 'Supplier Code'
        @sap.QuickInfo: 'Unique supplier identifier'
        SupplierCode : String;

        @sap.Label    : 'Supplier Name'
        @sap.QuickInfo: 'Name of the supplier'
        SupplierName : String
    };

    @sap.Label    : 'RFQ Suppliers Data'
    @sap.QuickInfo: 'Structure for supplier information in RFQ'
    type SuppliersDetails : {
        @sap.Label    : 'Supplier Code'
        @sap.QuickInfo: 'Unique supplier identifier'
        SupplierCode          : String;

        @sap.Label    : 'Supplier Name'
        @sap.QuickInfo: 'Name of the supplier'
        SupplierName          : String;

        @sap.Label    : 'Supplier Name'
        @sap.QuickInfo: 'Name of the supplier'
        Status                : String enum {
            Pending;
            Awarded;
        };

        @sap.Label    : 'Quotation Number'
        @sap.QuickInfo: 'Quotation Number for awarded RFQ'
        SupplierQuotation     : String null;

        @sap.Label    : 'Quotation Creation Date'
        @sap.QuickInfo: 'Date when Quotation Number was generated'
        QuotationCreationDate : Date null;

        @sap.Label    : 'Last Updated On'
        @sap.QuickInfo: 'Last update timestamp'
        LastUpdated           : Date null;
    };

    @sap.Label    : 'RFQ Headers'
    @sap.QuickInfo: 'Main header information for RFQ price comparison'
    // entity RFQHeaders                 as projection on Procurement.RFQ_PRICE_COMPARISON_HEADER;
    entity RFQHeaders {
            @sap.Label    : 'RFQ Number'
            @sap.QuickInfo: 'Unique RFQ identifier'
        key RfqNumber           : String;

            @sap.Label    : 'Company Code'
            @sap.QuickInfo: 'Company code'
            CompanyCode         : String(4);

            @sap.Label    : 'Document Date'
            @sap.QuickInfo: 'Document creation date'
            DocumentDate        : Date;

            @sap.Label    : 'Deadline Date'
            @sap.QuickInfo: 'Submission deadline'
            EventEndDate        : Date;

            @sap.Label    : 'Published Date'
            @sap.QuickInfo: 'Publication date'
            EventStartDate      : Date;

            @sap.Label    : 'Created By'
            @sap.QuickInfo: 'Creator user ID'
            CreatedBy           : String(20);

            @sap.Label    : 'Target Value'
            @sap.QuickInfo: 'Budget target value'
            TargetValue         : Decimal(15, 2);

            @sap.Label    : 'Recieved Quotations'
            @sap.QuickInfo: 'Total Quotations Recieved'
            ReceivedQuotations  : Integer;

            @sap.Label    : 'Quotations Awarded Status'
            @sap.QuickInfo: 'Quotations Awarded Status'
            hasAwardedQuotation : Boolean;

            @sap.Label    : 'Created On'
            @sap.QuickInfo: 'Record creation timestamp'
            CREATED_ON          : Timestamp;

            @sap.Label    : 'Quotation Status'
            @sap.QuickInfo: 'Status of Quotation'
            Status              : String;

            @sap.Label    : 'Created On'
            @sap.QuickInfo: 'Record creation timestamp'
            TimeRemaining       : String;

            @sap.Label    : 'Last Updated On'
            @sap.QuickInfo: 'Last update timestamp'
            LAST_UPDATED_ON     : Timestamp;
    }

    @sap.Label    : 'RFQ Items'
    @sap.QuickInfo: 'Line items for RFQ price comparison'
    entity RFQItems                   as projection on Procurement.RFQ_PRICE_COMPARISON_ITEM;

    @sap.Label    : 'Currencies'
    @sap.QuickInfo: 'Available currency codes and information'
    @readonly
    entity SAP__Currencies            as
        projection on ZC_AISP_VALUEHELP_BND.SAP__Currencies {
                @sap.Label    : 'Currency Code'
                @sap.QuickInfo: 'Currency identifier code'
            key CurrencyCode,

                @sap.Label    : 'ISO Code'
                @sap.QuickInfo: 'International standard currency code'
                ISOCode,

                @sap.Label    : 'Currency Text'
                @sap.QuickInfo: 'Description of the currency'
                Text,

                @sap.Label    : 'Decimal Places'
                @sap.QuickInfo: 'Number of decimal places for the currency'
                DecimalPlaces
        };

    @sap.Label    : 'Units of Measure'
    @sap.QuickInfo: 'Available measurement units and codes'
    @readonly
    entity SAP__UnitsOfMeasure        as
        projection on ZC_AISP_VALUEHELP_BND.SAP__UnitsOfMeasure {
                @sap.Label    : 'Unit Code'
                @sap.QuickInfo: 'Unit of measure code'
            key UnitCode,

                @sap.Label    : 'ISO Code'
                @sap.QuickInfo: 'International standard unit code'
                ISOCode,

                @sap.Label    : 'External Code'
                @sap.QuickInfo: 'External reference code for the unit'
                ExternalCode,

                @sap.Label    : 'Unit Text'
                @sap.QuickInfo: 'Description of the unit'
                Text,

                @sap.Label    : 'Decimal Places'
                @sap.QuickInfo: 'Number of decimal places for the unit'
                DecimalPlaces
        };

    @sap.Label    : 'Company Code Value Help'
    @sap.QuickInfo: 'Company codes available for RFQ creation'
    @readonly
    entity ZC_AISP_COMPANYCODE_VH     as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_COMPANYCODE_VH {
                @sap.Label    : 'Company Code'
                @sap.QuickInfo: 'Company identifier code'
            key CompanyCode,

                @sap.Label    : 'Description'
                @sap.QuickInfo: 'Company name or description'
                Description
        };

    @sap.Label    : 'Currency Value Help'
    @sap.QuickInfo: 'Currency codes available for RFQ'
    @readonly
    entity ZC_AISP_CURRENCY_VH        as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_CURRENCY_VH {
                @sap.Label    : 'Currency Code'
                @sap.QuickInfo: 'Currency identifier'
            key Waers,

                @sap.Label    : 'Long Text'
                @sap.QuickInfo: 'Currency description'
                Ltext
        };

    @sap.Label    : 'Material Details Value Help'
    @sap.QuickInfo: 'Material information for RFQ items'
    @readonly
    entity ZC_AISP_MATERIALDETAILS_VH as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_MATERIALDETAILS_VH {
                @sap.Label    : 'Material Number'
                @sap.QuickInfo: 'Material identifier code'
            key Matnr,

                @sap.Label    : 'Material Description'
                @sap.QuickInfo: 'Short material description'
                Maktx,

                @sap.Label    : 'Material Group'
                @sap.QuickInfo: 'Short material group'
                MaterialGroup,

                @sap.Label    : 'Unit of Measure'
                @sap.QuickInfo: 'Measurement unit for the material'
                UnitOfMeasure,

                @sap.Label    : 'Description'
                @sap.QuickInfo: 'Detailed material description'
                Description
        };

    @sap.Label    : 'Incoterms Value Help'
    @sap.QuickInfo: 'Available incoterms for RFQ'
    @readonly
    entity ZC_AISP_INCOTERMS_VH       as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_INCOTERMS_VH {
                @sap.Label    : 'Incoterm Code'
                @sap.QuickInfo: 'Incoterm identifier code'
            key Inco1,

                @sap.Label    : 'Incoterm Description'
                @sap.QuickInfo: 'Incoterm description text'
                Bezei
        };

    @sap.Label    : 'Material Group Value Help'
    @sap.QuickInfo: 'Material group classifications'
    @readonly
    entity ZC_AISP_MATERIALGROUP_VH   as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_MATERIALGROUP_VH {
                @sap.Label    : 'Material Group'
                @sap.QuickInfo: 'Material group code'
            key Matkl,

                @sap.Label    : 'Group Description'
                @sap.QuickInfo: 'Material group description'
                Wgbez
        };

    @sap.Label    : 'Payment Terms Value Help'
    @sap.QuickInfo: 'Available payment terms for RFQ'
    @readonly
    entity ZC_AISP_PAYMENTTERMS_VH    as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_PAYMENTTERMS_VH {
                @sap.Label    : 'Payment Terms Code'
                @sap.QuickInfo: 'Payment terms identifier'
            key Zterm,

                @sap.Label    : 'Terms Description'
                @sap.QuickInfo: 'Payment terms description'
                Vtext
        };

    @sap.Label    : 'Plant Value Help'
    @sap.QuickInfo: 'Plant codes and descriptions'
    @readonly
    entity ZC_AISP_PLANT_VH           as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_PLANT_VH {
                @sap.Label    : 'Plant Code'
                @sap.QuickInfo: 'Plant identifier code'
            key Werks,

                @sap.Label    : 'Plant Name'
                @sap.QuickInfo: 'Plant name or description'
                Name1
        };

    @sap.Label    : 'Purchase Group Value Help'
    @sap.QuickInfo: 'Purchasing group information'
    @readonly
    entity ZC_AISP_PURCHASEGROUP_VH   as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_PURCHASEGROUP_VH {
                @sap.Label    : 'Purchase Group Code'
                @sap.QuickInfo: 'Purchasing group identifier'
            key Ekgrp,

                @sap.Label    : 'Group Name'
                @sap.QuickInfo: 'Purchasing group name'
                Eknam
        };

    @sap.Label    : 'Purchase Organization Value Help'
    @sap.QuickInfo: 'Purchasing organization codes'
    @readonly
    entity ZC_AISP_PURCHASEORG_VH     as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_PURCHASEORG_VH {
                @sap.Label    : 'Purchase Org Code'
                @sap.QuickInfo: 'Purchasing organization identifier'
            key Ekorg,

                @sap.Label    : 'Org Description'
                @sap.QuickInfo: 'Purchasing organization description'
                Ekotx
        };

    @sap.Label    : 'Vendor Details Value Help'
    @sap.QuickInfo: 'Vendor information for RFQ suppliers'
    @readonly
    entity ZC_AISP_VENDORDETAILS_VH   as
        projection on ZC_AISP_VALUEHELP_BND.ZC_AISP_VENDORDETAILS_VH {
                @sap.Label    : 'Vendor Number'
                @sap.QuickInfo: 'Vendor identifier code'
            key Lifnr,

                @sap.Label    : 'Country'
                @sap.QuickInfo: 'Vendor country code'
                Country,

                @sap.Label    : 'Vendor Name'
                @sap.QuickInfo: 'Vendor business name'
                VendorName,

                @sap.Label    : 'City'
                @sap.QuickInfo: 'Vendor city location'
                City,

                @sap.Label    : 'Postal Code'
                @sap.QuickInfo: 'Vendor postal code'
                PostalCode,

                @sap.Label    : 'Street'
                @sap.QuickInfo: 'Vendor street address'
                Street,

                @sap.Label    : 'Address Number'
                @sap.QuickInfo: 'Vendor address number'
                Adrnr,

                @sap.Label    : 'Vendor Email'
                @sap.QuickInfo: 'Vendor contact email'
                VendorEmail,

                @sap.Label    : 'Vendor Account Group'
                @sap.QuickInfo: 'Vendor account group classification'
                VendorAccGroup,

                @sap.Label    : 'Description'
                @sap.QuickInfo: 'Additional vendor information'
                Description
        };

    @sap.Label    : 'Currencies Value Help'
    @sap.QuickInfo: 'Master data table for currency codes and descriptions'
    entity Currencies_VH {
            @sap.Label    : 'Currency Code'
            @sap.QuickInfo: 'Unique identifier for the currency (ISO 4217 or custom code)'
        key WAERS : String(3);

            @sap.Label    : 'Long Description'
            @sap.QuickInfo: 'Complete descriptive name of the currency with additional context'
            LTEXT : String(100);

            @sap.Label    : 'Short Description'
            @sap.QuickInfo: 'Abbreviated name or symbol representation of the currency'
            KTEXT : String(50);
    }

    @sap.Label    : 'Company Codes'
    @sap.QuickInfo: 'Master data table for company codes and company information'
    entity CompanyCodes_VH {
            @sap.Label    : 'Company Code'
            @sap.QuickInfo: 'Unique identifier code for the company or business unit'
        key BUKRS : String(4);

            @sap.Label    : 'Company Name'
            @sap.QuickInfo: 'Official registered name of the company or business unit'
            BUTXT : String(100);

            @sap.Label    : 'City'
            @sap.QuickInfo: 'City location of the company headquarters or registration'
            ORT01 : String(100);

            @sap.Label    : 'Currency Key'
            @sap.QuickInfo: 'Default currency code used by the company for financial operations'
            WAERS : String(3);
    }

    @sap.Label    : 'Quotation Statuses'
    @sap.QuickInfo: 'Master data table for unique Quotation Statuses'
    entity Status_VH {

            // The unique value used for filtering (key)
            @sap.Label    : 'Status Key'
            @sap.QuickInfo: 'Unique code for the Quotation Status'
        key StatusKey  : String;

            // The human-readable description (if different from the key)
            @sap.Label    : 'Status Description'
            @sap.QuickInfo: 'Description of the Quotation Status'
            StatusText : String;
    }

    @sap.Label    : 'Supplier Status Distribution'
    @sap.QuickInfo: 'Distribution of supplier statuses for RFQ analysis'
    entity SupplierStatusDistribution {
            @sap.Label    : 'Accepted Count'
            @sap.QuickInfo: 'Number of suppliers who accepted the RFQ'
        key RfqNumber        : String;

            @sap.Label    : 'Accepted Count'
            @sap.QuickInfo: 'Number of suppliers who accepted the RFQ'
            AcceptedCount    : Integer;

            @sap.Label    : 'Not Accepted Count'
            @sap.QuickInfo: 'Number of suppliers who did not accept the RFQ'
            NotAcceptedCount : Integer;

            @sap.Label    : 'Submitted Count'
            @sap.QuickInfo: 'Number of suppliers who submitted quotations'
            SubmittedCount   : Integer;

            @sap.Label    : 'Rejected Count'
            @sap.QuickInfo: 'Number of suppliers who were rejected'
            RejectedCount    : Integer;

            @sap.Label    : 'Pending Count'
            @sap.QuickInfo: 'Number of suppliers who have not seen Quotation'
            PendingCount     : Integer;

            @sap.Label    : 'Supplier Details'
            @sap.QuickInfo: 'Detailed information about each supplier'
            SupplierDetails  : many {
                @sap.Label    : 'Bidder'
                @sap.QuickInfo: 'Supplier identifier code'
                Bidder                 : String;

                @sap.Label    : 'Vendor Name'
                @sap.QuickInfo: 'Name of the supplier/vendor'
                VendorName             : String;

                @sap.Label    : 'Vendor Email'
                @sap.QuickInfo: 'Email address of the vendor'
                VendorEmail            : String;

                @sap.Label    : 'Vendor Account Group'
                @sap.QuickInfo: 'Account group classification of the vendor'
                VendorAccountGroup     : String;

                @sap.Label    : 'Vendor Account Group Name'
                @sap.QuickInfo: 'Name of the vendor account group'
                VendorAccountGroupName : String;

                @sap.Label    : 'Status'
                @sap.QuickInfo: 'Current status of the supplier response'
                Status                 : String enum {
                    @sap.Label    : 'Accepted'
                    @sap.QuickInfo: 'Accepted and Not Participated'
                    Accepted;
                    @sap.Label    : 'Not Accepted'
                    @sap.QuickInfo: 'Rejected'
                    Not_Accepted;
                    @sap.Label    : 'Pending'
                    @sap.QuickInfo: 'Not Participated Yet'
                    Pending;
                    @sap.Label    : 'Submitted'
                    @sap.QuickInfo: 'Accepted and Participated'
                    Submitted
                };
            };

            @sap.Label    : 'Deadline Date'
            @sap.QuickInfo: 'Final date for quotation submission'
            DeadlineDate     : Date;

            @sap.Label    : 'Published Date'
            @sap.QuickInfo: 'Date when the RFQ was published'
            PublishedDate    : Date;
    }

    @sap.Label    : 'RFQ Basic Details'
    @sap.QuickInfo: 'Basic information for RFQ creation'
    entity ZC_RFQBasicDetails {
            @sap.Label    : 'ID'
            @sap.QuickInfo: 'Unique identifier for RFQ basic details'
        key ID          : UUID;

            @sap.Label    : 'Currency'
            @sap.QuickInfo: 'Currency code for the RFQ'
            Waers       : String(5);

            @sap.Label    : 'Payment Terms'
            @sap.QuickInfo: 'Payment terms code'
            Zterm       : String(4);

            @sap.Label    : 'Incoterms'
            @sap.QuickInfo: 'Incoterms code'
            Inco1       : String(3);

            @sap.Label    : 'Company Code'
            @sap.QuickInfo: 'Company code identifier'
            CompanyCode : String(4);

            @sap.Label    : 'Purchasing Organization'
            @sap.QuickInfo: 'Purchasing organization code'
            Ekorg       : String(4);

            @sap.Label    : 'Purchasing Group'
            @sap.QuickInfo: 'Purchasing group code'
            Ekgrp       : String(3);

            @sap.Label    : 'Project Name'
            @sap.QuickInfo: 'Name of the RFQ project'
            ProjectName : String(100);

            @sap.Label    : 'Reference'
            @sap.QuickInfo: 'Reference information for the RFQ'
            Reference   : String(100);

            @sap.Label    : 'Deadline'
            @sap.QuickInfo: 'RFQ submission deadline'
            Deadline    : Date;
    }

    @sap.Label    : 'RFQ Item Details'
    @sap.QuickInfo: 'Detailed information for RFQ line items'
    entity ZC_RFQItemDetails {
            @sap.Label    : 'ID'
            @sap.QuickInfo: 'Unique identifier for item details'
        key ID            : UUID;

            @sap.Label    : 'Item Number'
            @sap.QuickInfo: 'Line item number'
            ItemNo        : Integer;

            @sap.Label    : 'Material Number'
            @sap.QuickInfo: 'Material identifier code'
            Matnr         : String(18);

            @sap.Label    : 'Description'
            @sap.QuickInfo: 'Item description'
            Description   : String;

            @sap.Label    : 'Material Description'
            @sap.QuickInfo: 'Material name or description'
            Maktx         : String;

            @sap.Label    : 'Plant Code'
            @sap.QuickInfo: 'Plant identifier'
            Werks         : String(4);

            @sap.Label    : 'Plant Name'
            @sap.QuickInfo: 'Plant description'
            Name1         : String;

            @sap.Label    : 'Quantity'
            @sap.QuickInfo: 'Requested quantity'
            quantity      : Decimal(15, 3);

            @sap.Label    : 'Unit of Measure'
            @sap.QuickInfo: 'Measurement unit'
            UnitOfMeasure : String(6);

            @sap.Label    : 'Delivery Date'
            @sap.QuickInfo: 'Expected delivery date'
            DeliveryDate  : Date;
    }

    @sap.Label    : 'RFQ Supplier Details'
    @sap.QuickInfo: 'Supplier information for RFQ'
    entity ZC_RFQSupplierDetails {
            @sap.Label    : 'ID'
            @sap.QuickInfo: 'Unique identifier for supplier details'
        key ID         : UUID;

            @sap.Label    : 'Vendor Number'
            @sap.QuickInfo: 'Supplier identifier code'
            Lifnr      : String(10);

            @sap.Label    : 'Vendor Name'
            @sap.QuickInfo: 'Supplier business name'
            VendorName : String;
    }

    @sap.Label    : 'RFQ Process Flows'
    @sap.QuickInfo: 'Workflow tracking for RFQ processes'
    entity RFQProcessFlows {
            @sap.Label    : 'Workflow ID'
            @sap.QuickInfo: 'Unique workflow identifier'
        key WorkFlowID           : String(36);

            @sap.Label    : 'RFQ Number'
            @sap.QuickInfo: 'RFQ identifier number'
            RFQNumber            : String(36);

            @sap.Label    : 'Quotation Deadline'
            @sap.QuickInfo: 'Deadline for quotation submission'
            QuotationDeadline    : DateTime;

            @sap.Label    : 'Created By'
            @sap.QuickInfo: 'User who created the workflow'
            CreatedBy            : String(255);

            @sap.Label    : 'Created At'
            @sap.QuickInfo: 'Workflow creation timestamp'
            Suppliers            : array of SuppliersDetails;

            @sap.Label    : 'Created At'
            @sap.QuickInfo: 'Workflow creation timestamp'
            CreatedAt            : DateTime;

            @sap.Label    : 'Is Awarded'
            @sap.QuickInfo: 'Indicates if RFQ has been awarded'
            isAwarded            : Boolean default false;

            @sap.Label    : 'Awarded Date'
            @sap.QuickInfo: 'Date when RFQ was awarded'
            AwardedDate          : DateTime;

            @sap.Label    : 'Purchase Order Created'
            @sap.QuickInfo: 'Indicates if purchase order was created'
            purchaseOrderCreated : Boolean default false;

            @sap.Label    : 'Purchase Order Number'
            @sap.QuickInfo: 'Purchase order reference number'
            purchaseOrderNumber  : String(10);
    }

    @sap.Label    : 'RFQ Suppliers'
    @sap.QuickInfo: 'Workflow tracking for RFQ processes'
    // entity RFQSuppliers {
    //         @sap: {
    //             Label    : 'RFQ Number',
    //             QuickInfo: 'Request for Quotation Number'
    //         }
    //     key RfqNumber         : String(10);

    //         @sap: {
    //             Label    : 'Bidder ID',
    //             QuickInfo: 'Supplier/Bidder Identification Number'
    //         }
    //     key Bidder            : String(10);

    //         @sap: {
    //             Label    : 'Supplier Email',
    //             QuickInfo: 'Email of the Supplier/Bidder'
    //         }
    //         Email             : String(100);

    //         @sap: {
    //             Label    : 'Supplier Quotation',
    //             QuickInfo: 'Quotation Number provided by Supplier'
    //         }
    //         SupplierQuotation : String(20);

    //         @sap: {
    //             Label    : 'Total Quotation Value',
    //             QuickInfo: 'Total value of the quotation in specified currency'
    //         }
    //         QuotationValue    : Decimal(15, 2);

    //         @sap: {
    //             Label    : 'Total Score',
    //             QuickInfo: 'Overall score based on questionnaire responses'
    //         }
    //         TOTAL_SCORE       : Decimal(5, 2);

    //         @sap: {
    //             Label    : 'Material Count',
    //             QuickInfo: 'Number of materials/items in the quotation'
    //         }
    //         MaterialCount     : Integer;

    //         @sap: {
    //             Label    : 'Currency',
    //             QuickInfo: 'Currency used for quotation'
    //         }
    //         Currency          : String(5);

    //         @sap: {
    //             Label    : 'Is Awarded',
    //             QuickInfo: 'Indicates if this supplier has been awarded'
    //         }
    //         IsAwarded         : Boolean;

    //         @sap: {
    //             Label    : 'RFQ Awarded',
    //             QuickInfo: 'Indicates if the entire RFQ has been awarded'
    //         }
    //         RfqAwarded        : Boolean; // ← ADD THIS FIELD

    //         @sap: {
    //             Label    : 'Supplier Status',
    //             QuickInfo: 'Current status of the supplier quotation'
    //         }
    //         SupplierStatus    : String(20); // ← ALSO ADD THIS (you were returning it)

    //         @sap: {
    //             Label    : 'Created Date',
    //             QuickInfo: 'Date when the quotation was created'
    //         }
    //         CreatedDate       : DateTime;

    //         @sap: {
    //             Label    : 'Last Updated',
    //             QuickInfo: 'Date when the quotation was last updated'
    //         }
    //         LastUpdated       : DateTime;

    //         @sap: {
    //             Label    : 'Items',
    //             QuickInfo: 'List of materials/items in the quotation'
    //         }
    //         Items             : array of {
    //             @sap: {
    //                 Label    : 'Item Number',
    //                 QuickInfo: 'Line item number'
    //             }
    //             ItemNumber    : String(10);

    //             @sap: {
    //                 Label    : 'Material Number',
    //                 QuickInfo: 'Material identification number'
    //             }
    //             MaterialNo    : String(18);

    //             @sap: {
    //                 Label    : 'Material Description',
    //                 QuickInfo: 'Description of the material'
    //             }
    //             MaterialDesc  : String(40);

    //             @sap: {
    //                 Label    : 'Quantity',
    //                 QuickInfo: 'Requested quantity'
    //             }
    //             Quantity      : Decimal(13, 3);

    //             @sap: {
    //                 Label    : 'Unit Price',
    //                 QuickInfo: 'Price per unit'
    //             }
    //             Netpr         : Decimal(13, 2);

    //             @sap: {
    //                 Label    : 'Total Price',
    //                 QuickInfo: 'Total price for the item'
    //             }
    //             Netwr         : Decimal(15, 2);

    //             @sap: {
    //                 Label    : 'Unit of Measure',
    //                 QuickInfo: 'Measurement unit'
    //             }
    //             UnitOfMeasure : String(3);

    //             @sap: {
    //                 Label    : 'Plant',
    //                 QuickInfo: 'Plant location'
    //             }
    //             Plant         : String(4);

    //             @sap: {
    //                 Label    : 'Plant Address',
    //                 QuickInfo: 'Address of the plant'
    //             }
    //             PlantAddress  : String(100);

    //             @sap: {
    //                 Label    : 'Lot Type',
    //                 QuickInfo: 'Type of lot/material group'
    //             }
    //             LotType       : String(20);
    //         };
    // }

    entity RFQSuppliers {
            @sap: {
                Label    : 'RFQ Number',
                QuickInfo: 'Request for Quotation Number'
            }
        key RfqNumber          : String(10);

            @sap: {
                Label    : 'Bidder ID',
                QuickInfo: 'Supplier/Bidder Identification Number'
            }
        key Bidder             : String(10);

            @sap: {
                Label    : 'Vendor Name',
                QuickInfo: 'Name of the Supplier/Vendor'
            }
            VendorName         : String(100);

            @sap: {
                Label    : 'Supplier Email',
                QuickInfo: 'Email of the Supplier/Bidder'
            }
            Email              : String(100);

            @sap: {
                Label    : 'Supplier Quotation',
                QuickInfo: 'Quotation Number provided by Supplier'
            }
            SupplierQuotation  : String(20);

            @sap: {
                Label    : 'Total Quotation Value',
                QuickInfo: 'Total value of the quotation in specified currency'
            }
            QuotationValue     : Decimal(15, 2);

            @sap: {
                Label    : 'Total Score',
                QuickInfo: 'Overall score based on questionnaire responses'
            }
            TOTAL_SCORE        : Decimal(5, 2);

            @sap: {
                Label    : 'Maximum Possible Score',
                QuickInfo: 'Highest achievable score for this RFQ'
            }
            MAX_POSSIBLE_SCORE : Decimal(5, 2);

            @sap: {
                Label    : 'Percentage Score',
                QuickInfo: 'Percentage of total score achieved by supplier'
            }
            PERCENTAGE_SCORE   : Decimal(5, 2);

            @sap: {
                Label    : 'Material Count',
                QuickInfo: 'Number of materials/items in the quotation'
            }
            MaterialCount      : Integer;

            @sap: {
                Label    : 'Currency',
                QuickInfo: 'Currency used for quotation'
            }
            Currency           : String(5);

            @sap: {
                Label    : 'Is Awarded',
                QuickInfo: 'Indicates if this supplier has been awarded'
            }
            IsAwarded          : Boolean;

            @sap: {
                Label    : 'RFQ Awarded',
                QuickInfo: 'Indicates if the entire RFQ has been awarded'
            }
            RfqAwarded         : Boolean;

            @sap: {
                Label    : 'Supplier Status',
                QuickInfo: 'Current status of the supplier quotation'
            }
            SupplierStatus     : String(20);

            @sap: {
                Label    : 'Created Date',
                QuickInfo: 'Date when the quotation was created'
            }
            CreatedDate        : DateTime;

            @sap: {
                Label    : 'Last Updated',
                QuickInfo: 'Date when the quotation was last updated'
            }
            LastUpdated        : DateTime;

            @sap: {
                Label    : 'Items',
                QuickInfo: 'List of materials/items in the quotation'
            }
            Items              : array of {
                @sap: {
                    Label    : 'Item Number',
                    QuickInfo: 'Line item number'
                }
                ItemNumber    : String(10);

                @sap: {
                    Label    : 'Material Number',
                    QuickInfo: 'Material identification number'
                }
                MaterialNo    : String(18);

                @sap: {
                    Label    : 'Material Description',
                    QuickInfo: 'Description of the material'
                }
                MaterialDesc  : String(40);

                @sap: {
                    Label    : 'Quantity',
                    QuickInfo: 'Requested quantity'
                }
                Quantity      : Decimal(13, 3);

                @sap: {
                    Label    : 'Unit Price',
                    QuickInfo: 'Price per unit'
                }
                Netpr         : Decimal(13, 2);

                @sap: {
                    Label    : 'Total Price',
                    QuickInfo: 'Total price for the item'
                }
                Netwr         : Decimal(15, 2);

                @sap: {
                    Label    : 'Unit of Measure',
                    QuickInfo: 'Measurement unit'
                }
                UnitOfMeasure : String(3);

                @sap: {
                    Label    : 'Plant',
                    QuickInfo: 'Plant location'
                }
                Plant         : String(4);

                @sap: {
                    Label    : 'Plant Address',
                    QuickInfo: 'Address of the plant'
                }
                PlantAddress  : String(100);

                @sap: {
                    Label    : 'Lot Type',
                    QuickInfo: 'Type of lot/material group'
                }
                LotType       : String(20);
            };
    }

    @sap.Label    : 'RFQ Creation Logs'
    @sap.QuickInfo: 'Supplier information for RFQ'
    entity RFQCreationLogs : cuid {
        @sap.Label    : 'RFQ Number'
        @sap.QuickInfo: 'RFQ identifier'
        rfqNumber      : String(36);

        @sap.Label    : 'Status'
        @sap.QuickInfo: 'Creation status'
        status         : String(20);

        @sap.Label    : 'Created By'
        @sap.QuickInfo: 'User who performed the action'
        createdBy      : String(255);

        @sap.Label    : 'Items Count'
        @sap.QuickInfo: 'Number of items in the RFQ'
        itemsCount     : Integer;

        @sap.Label    : 'Suppliers Count'
        @sap.QuickInfo: 'Number of suppliers in the RFQ'
        suppliersCount : Integer;
    }

    @sap.Label    : 'Create RFQ'
    @sap.QuickInfo: 'Action to create a new Request for Quotation'
    action createRFQ(
                     @sap.Label: 'RFQ Project Name'
                     @sap.QuickInfo: 'Name of the RFQ project'
                     RFQProjectName: String,

                     @sap.Label: 'Reference Input'
                     @sap.QuickInfo: 'Reference information'
                     ReferenceInput: String,

                     @sap.Label: 'Quotation Deadline'
                     @sap.QuickInfo: 'Deadline for quotation submission'
                     QuotationDeadline: Date,

                     @sap.Label: 'Currency Code'
                     @sap.QuickInfo: 'Currency for the RFQ'
                     CurrencyCode: String,

                     @sap.Label: 'Payment Term Code'
                     @sap.QuickInfo: 'Payment terms code'
                     PaymentTermCode: String,

                     @sap.Label: 'Incoterm Code'
                     @sap.QuickInfo: 'Incoterms code'
                     IncoTermCode: String,

                     @sap.Label: 'Company Code'
                     @sap.QuickInfo: 'Company identifier'
                     CompanyCode: String,

                     @sap.Label: 'Purchase Org Code'
                     @sap.QuickInfo: 'Purchasing organization code'
                     PurchaseOrgCode: String,

                     @sap.Label: 'Purchase Group Code'
                     @sap.QuickInfo: 'Purchasing group code'
                     PurchaseGroupCode: String,

                     @sap.Label: 'Description'
                     @sap.QuickInfo: 'Additional RFQ description'
                     Description: String,

                     @sap.Label: 'RFQ Type'
                     @sap.QuickInfo: 'Type of RFQ (Material/Service)'
                     RFQType: String enum {
        @sap.QuickInfo: 'Material procurement RFQ'
        Material;
        @sap.QuickInfo: 'Service procurement RFQ'
        Service
    },

                     @sap.Label: 'RFQ Items'
                     @sap.QuickInfo: 'Array of RFQ line items'
                     RFQToItem: array of RFQItemsData,

                     @sap.Label: 'RFQ Suppliers'
                     @sap.QuickInfo: 'Array of RFQ suppliers'
                     RFQToSupplier: array of RFQSuppliersData) returns {
        @sap.Label: 'RFQ Number'  @sap.QuickInfo: 'Generated RFQ number'  rfqnumber   : String;

        @sap.Label: 'Message'     @sap.QuickInfo: 'Operation result message'  message : String;

        @sap.Label: 'Success'     @sap.QuickInfo: 'Operation success status'  success : Boolean
    };

    @sap.Label    : 'Award or Reject RFQ'
    @sap.QuickInfo: 'Action to award or reject an RFQ bid'
    action AwardorRejectRFQ(
                            @sap.Label: 'RFQ Number'
                            @sap.QuickInfo: 'RFQ identifier'
                            RfqNumber: String,

                            @sap.Label: 'Bidder'
                            @sap.QuickInfo: 'Supplier bidder code'
                            Bidder: String,

                            @sap.Label: 'Quotation Number'
                            @sap.QuickInfo: 'Quotation Number for awarded RFQ'
                            SupplierQuotation: String,

                            @sap.Label: 'New Status'
                            @sap.QuickInfo: 'New status for the RFQ'
                            NewStatus: String enum {
        @sap.QuickInfo: 'Reject the RFQ bid'
        Reject;
        @sap.QuickInfo: 'Award the RFQ to bidder'
        Award;
    },

                            @sap.Label: 'Remarks'
                            @sap.QuickInfo: 'Additional comments for status change'
                            Remarks: String)                   returns String;
}
