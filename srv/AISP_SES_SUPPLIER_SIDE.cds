using ZP_AISP_SES_UPSES_SRB from './external/ZP_AISP_SES_UPSES_SRB.cds';

service ZP_AISP_SES_UPSES_SRBSampleService {
    @readonly
    entity ZP_AISP_SES_ITEM_DETAIL as
        projection on ZP_AISP_SES_UPSES_SRB.ZP_AISP_SES_ITEM_DETAIL {
                Delete_mc,
                Update_mc,
            key Ebeln,
            key Ebelp,
            key packno,
            key introw,
                packageNofromPO,
                sub_packno,
                extrow,
                srvpos,
                menge,
                waers,
                tbtwr,
                netwr,
                meins,
                ktext1,
                act_menge,
                final_entry,
                shortText,
                sitePerson,
                personresp,
                from_date,
                end_date,
                SESLineItemStatus,
                TOTAL_ACTVALUE,
                TOTAL_SUMLIMIT,
                pending_limit,
                asktx
        };

    @readonly
    entity ZP_AISP_SES_HDR         as
        projection on ZP_AISP_SES_UPSES_SRB.ZP_AISP_SES_HDR {
                Delete_mc,
                Update_mc,
                to_sesitems_oc,
            key Ebeln,
                Bukrs,
                Bstyp,
                Bsart,
                Aedat,
                Ernam,
                Lifnr,
                LIFNR_NAME,
                Ekorg,
                Ekgrp,
                Waers,
                Amount,
                HeaderStaus,
                ServicePOType,
                person_res_intr,
                person_res_extr,
                location,
                short_text,
                from_date,
                end_date,
        };

    @readonly
    entity ZI_AISP_ServicesVH      as
        projection on ZP_AISP_SES_UPSES_SRB.ZI_AISP_ServicesVH {
            key ServiceNumber,
            key LanguageKey,
                UnitOfMesure,
                ServiceText
        };

    entity SES_HEAD_MINIMAL_DATA   as projection on SES_Head;

    entity SESHeaderList {
            @sap.label    : 'PO Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order'
        key Ebeln         : String;

            @sap.label    : 'Company Code'
            @sap.quickinfo: 'Company code responsible for the purchase order'
            Bukrs         : String;

            @sap.label    : 'Document Category'
            @sap.quickinfo: 'High-level classification of the purchasing document'
            Bstyp         : String;

            @sap.label    : 'Document Type'
            @sap.quickinfo: 'Type/category of the purchase order (e.g., Standard, Service)'
            Bsart         : String;

            @sap.label    : 'Order Date'
            @sap.quickinfo: 'Date on which the purchase order was created'
            Aedat         : Date;

            @sap.label    : 'Created By'
            @sap.quickinfo: 'User ID of the person who created the purchase order'
            Ernam         : String;

            @sap.label    : 'Supplier Code'
            @sap.quickinfo: 'Unique identifier of the supplier (LIFNR)'
            Lifnr         : String;

            @sap.label    : 'Supplier Name'
            @sap.quickinfo: 'Full name of the supplier associated with the PO'
            LIFNR_NAME    : String;

            @sap.label    : 'Purchasing Organization'
            @sap.quickinfo: 'Organization unit responsible for procurement'
            Ekorg         : String;

            @sap.label    : 'Purchasing Group'
            @sap.quickinfo: 'Buyer or group responsible for managing the PO'
            Ekgrp         : String;

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Transaction currency code (e.g., INR, USD, EUR)'
            Waers         : String;

            @sap.label    : 'PO Amount'
            @sap.quickinfo: 'Total purchase order value in the given currency'
            Amount        : Decimal(15, 2);

            @sap.label    : 'Status'
            @sap.quickinfo: 'Overall processing status of the purchase order'
            HeaderStaus   : String;

            @sap.label    : 'PO Service Type'
            @sap.quickinfo: 'Type of service purchase order (e.g., SES, Limit, Standard Service)'
            ServicePOType : String;
    }

    entity SESItemList {
            @sap.label    : 'PO Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order'
        key PO_NUMBER           : String;

            @sap.label    : 'Item Number'
            @sap.quickinfo: 'Item number within the Purchase Order'
        key ITEM_NUMBER         : String;

            @sap.label    : 'Serial Number'
            @sap.quickinfo: 'Sequential number of the SES item'
            SR_NO               : String;

            @sap.label    : 'Service Number'
            @sap.quickinfo: 'Unique identifier of the service from the service master'
            SERVICE_NUMBER      : String;

            @sap.label    : 'Service Description'
            @sap.quickinfo: 'Detailed description of the service performed'
            SERVICE_DESCRIPTION : String;

            @sap.label    : 'Ordered Quantity'
            @sap.quickinfo: 'Quantity of service ordered in the purchase order'
            ORDERED_QUANTITY    : Integer;

            @sap.label    : 'Unit of Measure'
            @sap.quickinfo: 'Measurement unit for the service (e.g., HRS, EA)'
            UNIT_OF_MEASURE     : String;

            @sap.label    : 'Unit Price'
            @sap.quickinfo: 'Price per unit of the service'
            UNIT_PRICE          : Integer;

            @sap.label    : 'Serviced Quantity'
            @sap.quickinfo: 'Quantity of service actually provided'
            SERVICE_QUANTITY    : Integer;

            @sap.label    : 'Total Price'
            @sap.quickinfo: 'Total calculated price for the service line item'
            TOTAL_PRICE         : Integer;

            @sap.label    : 'Pending Limit'
            @sap.quickinfo: 'Remaining limit available for service posting'
            PENDING_LIMIT       : Integer;

            @sap.label    : 'Package Number'
            @sap.quickinfo: 'Package number grouping service items in the SES'
            packno              : String;

            @sap.label    : 'Internal Row'
            @sap.quickinfo: 'Technical row identifier used internally'
            introw              : String;

            @sap.label    : 'Package Number from PO'
            @sap.quickinfo: 'Package number reference from the Purchase Order'
            packageNofromPO     : String;

            @sap.label    : 'Status'
            @sap.quickinfo: 'Processing status of the SES item (e.g., Open, Approved, Rejected)'
            STATUS              : String;
    }

    entity SES_Head {
            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for the Service Entry Sheet'
        key REQUEST_NO                : Integer;

            @sap.label    : 'Service Period'
            @sap.quickinfo: 'Period during which the service was provided'
            SERVICE_PERIOD            : String;

            @sap.label    : 'Purchase Order Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order linked to this SES'
            PO_NUMBER                 : String;

            @sap.label    : 'SES Status'
            @sap.quickinfo: 'Current processing status of the Service Entry Sheet'
            SES_STATUS                : String;

            @sap.label    : 'Vendor Status'
            @sap.quickinfo: 'Status set by the vendor when submitting the SES'
            VENDOR_STATUS             : String;

            @sap.label    : 'Amount'
            @sap.quickinfo: 'Total value of the Service Entry Sheet'
            AMOUNT                    : Decimal;

            @sap.label    : 'Service Location'
            @sap.quickinfo: 'Location where the service was performed'
            SERVICE_LOCATION          : String;

            @sap.label    : 'Person Responsible'
            @sap.quickinfo: 'Individual responsible for the service execution'
            PERSON_RESPONSIBLE        : String;

            @sap.label    : 'Current Assignee'
            @sap.quickinfo: 'User currently assigned to process the SES'
            CURRENT_ASSIGNEE          : String;

            @sap.label    : 'Company Code'
            @sap.quickinfo: 'Company code responsible for this SES'
            COMPANY_CODE              : String;

            @sap.label    : 'Approver Role'
            @sap.quickinfo: 'Role responsible for approving the SES'
            APPROVER_ROLE             : String;

            @sap.label    : 'Requester ID'
            @sap.quickinfo: 'Identifier of the user who requested the service'
            REQUESTER_ID              : String;

            @sap.label    : 'Approver Level'
            @sap.quickinfo: 'Numeric level of the approver in the approval workflow'
            APPROVER_LEVEL            : String;

            @sap.label    : 'Last Updated On'
            @sap.quickinfo: 'Date and time when the SES was last updated'
            LAST_UPDATED_ON           : String;

            @sap.label    : 'Created On'
            @sap.quickinfo: 'Date and time when the SES was created'
            CREATED_ON                : String;

            @sap.label    : 'Process Level'
            @sap.quickinfo: 'Current workflow stage of the SES process'
            PROCESS_LEVEL             : String;

            @sap.label    : 'Supplier Number'
            @sap.quickinfo: 'Unique identifier of the supplier/vendor (LIFNR)'
            SUPPLIER_NUMBER           : String;

            @sap.label    : 'Supplier Name'
            @sap.quickinfo: 'Full name of the supplier providing the service'
            SUPPLIER_NAME             : String;

            @sap.label    : 'Final SES Entry'
            @sap.quickinfo: 'Indicates whether this is the final SES entry'
            FINAL_SES_ENTRY           : String;

            @sap.label    : 'Site Person'
            @sap.quickinfo: 'On-site person responsible for service verification'
            SITE_PERSON               : String;

            @sap.label    : 'Service Text'
            @sap.quickinfo: 'Detailed description of the services performed'
            SERVICE_TEXT              : String;

            @sap.label    : 'Rejection Comment'
            @sap.quickinfo: 'Reason provided when the SES is rejected'
            REJECTION_COMMENT         : String;

            @sap.label    : 'Comment'
            @sap.quickinfo: 'Additional remarks or notes related to the SES'
            COMMENT                   : String;

            @sap.label    : 'Service PO Type'
            @sap.quickinfo: 'Type/category of the service purchase order'
            ServicePOType             : String;

            @sap.label    : 'Type'
            @sap.quickinfo: 'Classification type of the SES record'
            TYPE                      : String;

            @sap.label    : 'SAP Reference Number'
            @sap.quickinfo: 'Reference number returned from SAP for this SES'
            SAP_REFERENCE_NUMBER      : String;

            @sap.label    : 'Total Service Sheet Value'
            @sap.quickinfo: 'Cumulative value of all service line items in the SES'
            total_service_sheet_value : Integer;

            @sap.label    : 'Service Entry Sheet Items'
            @sap.quickinfo: 'Association to all SES item records linked to this request'
            to_Items                  : Association to many SES_Item
                                            on to_Items.REQUEST_NO = REQUEST_NO;

            @sap.label    : 'Service Entry Sheet Attachments'
            @sap.quickinfo: 'Association to all SES attachments linked to this request'
            to_Attachments            : Association to many SES_Attachment
                                            on to_Attachments.REQUEST_NO = REQUEST_NO;
    }

    entity SES_Item {
            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for the Service Entry Sheet item'
        key REQUEST_NO          : Integer;

            @sap.label    : 'Service Item Number'
            @sap.quickinfo: 'Sequential number of the service item within the SES'
        key SR_NO               : String;

            @sap.label    : 'Service Number'
            @sap.quickinfo: 'Unique identifier of the service from the service master'
            SERVICE_NUMBER      : String;

            @sap.label    : 'Service Description'
            @sap.quickinfo: 'Detailed description of the service provided'
            SERVICE_DESCRIPTION : String;

            @sap.label    : 'Ordered Quantity'
            @sap.quickinfo: 'Quantity of the service ordered in the purchase order'
            ORDERED_QUANTITY    : Decimal(13, 3);

            @sap.label    : 'Unit of Measure'
            @sap.quickinfo: 'Measurement unit for the service (e.g., HRS, EA)'
            UNIT_OF_MEASURE     : String;

            @sap.label    : 'Unit Price'
            @sap.quickinfo: 'Price per unit of the service'
            UNIT_PRICE          : Decimal(15, 2);

            @sap.label    : 'Service Quantity'
            @sap.quickinfo: 'Quantity of the service actually performed'
            SERVICE_QUANTITY    : Integer;

            @sap.label    : 'Total Price'
            @sap.quickinfo: 'Total calculated price for this service line item'
            TOTAL_PRICE         : Decimal(15, 2);

            @sap.label    : 'Item Number'
            @sap.quickinfo: 'Item number from the purchase order linked to the service'
            ITEM_NUMBER         : String;

            @sap.label    : 'Status'
            @sap.quickinfo: 'Processing status of the SES item (e.g., Open, Approved, Rejected)'
            STATUS              : String;

            @sap.label    : 'Package Number'
            @sap.quickinfo: 'Package number grouping service items in the SES'
            packno              : String;

            @sap.label    : 'Internal Row'
            @sap.quickinfo: 'Technical row identifier used for internal grouping'
            introw              : String;

            @sap.label    : 'Package Number from PO'
            @sap.quickinfo: 'Package number reference copied from the purchase order'
            packageNofromPO     : String;
    }

    entity SES_Attachment {
            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier linked to the Service Entry Sheet'
        key REQUEST_NO  : Integer;

            @sap.label    : 'Description'
            @sap.quickinfo: 'Brief description of the attachment content'
        key DESCRIPTION : String;

            @sap.label    : 'File Content (Base64)'
            @sap.quickinfo: 'Attachment content stored as base64-encoded binary data'
            base64value : LargeBinary;

            @sap.label    : 'Comment'
            @sap.quickinfo: 'Additional remarks or notes related to the attachment'
            COMMENT     : String;

            @sap.label    : 'File Type'
            @sap.quickinfo: 'Type or format of the attachment file (e.g., PDF, JPG, DOCX)'
            TYPE        : String;

            @sap.label    : 'Attachment URL'
            @sap.quickinfo: 'External or internal URL where the attachment is stored'
            URL         : String;
    }

    entity SES_CREATION_LOGS {
            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for the Service Entry Sheet log entry'
        key REQUEST_NO     : Integer;

            @sap.label    : 'Purchase Order Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order linked to this SES log'
            PO_NUMBER      : String;

            @sap.label    : 'Approval Level'
            @sap.quickinfo: 'Numeric level of the approval step in the workflow'
            APPROVAL_LEVEL : Integer;

            @sap.label    : 'Approver ID'
            @sap.quickinfo: 'Unique identifier of the approver (e.g., user ID or employee ID)'
            APPROVER_ID    : String;

            @sap.label    : 'Approver Role'
            @sap.quickinfo: 'Role of the approver in the SES approval process'
            APPROVER_ROLE  : String;

            @sap.label    : 'Action'
            @sap.quickinfo: 'Action taken by the approver (e.g., Approved, Rejected, Forwarded)'
            ACTION         : String;

            @sap.label    : 'Comment'
            @sap.quickinfo: 'Remarks or notes provided by the approver'
            COMMENT        : String;

            @sap.label    : 'Timestamp'
            @sap.quickinfo: 'Date when the action or update was recorded'
            TIMESTAMP      : Date;

            @sap.label    : 'SES Status'
            @sap.quickinfo: 'Current processing status of the Service Entry Sheet at this log entry'
            SES_STATUS     : String;

            @sap.label    : 'Amount'
            @sap.quickinfo: 'Total value of the Service Entry Sheet at this log stage'
            AMOUNT         : Integer;

            @sap.label    : 'Created On'
            @sap.quickinfo: 'Date when this log entry was created'
            CREATED_ON     : Date;
    }

    entity SES_status {
            @sap.label    : 'SES Status'
            @sap.quickinfo: 'Represents the current status of the Service Entry Sheet (e.g., Open, Approved, Rejected, Closed)'
        key Status : String;
    }

    action createSES(REQUEST_NO: Integer,
                     servicehead: many SES_Head,
                     serviceitem: many SES_Item,
                     attachments: many SES_Attachment,
                     PO_TYPE: String,
                     TOTAL_AMOUNT: Integer) returns {
        returnMessage : String;
    };

    action editSES(REQUEST_NO: Integer,
                   servicehead: many SES_Head,
                   serviceitem: many SES_Item,
                   attachments: many SES_Attachment,
                   PO_TYPE: String,
                   TOTAL_AMOUNT: Integer)   returns {
        returnMessage : String;
    };
}
