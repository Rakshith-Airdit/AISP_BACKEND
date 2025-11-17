service SES_CUSTOMER_SIDE {
    entity SES_HEAD_MINIMAL_DATA as projection on SES_Head;

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

            @sap.label    : 'Comment'
            @sap.quickinfo: 'Remarks or notes related to the SES'
            COMMENT                   : String;

            @sap.label    : 'Service PO Type'
            @sap.quickinfo: 'Type/category of the purchase order for services'
            ServicePOType             : String;

            @sap.label    : 'Rejection Comment'
            @sap.quickinfo: 'Reason provided when the SES is rejected'
            REJECTION_COMMENT         : String;

            @sap.label    : 'Type'
            @sap.quickinfo: 'Classification type of the SES'
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
            @sap.quickinfo: 'Quantity of service ordered in the purchase order'
            ORDERED_QUANTITY    : Decimal(13, 3);

            @sap.label    : 'Unit of Measure'
            @sap.quickinfo: 'Measurement unit for the service quantity (e.g., HRS, EA)'
            UNIT_OF_MEASURE     : String;

            @sap.label    : 'Unit Price'
            @sap.quickinfo: 'Price per unit of the service'
            UNIT_PRICE          : Decimal(15, 2);

            @sap.label    : 'Service Quantity'
            @sap.quickinfo: 'Quantity of the service actually performed'
            SERVICE_QUANTITY    : Integer;

            @sap.label    : 'Total Price'
            @sap.quickinfo: 'Total calculated price for the service line item'
            TOTAL_PRICE         : Decimal(15, 2);

            @sap.label    : 'Item Number'
            @sap.quickinfo: 'Item number from the purchase order related to the service'
            ITEM_NUMBER         : String;

            @sap.label    : 'Status'
            @sap.quickinfo: 'Processing status of the SES item (e.g., Open, Approved)'
            STATUS              : String;

            @sap.label    : 'Package Number'
            @sap.quickinfo: 'Package number grouping service items in the SES'
            packno              : String;

            @sap.label    : 'Internal Row'
            @sap.quickinfo: 'Internal row identifier used for technical grouping'
            introw              : String;

            @sap.label    : 'Package Number from PO'
            @sap.quickinfo: 'Package number reference from the purchase order'
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

            @sap.label    : 'URL'
            @sap.quickinfo: 'External or internal URL location of the attachment'
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

    action approveSES(REQUEST_NO: Integer,
                      servicehead: many SES_Head,
                      serviceitem: many SES_Item,
                      attachments: many SES_Attachment,
                      PO_TYPE: String,
                      TOTAL_AMOUNT: Integer) returns {
        returnMessage : String;
    };

    action rejectSES(REQUEST_NO: Integer,
                     servicehead: many SES_Head,
                     serviceitem: many SES_Item,
                     attachments: many SES_Attachment,
                     PO_TYPE: String,
                     TOTAL_AMOUNT: Integer)  returns {
        returnMessage : String;
    };
}
