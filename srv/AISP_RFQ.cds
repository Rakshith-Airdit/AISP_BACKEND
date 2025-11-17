using ZC_AISP_RFQ_HDR_BND from './external/ZC_AISP_RFQ_HDR_BND.cds';
using {
    managed,
    cuid
} from '@sap/cds/common';

@sap.Label    : 'RFQ Management Service'
@sap.QuickInfo: 'Service for managing Request for Quotation (RFQ) processes, including supplier responses, attachments, and bid management'
service ZC_AISP_RFQ_HDR_BNDSampleService {

    @sap.Label    : 'Attachment Information'
    @sap.QuickInfo: 'Represents file attachments with name and URL'
    type Attachments           : {
        @sap.Label    : 'Attachment Name'
        @sap.QuickInfo: 'Name of the Attachment'
        AttachmentName : String(20);

        @sap.Label    : 'Attachment URL'
        @sap.QuickInfo: 'Attachment URL for file access'
        AttachmentURL  : String;
    };

    @sap.Label    : 'Additional Charges'
    @sap.QuickInfo: 'Extra costs associated with the RFQ'
    type Additional_Charges    : {
        @sap.Label    : 'Charge Name'
        @sap.QuickInfo: 'Name of the Additional Charge'
        Charge_Name  : String;

        @sap.Label    : 'Charge Price'
        @sap.QuickInfo: 'Price amount for the additional charge'
        Charge_Price : Integer;

        @sap.Label    : 'Charge Unit'
        @sap.QuickInfo: 'Unit of measurement for the charge'
        Charge_Unit  : String;
    };

    @sap.Label    : 'Additional Attachment'
    @sap.QuickInfo: 'Supplementary documents attached to RFQ'
    type Additional_Attachment : {
        @sap.Label    : 'Document ID'
        @sap.QuickInfo: 'Unique identifier for the document'
        DOCUMENT_ID : String;

        @sap.Label    : 'File Name'
        @sap.QuickInfo: 'Name of the attached file'
        FILE_NAME   : String;

        @sap.Label    : 'Description'
        @sap.QuickInfo: 'Brief description of the attachment'
        DESCRIPTION : String;

        @sap.Label    : 'File URL'
        @sap.QuickInfo: 'URL to access the file content'
        FILE_URL    : LargeString;
    };

    @sap.Label    : 'Supplier Response'
    @sap.QuickInfo: 'Supplier answers to RFQ questions'
    type SupplierResponse      : {
        @sap.Label    : 'Question ID'
        @sap.QuickInfo: 'Identifier for the question being answered'
        QUESTION_ID   : String;

        @sap.Label    : 'Response Text'
        @sap.QuickInfo: 'Suppliers answer to the question'
        RESPONSE_TEXT : String;
    };

    @sap.Label    : 'Attachment Response'
    @sap.QuickInfo: 'Supplier attachment submission with status'
    type AttachmentResponse    : {
        @sap.Label    : 'Document ID'
        @sap.QuickInfo: 'Unique document identifier'
        DOCUMENT_ID        : String;

        @sap.Label    : 'File Name'
        @sap.QuickInfo: 'Name of the attached file'
        FILE_NAME          : String null default '';

        @sap.Label    : 'Description'
        @sap.QuickInfo: 'Description of the attachment'
        DESCRIPTION        : String null default '';

        @sap.Label    : 'File URL'
        @sap.QuickInfo: 'URL to access the file'
        FILE_URL           : LargeString null default '';

        @sap.Label    : 'Is Present'
        @sap.QuickInfo: 'Indicates if attachment is provided'
        IS_PRESENT         : Boolean;

        @sap.Label    : 'Reason for Absence'
        @sap.QuickInfo: 'Explanation if attachment is not provided'
        REASON_FOR_ABSENCE : String null default '';
    };

    @sap.Label    : 'Draft Items'
    @sap.QuickInfo: 'Temporary items for RFQ draft processing'
    type DraftItems            : {
        @sap.Label    : 'RFQ Number'
        @sap.QuickInfo: 'Request for Quotation number'
        RfqNumber            : String;

        @sap.Label    : 'Item Number'
        @sap.QuickInfo: 'Line item identifier'
        ItemNumber           : String(5);

        @sap.Label    : 'Bidder'
        @sap.QuickInfo: 'Supplier/vendor identifier'
        Bidder               : String(10);

        @sap.Label    : 'Net Price'
        @sap.QuickInfo: 'Price excluding taxes and charges'
        Netpr                : Decimal(15, 2);

        @sap.Label    : 'Net Value'
        @sap.QuickInfo: 'Total value excluding taxes'
        Netwr                : Decimal(15, 2);

        @sap.Label    : 'Delivery Date'
        @sap.QuickInfo: 'Proposed delivery date'
        DeliveryDate         : Date;

        @sap.Label    : 'Expected Delivery Date'
        @sap.QuickInfo: 'Anticipated delivery date'
        ExpectedDeliveryDate : Date;
    };

    // Main Master Table - Data Fetched from S4 Hana
    @sap.Label    : 'RFQ Header'
    @sap.QuickInfo: 'Main header information for Request for Quotation'
    @readonly
    entity ZC_AISP_RFQ_HDR  as
        projection on ZC_AISP_RFQ_HDR_BND.ZC_AISP_RFQ_HDR {
                @sap.Label    : 'RFQ Number'
                @sap.QuickInfo: 'Unique identifier for the RFQ'
            key RfqNumber,

                @sap.Label    : 'Bidder'
                @sap.QuickInfo: 'Supplier/vendor code'
            key Bidder,

                @sap.Label    : 'Company Code'
                @sap.QuickInfo: 'Company code in SAP system'
                CompanyCode,

                @sap.Label    : 'Document Type'
                @sap.QuickInfo: 'Type of procurement document'
                DocumentType,

                @sap.Label    : 'Purchasing Org'
                @sap.QuickInfo: 'Purchasing organization code'
                PurchasingOrg,

                @sap.Label    : 'Purchasing Group'
                @sap.QuickInfo: 'Purchasing group responsible'
                PurchasingGroup,

                @sap.Label    : 'Document Date'
                @sap.QuickInfo: 'Date when document was created'
                DocumentDate,

                @sap.Label    : 'Price Unit'
                @sap.QuickInfo: 'Unit for price calculation'
                PriceUnit,

                @sap.Label    : 'Deadline Date'
                @sap.QuickInfo: 'Submission deadline date'
                Deadline_dt,

                @sap.Label    : 'Published Date'
                @sap.QuickInfo: 'Date when RFQ was published'
                Published_d,

                @sap.Label    : 'Created By'
                @sap.QuickInfo: 'User who created the RFQ'
                CreatedBy,

                @sap.Label    : 'Published Time'
                @sap.QuickInfo: 'Time when RFQ was published'
                Published_t,

                @sap.Label    : 'Vendor Name'
                @sap.QuickInfo: 'Name of the vendor/supplier'
                VendorName,

                @sap.Label    : 'Email'
                @sap.QuickInfo: 'Contact email address'
                Email,

                @sap.Label    : 'Vendor Account Group'
                @sap.QuickInfo: 'Vendor account group classification'
                VendorAccgrp,

                @sap.Label    : 'Vendor Account Group Name'
                @sap.QuickInfo: 'Name of vendor account group'
                VendorAccgrpName,

                @sap.Label    : 'Target Value'
                @sap.QuickInfo: 'Target budget value for RFQ'
                TargetValue,

                @sap.Label    : 'Status'
                @sap.QuickInfo: 'Current status of the RFQ'
                Status,

                @sap.Label    : 'Payment Description'
                @sap.QuickInfo: 'Payment terms description'
                PymentDesc,

                @sap.Label    : 'Published Date Time'
                @sap.QuickInfo: 'Combined publish date and time'
                Published_d_t
        };

    // Main Master Table
    @sap.Label    : 'RFQ Items'
    @sap.QuickInfo: 'Line items details for Request for Quotation'
    @readonly
    entity ZC_AISP_RFQ_ITEM as
        projection on ZC_AISP_RFQ_HDR_BND.ZC_AISP_RFQ_ITEM {
                @sap.Label    : 'RFQ Number'
                @sap.QuickInfo: 'RFQ identifier'
            key RfqNumber,

                @sap.Label    : 'Item Number'
                @sap.QuickInfo: 'Line item number'
            key ItemNumber,

                @sap.Label    : 'Bidder'
                @sap.QuickInfo: 'Supplier identifier'
            key Bidder,

                @sap.Label    : 'Material Number'
                @sap.QuickInfo: 'Material code'
                MaterialNo,

                @sap.Label    : 'Material Description'
                @sap.QuickInfo: 'Description of the material'
                MaterialDesc,

                @sap.Label    : 'Lot Type'
                @sap.QuickInfo: 'Type of procurement lot'
                LotType,

                @sap.Label    : 'Unit of Measure'
                @sap.QuickInfo: 'Measurement unit'
                UnitOfMeasure,

                @sap.Label    : 'Currency'
                @sap.QuickInfo: 'Currency code'
                Currency,

                @sap.Label    : 'Plant Address'
                @sap.QuickInfo: 'Delivery plant address'
                PlantAddress,

                @sap.Label    : 'Quantity'
                @sap.QuickInfo: 'Requested quantity'
                Quantity,

                @sap.Label    : 'Plant'
                @sap.QuickInfo: 'Delivery plant code'
                Plant,

                @sap.Label    : 'Net Price'
                @sap.QuickInfo: 'Unit price excluding taxes'
                Netpr,

                @sap.Label    : 'Net Value'
                @sap.QuickInfo: 'Total value excluding taxes'
                Netwr,

                @sap.Label    : 'Basic Longtext'
                @sap.QuickInfo: 'Detailed description text'
                basic_longtext
        };

    @sap.Label    : 'RFQ Work Header'
    @sap.QuickInfo: 'Work in progress RFQ header information'
    entity ZC_AISP_RFQ_WORK_HDR {
                @sap.Label    : 'RFQ Number'
                @sap.QuickInfo: 'Unique RFQ identifier'
        key RfqNumber                     : String;

                @sap.Label    : 'Bidder'
                @sap.QuickInfo: 'Supplier code'
        key Bidder                        : String(10);

                @sap.Label    : 'Company Code'
                @sap.QuickInfo: 'Company code'
            CompanyCode                   : String(4);

                @sap.Label    : 'Document Type'
                @sap.QuickInfo: 'Document type code'
            DocumentType                  : String(2);

                @sap.Label    : 'Purchasing Organization'
                @sap.QuickInfo: 'Purchasing org code'
            PurchasingOrg                 : String(4);

                @sap.Label    : 'Purchasing Group'
                @sap.QuickInfo: 'Purchasing group code'
            PurchasingGroup               : String(3);

                @sap.Label    : 'Document Date'
                @sap.QuickInfo: 'Document creation date'
            DocumentDate                  : Date;

                @sap.Label    : 'Price Unit'
                @sap.QuickInfo: 'Price calculation unit'
            PriceUnit                     : String(3);

                @sap.Label    : 'Deadline Date'
                @sap.QuickInfo: 'Submission deadline'
            Deadline_dt                   : Date;

                @sap.Label    : 'Published Date'
                @sap.QuickInfo: 'Publication date'
            Published_d                   : Date;

                @sap.Label    : 'Created By'
                @sap.QuickInfo: 'Creator user ID'
            CreatedBy                     : String(20);

                @sap.Label    : 'Published Time'
                @sap.QuickInfo: 'Publication time'
            Published_t                   : Time;

                @sap.Label    : 'Vendor Name'
                @sap.QuickInfo: 'Supplier name'
            VendorName                    : String(100);

                @sap.Label    : 'Email ID'
                @sap.QuickInfo: 'Contact email'
            Email                         : String(100);

                @sap.Label    : 'Vendor Account Group'
                @sap.QuickInfo: 'Vendor account group'
            VendorAccgrp                  : String(4);

                @sap.Label    : 'Vendor Account Group Name'
                @sap.QuickInfo: 'Account group name'
            VendorAccgrpName              : String(50);

                @sap.Label    : 'Target Value'
                @sap.QuickInfo: 'Budget target value'
            TargetValue                   : Decimal(15, 2);

                @sap.Label    : 'Status'
                @sap.QuickInfo: 'Current RFQ status'
            Status                        : String enum {

                @sap.QuickInfo: 'Awaiting supplier response'
        Pending;

                @sap.QuickInfo: 'Supplier accepted the RFQ'
        Accepted;

                @sap.QuickInfo: 'Supplier declined the RFQ'
        Not_Accepted;

                @sap.QuickInfo: 'Response submitted by supplier'
        Submitted;

                @sap.QuickInfo: 'Draft response in progress'
        Draft;

                @sap.QuickInfo: 'RFQ awarded to supplier'
        Awarded;

                @sap.QuickInfo: 'RFQ rejected'
        Rejected;
        };

                @sap.Label    : 'Payment Description'
                @sap.QuickInfo: 'Payment terms info'
            PymentDesc                    : String(100);

                @sap.Label    : 'Published Datetime'
                @sap.QuickInfo: 'Full publication timestamp'
            Published_d_t                 : String(50);

                @sap.Label    : 'Created On'
                @sap.QuickInfo: 'Record creation timestamp'
            CREATED_ON                    : Timestamp;

                @sap.Label    : 'Last Updated On'
                @sap.QuickInfo: 'Last update timestamp'
            LAST_UPDATED_ON               : Timestamp;

                @sap.Label    : 'Additional Charges Present'
                @sap.QuickInfo: 'Indicates if extra charges exist'
            Additional_Charge_Present     : Boolean default false;

                @sap.Label    : 'Additional Charges'
                @sap.QuickInfo: 'List of additional costs'
            Additional_Charges            : array of Additional_Charges;

                @sap.Label    : 'Remarks'
                @sap.QuickInfo: 'Additional comments or notes'
            Remarks                       : String;

                @sap.Label    : 'Additional Attachment Present'
                @sap.QuickInfo: 'Indicates if extra attachments exist'
            Additional_Attachment_Present : Boolean default false;

                @sap.Label    : 'Additional Attachments'
                @sap.QuickInfo: 'Supplementary documents'
            Additional_Attachments        : array of Additional_Attachment;

                @sap.Label    : 'Response Status'
                @sap.QuickInfo: 'Status of question responses'
                @default.Pending
            ResponseStatus                : String enum {

                @sap.QuickInfo: 'Responses pending'
        Pending;

                @sap.QuickInfo: 'Responses provided'
        Answered;

                @sap.QuickInfo: 'All responses completed'
        Completed;
        };

                @sap.Label    : 'Attachment Status'
                @sap.QuickInfo: 'Status of document attachments'
                @default.Pending
            AttachmentStatus              : String enum {

                @sap.QuickInfo: 'Attachments pending'
        Pending;

                @sap.QuickInfo: 'Attachments provided'
        Answered;

                @sap.QuickInfo: 'All attachments completed'
        Completed;
        };

                @sap.Label    : 'Supplier Quotation'
                @sap.QuickInfo: 'Supplier quotation reference'
            SupplierQuotation             : String(20);
    }

    @sap.Label    : 'RFQ Work Item'
    @sap.QuickInfo: 'Work in progress RFQ line items'
    entity ZC_AISP_RFQ_WORK_ITEM {
            @sap.Label    : 'RFQ Number'
            @sap.QuickInfo: 'RFQ identifier'
        key RfqNumber            : String;

            @sap.Label    : 'Item Number'
            @sap.QuickInfo: 'Line item number'
        key ItemNumber           : String(5);

            @sap.Label    : 'Bidder'
            @sap.QuickInfo: 'Supplier code'
        key Bidder               : String(10);

            @sap.Label    : 'Material Number'
            @sap.QuickInfo: 'Material code'
            MaterialNo           : String(18);

            @sap.Label    : 'Material Description'
            @sap.QuickInfo: 'Material description'
            MaterialDesc         : String(100);

            @sap.Label    : 'Lot Type'
            @sap.QuickInfo: 'Procurement lot type'
            LotType              : String(50);

            @sap.Label    : 'Unit of Measure'
            @sap.QuickInfo: 'Measurement unit'
            UnitOfMeasure        : String(3);

            @sap.Label    : 'Currency'
            @sap.QuickInfo: 'Currency code'
            Currency             : String(3);

            @sap.Label    : 'Plant Address'
            @sap.QuickInfo: 'Delivery plant address'
            PlantAddress         : String(200);

            @sap.Label    : 'Quantity'
            @sap.QuickInfo: 'Requested quantity'
            Quantity             : Decimal(15, 3);

            @sap.Label    : 'Plant'
            @sap.QuickInfo: 'Delivery plant code'
            Plant                : String(4);

            @sap.Label    : 'Net Price'
            @sap.QuickInfo: 'Unit price excluding taxes'
            Netpr                : Decimal(15, 2);

            @sap.Label    : 'Net Value'
            @sap.QuickInfo: 'Total value excluding taxes'
            Netwr                : Decimal(15, 2);

            @sap.Label    : 'Basic Longtext'
            @sap.QuickInfo: 'Detailed description'
            basic_longtext       : String(5000);

            @sap.Label    : 'Total Price'
            @sap.QuickInfo: 'Total price including all charges'
            TOTAL_PRICE          : Decimal(15, 2);

            @sap.Label    : 'Created On'
            @sap.QuickInfo: 'Creation timestamp'
            CREATED_ON           : Timestamp;

            @sap.Label    : 'Last Updated On'
            @sap.QuickInfo: 'Last update timestamp'
            LAST_UPDATED_ON      : Timestamp;

            @sap.Label    : 'Confirmation Status'
            @sap.QuickInfo: 'Item confirmation status'
            Confirmation_Status  : Boolean;

            @sap.Label    : 'Delivery Date'
            @sap.QuickInfo: 'Proposed delivery date'
            DeliveryDate         : Date;

            @sap.Label    : 'Expected Delivery Date'
            @sap.QuickInfo: 'Estimated delivery date'
            ExpectedDeliveryDate : Date;
    }

    @sap.Label    : 'Supplier Prerequisite Questions'
    @sap.QuickInfo: 'Pre-qualification questions for suppliers'
    entity SupplierPreReqQstns {
            @sap.Label    : 'Question ID'
            @sap.QuickInfo: 'Unique question identifier'
        key QUESTION_ID      : String;

            @sap.Label    : 'Account Group'
            @sap.QuickInfo: 'Vendor account group reference'
            ACCOUNT_GROUP    : String;

            @sap.Label    : 'Question Text'
            @sap.QuickInfo: 'Question content'
            QUESTION_TEXT    : String;

            @sap.Label    : 'Question Type'
            @sap.QuickInfo: 'Type of question (text, dropdown, etc.)'
            QUESTION_TYPE    : String;

            @sap.Label    : 'Is Mandatory'
            @sap.QuickInfo: 'Whether answer is required'
            IS_MANDATORY     : Boolean;

            @sap.Label    : 'Dropdown Values'
            @sap.QuickInfo: 'Options for dropdown questions'
            DROPDOWN_OPTIONS : String;

            @sap.Label    : 'Section'
            @sap.QuickInfo: 'Question category section'
            SECTION          : String;

            @sap.Label    : 'Order'
            @sap.QuickInfo: 'Display order sequence'
            ORDER            : Integer;

            @sap.Label    : 'Is Active'
            @sap.QuickInfo: 'Question active status'
            IS_ACTIVE        : Boolean;

            @sap.Label    : 'Allocated Points'
            @sap.QuickInfo: 'Scoring points for evaluation'
            ALLOTTED_POINTS  : Integer null;
    }

    @sap.Label    : 'Supplier Responses'
    @sap.QuickInfo: 'Supplier answers to prerequisite questions'
    entity SupplierResponses {
            @sap.Label    : 'RFQ Number'
            @sap.QuickInfo: 'RFQ identifier'
        key RfqNumber     : String;

            @sap.Label    : 'Bidder'
            @sap.QuickInfo: 'Supplier code'
            Bidder        : String;

            @sap.Label    : 'Account Group'
            @sap.QuickInfo: 'Vendor account group'
            ACCOUNT_GROUP : String;

            @sap.Label    : 'Responses'
            @sap.QuickInfo: 'Array of question responses'
            RESPONSES     : array of SupplierResponse;
    }

    @sap.Label    : 'Supplier Prerequisite Attachments'
    @sap.QuickInfo: 'Required documents for supplier pre-qualification'
    entity SupplierPreReqAttchmnts {
            @sap.Label    : 'Document ID'
            @sap.QuickInfo: 'Unique document identifier'
        key DOCUMENT_ID   : String;

            @sap.Label    : 'File Name'
            @sap.QuickInfo: 'Document file name'
            FILE_NAME     : String;

            @sap.Label    : 'Account Group'
            @sap.QuickInfo: 'Vendor account group'
            ACCOUNT_GROUP : String;

            @sap.Label    : 'Description'
            @sap.QuickInfo: 'Document description'
            DESCRIPTION   : String;

            @sap.Label    : 'Upload Date'
            @sap.QuickInfo: 'Document upload timestamp'
            UPLOAD_DATE   : DateTime;
    }

    @sap.Label    : 'Supplier Attachments'
    @sap.QuickInfo: 'Documents submitted by suppliers for RFQ'
    entity SupplierAttachments {
            @sap.Label    : 'RFQ Number'
            @sap.QuickInfo: 'RFQ identifier'
        key RfqNumber     : String;

            @sap.Label    : 'Bidder'
            @sap.QuickInfo: 'Supplier code'
            Bidder        : String;

            @sap.Label    : 'Account Group'
            @sap.QuickInfo: 'Vendor account group'
            ACCOUNT_GROUP : String;

            @sap.Label    : 'Responses'
            @sap.QuickInfo: 'Array of attachment responses'
            Attachments   : array of AttachmentResponse;
    }

    @sap.Label    : 'RFQ Draft'
    @sap.QuickInfo: 'Draft version of RFQ for editing'
    @Capabilities : {Updatable: true}
    entity ZC_AISP_RFQ_DRAFT {
                @sap.Label    : 'RFQ Number'
                @sap.QuickInfo: 'RFQ identifier'
        key RfqNumber                     : String;

                @sap.Label    : 'Bidder'
                @sap.QuickInfo: 'Supplier code'
        key Bidder                        : String(10);

                @sap.Label    : 'Company Code'
                @sap.QuickInfo: 'Company code'
            CompanyCode                   : String(4);

                @sap.Label    : 'Document Type'
                @sap.QuickInfo: 'Document type code'
            DocumentType                  : String(2);

                @sap.Label    : 'Purchasing Organization'
                @sap.QuickInfo: 'Purchasing org code'
            PurchasingOrg                 : String(4);

                @sap.Label    : 'Purchasing Group'
                @sap.QuickInfo: 'Purchasing group code'
            PurchasingGroup               : String(3);

                @sap.Label    : 'Document Date'
                @sap.QuickInfo: 'Document creation date'
            DocumentDate                  : Date;

                @sap.Label    : 'Price Unit'
                @sap.QuickInfo: 'Price calculation unit'
            PriceUnit                     : String(3);

                @sap.Label    : 'Deadline Date'
                @sap.QuickInfo: 'Submission deadline'
            Deadline_dt                   : Date;

                @sap.Label    : 'Published Date'
                @sap.QuickInfo: 'Publication date'
            Published_d                   : Date;

                @sap.Label    : 'Created By'
                @sap.QuickInfo: 'Creator user ID'
            CreatedBy                     : String(20);

                @sap.Label    : 'Published Time'
                @sap.QuickInfo: 'Publication time'
            Published_t                   : Time;

                @sap.Label    : 'Vendor Name'
                @sap.QuickInfo: 'Supplier name'
            VendorName                    : String(100);

                @sap.Label    : 'Email ID'
                @sap.QuickInfo: 'Contact email'
            Email                         : String(100);

                @sap.Label    : 'Vendor Account Group'
                @sap.QuickInfo: 'Vendor account group'
            VendorAccgrp                  : String(4);

                @sap.Label    : 'Vendor Account Group Name'
                @sap.QuickInfo: 'Account group name'
            VendorAccgrpName              : String(50);

                @sap.Label    : 'Target Value'
                @sap.QuickInfo: 'Budget target value'
            TargetValue                   : Decimal(15, 2);

                @sap.Label    : 'Status'
                @sap.QuickInfo: 'Draft status'
            Status                        : String enum {

                @sap.QuickInfo: 'Draft in progress'
        Pending;

                @sap.QuickInfo: 'Draft submitted'
        Submitted;

                @sap.QuickInfo: 'RFQ awarded'
        Awarded;

                @sap.QuickInfo: 'Draft accepted'
        Accepted;

                @sap.QuickInfo: 'Draft not accepted'
        Not_Accepted;

                @sap.QuickInfo: 'Draft rejected'
        Rejected;

                @sap.QuickInfo: 'Draft being edited'
        Draft;
        };

                @sap.Label    : 'Payment Description'
                @sap.QuickInfo: 'Payment terms info'
            PymentDesc                    : String(100);

                @sap.Label    : 'Published Datetime'
                @sap.QuickInfo: 'Publication timestamp'
            Published_d_t                 : String(50);

                @sap.Label    : 'Created On'
                @sap.QuickInfo: 'Creation timestamp'
            CREATED_ON                    : Timestamp;

                @sap.Label    : 'Last Updated On'
                @sap.QuickInfo: 'Last update timestamp'
            LAST_UPDATED_ON               : Timestamp;

                @sap.Label    : 'Additional Charges Present'
                @sap.QuickInfo: 'Extra charges indicator'
            Additional_Charge_Present     : Boolean default false;

                @sap.Label    : 'Additional Charges'
                @sap.QuickInfo: 'Additional cost items'
            Additional_Charges            : array of Additional_Charges;

                @sap.Label    : 'Remarks'
                @sap.QuickInfo: 'Additional comments'
            Remarks                       : String;

                @sap.Label    : 'Additional Attachment Present'
                @sap.QuickInfo: 'Extra attachments indicator'
            Additional_Attachment_Present : Boolean default false;

                @sap.Label    : 'Additional Attachments'
                @sap.QuickInfo: 'Supplementary documents'
            Additional_Attachments        : array of Additional_Attachment;

                @sap.Label    : 'Items'
                @sap.QuickInfo: 'Draft line items'
            items                         : array of DraftItems;
    }

    @sap.Label    : 'RFQ Status'
    @sap.QuickInfo: 'Available RFQ status values'
    entity RFQ_status {
            @sap.Label    : 'Status'
            @sap.QuickInfo: 'RFQ status code'
        key Status : String;
    }

    @sap.Label    : 'RFQ Number Value Help'
    @sap.QuickInfo: 'Value help for RFQ numbers'
    entity VH_RfqNumber {
            @sap.Label    : 'RFQ Number'
            @sap.QuickInfo: 'RFQ identifier'
        key RfqNumber : String;
    }

    @sap.Label    : 'Draft RFQ Number Value Help'
    @sap.QuickInfo: 'Value help for draft RFQ numbers'
    entity VH_RfqNumber_Draft {
            @sap.Label    : 'RFQ Number'
            @sap.QuickInfo: 'Draft RFQ identifier'
        key RfqNumber : String;
    }

    @sap.Label    : 'Draft Bidder Value Help'
    @sap.QuickInfo: 'Value help for draft bidders'
    entity VH_Bidder_Draft {
            @sap.Label    : 'Bidder'
            @sap.QuickInfo: 'Draft supplier code'
        key Bidder : String;
    }

    @sap.Label    : 'Bidder Value Help'
    @sap.QuickInfo: 'Value help for bidders'
    entity VH_Bidder {
            @sap.Label    : 'Bidder'
            @sap.QuickInfo: 'Supplier code'
        key Bidder : String;
    }

    @sap.Label    : 'Set RFQ Status'
    @sap.QuickInfo: 'Update the status of an RFQ (accept/reject)'
    action setRFQStatus(
                        @sap.Label: 'RFQ Number'
                        @sap.QuickInfo: 'RFQ to update'
                        RfqNumber: String,

                        @sap.Label: 'Bidder'
                        @sap.QuickInfo: 'Supplier code'
                        Bidder: String,

                        @sap.Label: 'Action'
                        @sap.QuickInfo: 'Status change action'
                        Action: String enum {
        @sap.QuickInfo: 'Accept the RFQ'
        accept;
        @sap.QuickInfo: 'Reject the RFQ'
        reject;
    },

                        @sap.Label: 'Remarks'
                        @sap.QuickInfo: 'Optional comments for status change'
                        Remarks: String)                                            returns String;

    @sap.Label    : 'Save RFQ Response'
    @sap.QuickInfo: 'Save supplier responses and attachments'
    action saveRFQResponseAndAttachments(
                                         @sap.Label: 'RFQ Number'
                                         @sap.QuickInfo: 'RFQ identifier'
                                         RfqNumber: String,

                                         @sap.Label: 'Bidder'
                                         @sap.QuickInfo: 'Supplier code'
                                         Bidder: String,

                                         @sap.Label: 'Account Group'
                                         @sap.QuickInfo: 'Vendor account group'
                                         ACCOUNT_GROUP: String,

                                         @sap.Label: 'Responses'
                                         @sap.QuickInfo: 'Question responses array'
                                         Responses: array of SupplierResponse,

                                         @sap.Label: 'Attachments'
                                         @sap.QuickInfo: 'Document attachments array'
                                         Attachments: array of AttachmentResponse)  returns String;


    @sap.Label    : 'Edit RFQ Responses'
    @sap.QuickInfo: 'Modify existing supplier responses and attachments'
    action editRFQResponsesAndAttachments(
                                          @sap.Label: 'RFQ Number'
                                          @sap.QuickInfo: 'RFQ identifier'
                                          RfqNumber: String,

                                          @sap.Label: 'Bidder'
                                          @sap.QuickInfo: 'Supplier code'
                                          Bidder: String,

                                          @sap.Label: 'Account Group'
                                          @sap.QuickInfo: 'Vendor account group'
                                          ACCOUNT_GROUP: String,

                                          @sap.Label: 'Responses'
                                          @sap.QuickInfo: 'Updated responses array'
                                          Responses: array of SupplierResponse,

                                          @sap.Label: 'Attachments'
                                          @sap.QuickInfo: 'Updated attachments array'
                                          Attachments: array of AttachmentResponse) returns String;

    @sap.Label    : 'Delete RFQ Attachment'
    @sap.QuickInfo: 'Remove a specific attachment from RFQ'
    action deleteRFQAttachment(
                               @sap.Label: 'RFQ Number'
                               @sap.QuickInfo: 'RFQ identifier'
                               RfqNumber: String,

                               @sap.Label: 'Bidder'
                               @sap.QuickInfo: 'Supplier code'
                               Bidder: String,

                               @sap.Label: 'Account Group'
                               @sap.QuickInfo: 'Vendor account group'
                               ACCOUNT_GROUP: String,

                               @sap.Label: 'Document ID'
                               @sap.QuickInfo: 'Attachment to delete'
                               DOCUMENT_ID: String)                                 returns String;

    @sap.Label    : 'Generate Mass Upload Excel'
    @sap.QuickInfo: 'Create Excel template for bulk data upload'
    action generateMassUploadExcel(
                                   @sap.Label: 'RFQ Number'
                                   @sap.QuickInfo: 'RFQ identifier'
                                   RfqNumber: String,

                                   @sap.Label: 'Bidder'
                                   @sap.QuickInfo: 'Supplier code'
                                   Bidder: String)                                  returns String;

    @sap.Label    : 'Submit RFQ'
    @sap.QuickInfo: 'Final submission of RFQ with all details'
    action SubmitRFQ(
                     @sap.Label: 'RFQ Number'
                     @sap.QuickInfo: 'RFQ identifier'
                     RfqNumber: String,

                     @sap.Label: 'Bidder'
                     @sap.QuickInfo: 'Supplier code'
                     Bidder: String,

                     @sap.Label: 'Items'
                     @sap.QuickInfo: 'RFQ line items array'
                     items: array of ZC_AISP_RFQ_WORK_ITEM,

                     @sap.Label: 'Additional Charges Present'
                     @sap.QuickInfo: 'Extra charges indicator'
                     Additional_Charge_Present: Boolean,

                     @sap.Label: 'Additional Charges'
                     @sap.QuickInfo: 'Additional cost items'
                     Additional_Charges: array of Additional_Charges,

                     @sap.Label: 'Remarks'
                     @sap.QuickInfo: 'Additional comments'
                     Remarks: String,

                     @sap.Label: 'Additional Attachment Present'
                     @sap.QuickInfo: 'Extra attachments indicator'
                     Additional_Attachment_Present: Boolean,

                     @sap.Label: 'Additional Attachments'
                     @sap.QuickInfo: 'Supplementary documents'
                     Additional_Attachments: array of AttachmentResponse)           returns String;

    @sap.Label    : 'Edit RFQ'
    @sap.QuickInfo: 'Modify existing RFQ details'
    action EditRFQ(
                   @sap.Label: 'RFQ Number'
                   @sap.QuickInfo: 'RFQ identifier'
                   RfqNumber: String,

                   @sap.Label: 'Bidder'
                   @sap.QuickInfo: 'Supplier code'
                   Bidder: String,

                   @sap.Label: 'Items'
                   @sap.QuickInfo: 'Updated line items array'
                   Items: array of ZC_AISP_RFQ_WORK_ITEM,

                   @sap.Label: 'Additional Charges Present'
                   @sap.QuickInfo: 'Updated charges indicator'
                   Additional_Charge_Present: Boolean,

                   @sap.Label: 'Additional Charges'
                   @sap.QuickInfo: 'Updated cost items'
                   Additional_Charges: array of Additional_Charges,

                   @sap.Label: 'Remarks'
                   @sap.QuickInfo: 'Updated comments'
                   Remarks: String,

                   @sap.Label: 'Additional Attachment Present'
                   @sap.QuickInfo: 'Updated attachments indicator'
                   Additional_Attachment_Present: Boolean,

                   @sap.Label: 'Additional Attachments'
                   @sap.QuickInfo: 'Updated documents'
                   Additional_Attachments: array of AttachmentResponse)             returns String;

    action updateSAPItems(SupplierQuotation: String,
                          ItemNumber: String,
                          NetPriceAmount: Integer)                                  returns {
        success         : Boolean;
        message         : String;
        processedItems  : Integer;
        quotationNumber : String;
        timestamp       : String;
    };
}
