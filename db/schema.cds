namespace Procurement;

// RFQ Header
entity RFQ_PRICE_COMPARISON_HEADER {
    key RfqNumber          : String(20);
        CompanyCode        : String;
        DocumentDate       : Date;
        EventStartDate     : Date;
        Email              : String;
        CreatedBy          : String;
        TimeRemaining      : String(50);
        TargetValue        : Decimal(15, 2);
        EventEndDate       : DateTime;
        ReceivedQuotations : Integer;
        Status             : String(30);
}

//RFQ ITEM
entity RFQ_PRICE_COMPARISON_ITEM {
    key ItemNumber           : String(10);
    key RfqNumber            : String(20);
    key Bidder               : String(20);
        QuotationValue       : String;
        SupplierQuotation    : String;
        MaterialNo           : String(50);
        MaterialDesc         : String(255);
        Plant                : String(10);
        PlantAddress         : String(255);
        Quantity             : Integer;
        UnitOfMeasure        : String(10);
        Netpr                : Integer;
        Netwr                : Integer;
        TOTAL_PRICE          : Integer;
        TOTAL_SCORE          : Integer;
        Currency             : String(5);
        LotType              : String(50);
        CREATED_ON           : DateTime;
        LAST_UPDATED_ON      : DateTime;
        DeliveryDate         : Date;
        ExpectedDeliveryDate : Date;
}

//BUYER MAILBOX CONFIG =====ZUHEB
entity GlobalMailConfig {
        @Common.Label: 'Mail Id'
    key MAIL_ID               : String(100);
        EMAIL_EXCHANGE_SERVER : String(50); // Dropdown for 'M' or 'G'
        POLL_INTERVAL         : Integer;
        FILE_TYPES            : String(100); // Dropdown
        FILE_SIZE_MB          : Integer;
        DESCRIPTION           : String;
        MAIL_SUBJECT_PATTERN  : String(100);

        // Microsoft Exchange Server Fields (only applicable when EMAIL_EXCHANGE_SERVER = 'M')
        CLIENT_ID             : String(100);
        CLIENT_SECRET         : String(100);
        TENANT_ID             : String(100);

        // Google Workspace Fields (only applicable when EMAIL_EXCHANGE_SERVER = 'G')
        HOST                  : String(100);
        APP_PASSWORD          : String(100);
}

//SURYANSH ---------SUPPLIER COMMU CONFIG
entity Configuration {
    key SupplierId        : String(20);
        SupplierName      : String(50);
        CommunicationMode : String(20);
        SupplierEmail     : String(50);
        Active            : Boolean;
        Notes             : String(200);
}

entity SUPPLIER_PROFILE {
    key SUPPLIER_CODE       : Integer;
        CREATED_ON          : String;
        SupplierName        : String(80);
        Email               : String;
        CompanyCode         : String;
        VendorType          : String;
        VendorSubType       : String;
        SupplierWebsite     : String;
        CompanyLogo         : String;
        Contact             : String;
        Address             : Association to many SUPPLIER_PROFILE_ADDRESS
                                  on Address.SUPPLIER_CODE = $self.SUPPLIER_CODE;
        Bank                : Association to many SUPPLIER_PROFILE_BANK
                                  on Bank.SUPPLIER_CODE = $self.SUPPLIER_CODE;
        Products            : Association to many SUPPLIER_PROFILE_PODUCTS
                                  on Products.SUPPLIER_CODE = $self.SUPPLIER_CODE;
        OperationalCapacity : Association to many SUPPLIER_PROFILE_OPERATIONAL_CAPACITY
                                  on OperationalCapacity.SUPPLIER_CODE = $self.SUPPLIER_CODE;
        Attachments         : Association to many SUPPLIER_PROFILE_ATTACHMENT
                                  on Attachments.SUPPLIER_CODE = $self.SUPPLIER_CODE;
        DynamicFields       : Association to many SUPPLIER_PROFILE_DYNAMIC_FIELD
                                  on DynamicFields.SupplierCode = $self.SUPPLIER_CODE
}

entity SUPPLIER_PROFILE_DYNAMIC_FIELD {
    key Id              : Integer;
        SupplierCode    : Integer;
        FieldName       : String;
        FieldValue      : String;
        FieldSection    : String;
        FieldSubSection : String;

}

entity SUPPLIER_PROFILE_PODUCTS {
    key Id                 : String;
        SUPPLIER_CODE      : Integer;
        ProductDescription : String;
        ProductType        : String;
        ProductName        : String;
        ProductCategory    : String;
}

entity SUPPLIER_PROFILE_OPERATIONAL_CAPACITY {
    key Id                     : String;
        SUPPLIER_CODE          : Integer;
        Maximum_order          : String;
        Minimum_order          : String;
        Total_Product_capacity : String;
        City                   : String;
}

entity SUPPLIER_PROFILE_ATTACHMENT {
    key ID            : String;
        SUPPLIER_CODE : Integer;
        Name          : String;
        Description   : String;
        URL           : String;
}

entity SUPPLIER_PROFILE_ADDRESS {
    key AddressId     : Integer;
        SUPPLIER_CODE : Integer;
        StreetNo      : String;
        Street01      : String;
        Street02      : String;
        Street03      : String;
        Street04      : String;
        PostalCode    : String(10);
        Country       : String(3);
        Region        : String(3);
        City          : String(40);
        Email         : String;
}

entity SUPPLIER_PROFILE_BANK {
    key BankIdentification : String;
        SUPPLIER_CODE      : Integer;
        Email              : String;
        BankName           : String(90);
        BranchName         : String;
        BeneficiaryName    : String;
        SwiftCode          : String(20);
        IBANNumber         : String(34);
        RoutingCode        : String;
        BankCountry        : String(3);
        AccountNumber      : String(15);
        BankCurrency       : String;
        GST                : String;
}

//URVASHI
using { managed } from '@sap/cds/common';
//@odata.draft.enabled //require for automtic draft enablement with odata and cds

entity Notifications : managed {
   
    key NotificationID : Integer;
    NotificationType   : String;
    Title              : String;
    Body               : String;
    Priority           : String;
    Mail               : Boolean;
    Schedule           : Boolean;
    ValidFrom          : Date;
    ValidTo            : Date;
    DateTime           : Timestamp;
    Status             : String;

}

//PO VIM WITH OCR
entity VIM_PO_OCR_HEAD {
    key REQUEST_NO             : Integer;
        STATUS                 : Integer;
        INVOICE_NO             : String;
        SOURCE_TYPE            : String;
        APPROVED_COMMENT       : String;
        REJECTED_COMMENT       : String;
        SUPPLIER               : String;
        PO_NUMBER              : String;
        INVOICE_AMOUNT         : Decimal; //
        INVOICE_DATE           : Date; //
        SUPPLIER_EMAIL         : String;
        supplierInvoiceRefNo   : String;
        SUPPLIER_NUMBER        : String;
        COMPANY_CODE           : String;
        SUPPLIER_CODE          : String;
        VENDOR_ADDRESS         : String;
        BANK_ACCOUNT_NO        : String;
        BANK_NAME              : String;
        PURCHASE_ORG           : String;
        STATUS_DESC            : String;
        PURCHASE_GROUP         : String;
        CURRENCY               : String;
        DOWNPAYMENT_AMOUNT     : Decimal; //
        DOWNPAYMENT_PERCENTAGE : Integer; //
        DOWNPAYMENT_DUE_DATE   : Date; //
        TO_VIM_PO_OCR_ITEM     : Association to many VIM_PO_OCR_ITEM
                                     on TO_VIM_PO_OCR_ITEM.REQUEST_NO = REQUEST_NO;
        ATTACHMENTS            : Association to many Attachment_PO_VIM_OCR
                                     on ATTACHMENTS.REQUEST_NO = REQUEST_NO;
}

entity VIM_PO_OCR_ITEM {
    key REQUEST_NO           : Integer;
        SR_NO                : String;
        PO_NUMBER            : String;
        ITEM_NO              : String;
        PO_DATE              : String;
        UNIT_RATE            : Integer; //
        COMPANY_CODE         : String;
        GRN_QUANTITY         : Integer; //
        DISCOUNT             : String;
        MATERIAL_NO          : String;
        UNITS_OF_MEASURE     : String;
        ORDERED_QUANTITY     : Integer; //
        TOTAL_PRICE          : Decimal;
        MATERIAL_DESCRIPTION : String;
        CURRENCY             : String;
        INVOICED_QUANTITY    : String; //INVOIVCE EXTRACTION DATA
        INVOICED_PRICE       : Decimal; //INVOICE EXTRACTION DATA //
        QTY_MATCH_STATUS     : String;
        PRICE_MATCH_STATUS   : String;
}

entity Attachment_PO_VIM_OCR {
    key VendorCode      : String;
    key REQUEST_NO      : Integer;
        DESCRIPTION     : String;
        IMAGEURL        : String;
        IMAGE_FILE_NAME : String;
        COMMENT         : String;
        STATUS          : String;
    key ATTACHMENT_ID   : String;
};

entity VIM_PO_OCR_HEAD_API {
    key Ebeln         : String  @Common.Label: 'PO Number';
        Bsakz         : String  @Common.Label: 'Blocked Indicator';
        Bsart         : String  @Common.Label: 'Document Type';
        Bstyp         : String  @Common.Label: 'PO Category';
        Bukrs         : String  @Common.Label: 'Company Code';
        Dpamt         : Decimal @Common.Label: 'Down Payment Amount';
        Dpdat         : String  @Common.Label: 'Down Payment Due Date';
        Dppct         : Decimal @Common.Label: 'Down Payment Percentage';
        Dptyp         : String  @Common.Label: 'Down Payment Type';
        Ekgrp         : String  @Common.Label: 'Purchase Group';
        Ekorg         : String  @Common.Label: 'Purchase Organization';
        Lifnr         : String  @Common.Label: 'Supplier Code';
        Loekz         : String  @Common.Label: 'Deletion Indicator';
        Ship1         : String  @Common.Label: 'Ship-to Address 1';
        Ship2         : String  @Common.Label: 'Ship-to Address 2';
        Spras         : String  @Common.Label: 'Language';
        Statu         : String  @Common.Label: 'Status';
        Vendoraddress : String  @Common.Label: 'Vendor Address';
        Waers         : String  @Common.Label: 'Currency';
        bank_acc      : String  @Common.Label: 'Bank Account Number';
        bank_key      : String  @Common.Label: 'Bank Key';
        bank_name     : String  @Common.Label: 'Bank Name';
        Email         : String  @Common.Label: 'Vendor Email';

        TO_ITEMS      : Association to many VIM_PO_OCR_ITEM_API
                            on TO_ITEMS.Ebeln = Ebeln;
}

entity VIM_PO_OCR_ITEM_API {
    key Ebeln     : String  @Common.Label: 'PO Number';
        Ebelp     : String  @Common.Label: 'Item Number';
        Aedat     : String  @Common.Label: 'Last Change Date';
        Brtwr     : Decimal @Common.Label: 'Gross Value';
        Bukrs     : String  @Common.Label: 'Company Code';
        GRN_QTY   : Integer @Common.Label: 'GRN Quantity';
        Kbetr     : Decimal @Common.Label: 'Condition Rate';
        Knumv     : String  @Common.Label: 'Condition Number';
        Ktmng     : Decimal @Common.Label: 'Target Quantity';
        Lgort     : String  @Common.Label: 'Storage Location';
        Loekz     : String  @Common.Label: 'Deletion Indicator';
        Matnr     : String  @Common.Label: 'Material Number';
        Meins     : String  @Common.Label: 'Unit of Measure';
        Menge     : Decimal @Common.Label: 'Ordered Quantity';
        Netpr     : Decimal @Common.Label: 'Net Price';
        Netwr     : Decimal @Common.Label: 'Net Value';
        Statu     : String  @Common.Label: 'Status';
        TOTAL_AMT : Decimal @Common.Label: 'Total Amount';
        Txz01     : String  @Common.Label: 'Item Description';
        UnitPrice : Decimal @Common.Label: 'Unit Price';
        Waers     : String  @Common.Label: 'Currency';
        Werks     : String  @Common.Label: 'Plant';
}

entity SourceType {
    key SOURCE_TYPE : String;
}

//SES VIM :
entity STATUS_FOR_VIM {
        @sap.label    : 'VIM Status'
        @sap.quickinfo: 'Represents the current status of a VIM document (e.g., Open, Approved, Rejected, Posted)'
    key Status : String;
}

entity VENDOE_CODE {
        @sap.label    : 'Vendor Code'
        @sap.quickinfo: 'Unique identifier assigned to the vendor (LIFNR)'
    key Lifnr : String;
}

entity COMPANY_CODE {
        @sap.label    : 'Company Code'
        @sap.quickinfo: 'Unique identifier of the company code representing a legal entity in SAP'
    key Bukrs : String;
}

entity SESVimHead {
        @sap.label    : 'Request Number'
        @sap.quickinfo: 'Internal request identifier for the SES VIM record'
    key REQUEST_NO             : Integer;

        @sap.label    : 'Supplier Organization Name'
        @sap.quickinfo: 'Full legal name of the supplier organization'
        SUPPLIER_ORG_NAME      : String;

        @sap.label    : 'Company Code'
        @sap.quickinfo: 'Company code representing the legal entity in SAP'
        COMPANY_CODE           : String;

        @sap.label    : 'Created By'
        @sap.quickinfo: 'User ID of the person who created the SES VIM record'
        CREATED_BY             : String;

        @sap.label    : 'Vendor Code'
        @sap.quickinfo: 'Unique identifier of the vendor providing the service or goods'
        VENDOR_CODE            : String;

        @sap.label    : 'Purchasing Organization'
        @sap.quickinfo: 'Organization unit responsible for procurement'
        PURCHASE_ORG           : String;

        @sap.label    : 'Order Date'
        @sap.quickinfo: 'Date when the purchase order was created'
        ORDER_DATE             : Date;

        @sap.label    : 'Bank Name'
        @sap.quickinfo: 'Name of the vendor’s bank'
        BANK_NAME              : String;

        @sap.label    : 'Bank Account'
        @sap.quickinfo: 'Vendor’s bank account number used for payment processing'
        BANK_ACCOUNT           : String;

        @sap.label    : 'Vendor Address'
        @sap.quickinfo: 'Complete address of the vendor'
        VENDOR_ADDRESS         : String;

        @sap.label    : 'Purchase Order Number'
        @sap.quickinfo: 'Unique number of the purchase order linked to this SES VIM record'
        PO_NUMBER              : String;

        @sap.label    : 'Invoice Number'
        @sap.quickinfo: 'Unique identifier of the invoice submitted by the vendor'
        INVOICE_NUMBER         : String;

        @sap.label    : 'Total Amount'
        @sap.quickinfo: 'Total value of the SES VIM record in document currency'
        TOTAL_AMOUNT           : Decimal;

        @sap.label    : 'Down Payment Amount'
        @sap.quickinfo: 'Advance payment amount recorded against the invoice'
        DOWNPAYMENT_AMOUNT     : Decimal;

        @sap.label    : 'Down Payment Percentage'
        @sap.quickinfo: 'Percentage of the invoice amount considered as down payment'
        DOWNPAYMENT_PERCENTAGE : String;

        @sap.label    : 'Invoice Date'
        @sap.quickinfo: 'Date on which the invoice was issued'
        INVOICE_DATE           : Date;

        @sap.label    : 'Status Code'
        @sap.quickinfo: 'Numeric status code representing the current stage'
        STATUS                 : Integer;

        @sap.label    : 'Status Description'
        @sap.quickinfo: 'Textual description of the SES VIM status'
        STATUS_DESC            : String;

        @sap.label    : 'Vendor Status'
        @sap.quickinfo: 'Status information provided by the vendor'
        VENDOR_STATUS          : String;

        @sap.label    : 'Last Updated On'
        @sap.quickinfo: 'Timestamp when the SES VIM record was last updated'
        LAST_UPDATED_ON        : Timestamp;

        @sap.label    : 'Created On'
        @sap.quickinfo: 'Timestamp when the SES VIM record was created'
        CREATED_ON             : Timestamp;

        @sap.label    : 'Approver Role'
        @sap.quickinfo: 'Role of the approver in the SES VIM approval workflow'
        APPROVER_ROLE          : String;

        @sap.label    : 'Approver Level'
        @sap.quickinfo: 'Numeric level of the approver in the workflow'
        APPROVER_LEVEL         : Integer;

        @sap.label    : 'Current Assignee'
        @sap.quickinfo: 'User currently assigned to process the SES VIM record'
        CURRENT_ASSIGNEE       : String;

        @sap.label    : 'SAP Invoice Number'
        @sap.quickinfo: 'Invoice number returned from SAP after posting'
        SAP_INVOICE_NUMBER     : String;

        @sap.label    : 'Rejection Comment'
        @sap.quickinfo: 'Remarks or reason provided when the SES VIM record is rejected'
        REJECTED_COMMENT       : String;

        @sap.label    : 'Value'
        @sap.quickinfo: 'Additional reference or value field used in SES VIM process'
        value                  : String;

        @sap.label    : 'Approval Comment'
        @sap.quickinfo: 'Remarks or notes provided during approval'
        APPROVED_COMMENT       : String;

        @sap.label    : 'SES VIM Items'
        @sap.quickinfo: 'Association to all SES VIM item records linked to this request'
        TO_SES_VIM_ITEMS       : Association to many SESVimItem
                                     on TO_SES_VIM_ITEMS.REQUEST_NO = REQUEST_NO;

        @sap.label    : 'SES VIM Attachments'
        @sap.quickinfo: 'Association to all SES VIM attachments linked to this request'
        TO_SES_VIM_ATTACHMENTS : Association to many SESVimAttachments
                                     on TO_SES_VIM_ATTACHMENTS.REQUEST_NO = REQUEST_NO;
}

entity SESVimItem {
        @sap.label    : 'Request Number'
        @sap.quickinfo: 'Internal request identifier for the SES VIM item'
    key REQUEST_NO           : Integer;

        @sap.label    : 'Purchase Order Number'
        @sap.quickinfo: 'Unique identifier of the purchase order linked to this SES item'
    key PO_NUMBER            : String;

        @sap.label    : 'PO Item Number'
        @sap.quickinfo: 'Line item number within the purchase order (EBELP)'
        EBELP                : String;

        @sap.label    : 'SES Number'
        @sap.quickinfo: 'Unique identifier of the Service Entry Sheet'
        SES_NO               : String;

        @sap.label    : 'SES Date'
        @sap.quickinfo: 'Date when the Service Entry Sheet was created'
        SES_DATE             : Date;

        @sap.label    : 'SES Period From Date'
        @sap.quickinfo: 'Start date of the service period covered by the SES'
        SES_PERIOD_FROM_DATE : Date;

        @sap.label    : 'Subpackage Number'
        @sap.quickinfo: 'Identifier for the subpackage grouping SES items'
    key SUBPACK_NO           : String;

        @sap.label    : 'SES Period To Date'
        @sap.quickinfo: 'End date of the service period covered by the SES'
        SES_PERIOD_TO_DATE   : Date;

        @sap.label    : 'SES Amount'
        @sap.quickinfo: 'Monetary amount recorded for this SES item'
        SES_AMOUNT           : Decimal;

        @sap.label    : 'Status'
        @sap.quickinfo: 'Processing status of the SES item (e.g., Open, Approved, Rejected)'
        STATUS               : String;

        @sap.label    : 'Service Description'
        @sap.quickinfo: 'Detailed description of the service performed'
        SERVICE_DESCRIPTION  : String;

        @sap.label    : 'Quantity'
        @sap.quickinfo: 'Service quantity recorded for this SES item'
        QUANTITY             : Integer;

        @sap.label    : 'Unit Price'
        @sap.quickinfo: 'Price per unit of service'
        UNIT_PRICE           : Decimal;

        @sap.label    : 'Total Price'
        @sap.quickinfo: 'Total calculated price for this SES item'
        TOTAL_PRICE          : Decimal;
}

entity SESDetails {
        @sap.label    : 'Request Number'
        @sap.quickinfo: 'Internal request identifier for the SES details record'
    key REQUEST_NO          : Integer;

        @sap.label    : 'Subpackage Number'
        @sap.quickinfo: 'Identifier of the subpackage grouping SES items'
    key SUBPACK_NO          : String;

        @sap.label    : 'Item Number'
        @sap.quickinfo: 'Sequential number of the SES service item'
        ITEM_NO             : String;

        @sap.label    : 'Service Number'
        @sap.quickinfo: 'Unique identifier of the service from the service master'
        SERVICE_NO          : String;

        @sap.label    : 'Service Description'
        @sap.quickinfo: 'Detailed description of the service performed'
        SERVICE_DESCRIPTION : String;

        @sap.label    : 'Unit of Measure'
        @sap.quickinfo: 'Measurement unit for the service (e.g., HRS, EA)'
        UNIT_OF_MEASURE     : String;

        @sap.label    : 'Unit Price'
        @sap.quickinfo: 'Price per unit of the service'
        UNIT_PRICE          : Decimal;

        @sap.label    : 'Serviced Quantity'
        @sap.quickinfo: 'Quantity of service actually delivered/performed'
        SERVICED_QUANTITY   : String;

        @sap.label    : 'Total Price'
        @sap.quickinfo: 'Total calculated price for this SES item'
        TOTAL_PRICE         : Decimal;
}

entity SESVimAttachments {
        @sap.label    : 'Vendor Code'
        @sap.quickinfo: 'Unique code assigned to the vendor who uploaded the attachment'
    key VendorCode      : String;

        @sap.label    : 'Request Number'
        @sap.quickinfo: 'Internal request identifier linked to the SES VIM attachment'
    key REQUEST_NO      : Integer;

        @sap.label    : 'Description'
        @sap.quickinfo: 'Brief description of the attachment content'
        DESCRIPTION     : String;

        @sap.label    : 'Image URL'
        @sap.quickinfo: 'URL location where the attachment file is stored'
        IMAGEURL        : String;

        @sap.label    : 'Image File Name'
        @sap.quickinfo: 'Original file name of the uploaded attachment'
        IMAGE_FILE_NAME : String;

        @sap.label    : 'Comment'
        @sap.quickinfo: 'Additional remarks or notes related to the attachment'
        COMMENT         : String;

        @sap.label    : 'Status'
        @sap.quickinfo: 'Current status of the attachment (e.g., Active, Inactive, Processed)'
        STATUS          : String;

        @sap.label    : 'Attachment ID'
        @sap.quickinfo: 'Unique identifier of the attachment record'
    key ATTACHMENT_ID   : String;
}

entity SES_VIM_APPROVAL_LOGS {
        @sap.label    : 'Request Number'
        @sap.quickinfo: 'Internal request identifier for the SES VIM approval log entry'
    key REQUEST_NO     : Integer;

        @sap.label    : 'Approval Level'
        @sap.quickinfo: 'Numeric level of the approval step in the workflow'
        APPROVAL_LEVEL : Integer;

        @sap.label    : 'Approver ID'
        @sap.quickinfo: 'Unique identifier of the approver (e.g., user ID or employee ID)'
        APPROVER_ID    : String;

        @sap.label    : 'Approver Role'
        @sap.quickinfo: 'Role of the approver in the SES VIM approval process'
        APPROVER_ROLE  : String;

        @sap.label    : 'Action'
        @sap.quickinfo: 'Action taken by the approver (e.g., Approved, Rejected, Forwarded)'
        ACTION         : String;

        @sap.label    : 'Comment'
        @sap.quickinfo: 'Remarks or notes provided by the approver'
        COMMENT        : String;

        @sap.label    : 'Timestamp'
        @sap.quickinfo: 'Date and time when the approval action was performed'
        TIMESTAMP      : Timestamp;

        @sap.label    : 'S/4HANA Response'
        @sap.quickinfo: 'Response message returned from the S/4HANA system'
        S4Response     : String; // Optional

        @sap.label    : 'S/4HANA Error Message'
        @sap.quickinfo: 'Error message from S/4HANA in case of failure'
        S4ErrorMessage : String; // Optional

        @sap.label    : 'Updated On'
        @sap.quickinfo: 'Timestamp when the approval log entry was last updated'
        UPDATED_ON     : Timestamp; // Optional
}

entity SES_VIM_HEAD_API {
        @sap.label    : 'PO Number'
        @sap.quickinfo: 'Unique identifier of the Purchase Order'
    key Ebeln              : String(10);

        @sap.label    : 'Company Code'
        @sap.quickinfo: 'Legal entity (company code) responsible for the purchase order'
        Bukrs              : String(4);

        @sap.label    : 'Created By'
        @sap.quickinfo: 'User ID of the person who created the document'
        Ernam              : String(12);

        @sap.label    : 'Last Changed On'
        @sap.quickinfo: 'Date and time when the document was last updated'
        Lastchangedatetime : DateTime;

        @sap.label    : 'Increment'
        @sap.quickinfo: 'Purchasing document increment/counter'
        Pincr              : String(10);

        @sap.label    : 'Purchase Order Item'
        @sap.quickinfo: 'Item number within the purchase order'
        Lponr              : String(5);

        @sap.label    : 'Vendor Code'
        @sap.quickinfo: 'Unique identifier of the vendor (LIFNR)'
        Lifnr              : String(10);

        @sap.label    : 'Status'
        @sap.quickinfo: 'Processing status of the purchase order'
        Status             : String(3);

        @sap.label    : 'Total Amount'
        @sap.quickinfo: 'Total value of the purchase order in document currency'
        Amount             : Decimal(15, 2);

        @sap.label    : 'Vendor Name'
        @sap.quickinfo: 'Full name of the vendor or supplier'
        name1              : String(100);

        @sap.label    : 'Shipping Info 1'
        @sap.quickinfo: 'First line of shipping information'
        Ship1              : String(100);

        @sap.label    : 'Shipping Info 2'
        @sap.quickinfo: 'Second line of shipping information'
        Ship2              : String(100);

        @sap.label    : 'Payment Terms'
        @sap.quickinfo: 'Terms of payment defined for the vendor'
        Zterm              : String(4);

        @sap.label    : 'Vendor Address'
        @sap.quickinfo: 'Formatted address of the vendor organization'
        Vendoraddress      : String(200);

        @sap.label    : 'Bank Account'
        @sap.quickinfo: 'Vendor’s bank account number for payments'
        Bankacc            : String(20);

        @sap.label    : 'Bank Name'
        @sap.quickinfo: 'Name of the vendor’s bank'
        Bankname           : String(100);

        @sap.label    : 'Language Key'
        @sap.quickinfo: 'Language key used for the document'
        Spras              : String(2);

        @sap.label    : 'Purchasing Organization'
        @sap.quickinfo: 'Organization unit responsible for procurement'
        Ekorg              : String(4);

        @sap.label    : 'Purchasing Group'
        @sap.quickinfo: 'Buyer or group responsible for the purchase order'
        Ekgrp              : String(3);

        @sap.label    : 'Currency'
        @sap.quickinfo: 'Transaction currency code (e.g., INR, USD, EUR)'
        Waers              : String(5);

        @sap.label    : 'Exchange Rate Fixed'
        @sap.quickinfo: 'Indicator showing whether the exchange rate is fixed'
        Kufix              : String(1);

        @sap.label    : 'Document Date'
        @sap.quickinfo: 'Date on which the document was created'
        Bedat              : Date;

        @sap.label    : 'Down Payment Type'
        @sap.quickinfo: 'Type/category of the down payment'
        Dptyp              : String(2);

        @sap.label    : 'Down Payment Percentage'
        @sap.quickinfo: 'Percentage of invoice amount considered as down payment'
        Dppct              : Decimal(5, 2);

        @sap.label    : 'Down Payment Amount'
        @sap.quickinfo: 'Advance payment amount recorded against the purchase order'
        Dpamt              : Decimal(15, 2);

        @sap.label    : 'Down Payment Date'
        @sap.quickinfo: 'Date on which the down payment is scheduled or posted'
        Dpdat              : Date;
}

entity SES_VIM_ITEM_API {
        @sap.label    : 'Service Sheet No'
        @sap.quickinfo: 'Unique identifier of the service entry sheet'
    key Lblni     : String(10);

        @sap.label    : 'PO Number'
        @sap.quickinfo: 'Unique identifier of the purchase order'
    key Ebeln     : String(10);

        @sap.label    : 'PO Item'
        @sap.quickinfo: 'Line item number within the purchase order'
        Ebelp     : String(5);

        @sap.label    : 'SES Line Item'
        @sap.quickinfo: 'Line item number within the service entry sheet'
        Lblne     : String(10);

        @sap.label    : 'Created By'
        @sap.quickinfo: 'User ID of the person who created the SES item'
        Ernam     : String(12);

        @sap.label    : 'Created On'
        @sap.quickinfo: 'Date when the SES item was created'
        Erdat     : Date;

        @sap.label    : 'Changed On'
        @sap.quickinfo: 'Date when the SES item was last modified'
        Aedat     : Date;

        @sap.label    : 'Changed By'
        @sap.quickinfo: 'User ID of the person who last modified the SES item'
        Aenam     : String(12);

        @sap.label    : 'Approval Group'
        @sap.quickinfo: 'Approval group responsible for reviewing the SES item'
        Sbnamag   : String(50);

        @sap.label    : 'Approver Name'
        @sap.quickinfo: 'Full name of the approver'
        Sbnaman   : String(100);

        @sap.label    : 'Sub Package No.'
        @sap.quickinfo: 'Identifier of the subpackage grouping SES items'
        SubPackno : String(20);

        @sap.label    : 'Item Status'
        @sap.quickinfo: 'Processing status of the SES line item'
        Status    : String(3);

        @sap.label    : 'Start Date'
        @sap.quickinfo: 'Start date of the service performance period'
        Lzvon     : Date;

        @sap.label    : 'End Date'
        @sap.quickinfo: 'End date of the service performance period'
        Lzbis     : Date;

        @sap.label    : 'Planned Value'
        @sap.quickinfo: 'Planned monetary value for the service'
        Lwert     : Decimal(15, 2);

        @sap.label    : 'Actual Value'
        @sap.quickinfo: 'Actual monetary value recorded for the service'
        Uwert     : Decimal(15, 2);

        @sap.label    : 'Unplanned Value'
        @sap.quickinfo: 'Unplanned monetary value for the service'
        Unplv     : Decimal(15, 2);

        @sap.label    : 'Currency'
        @sap.quickinfo: 'Transaction currency (e.g., INR, USD, EUR)'
        Waers     : String(5);

        @sap.label    : 'Package No.'
        @sap.quickinfo: 'Identifier of the package grouping related items'
        Packno    : String(20);

        @sap.label    : 'Short Text'
        @sap.quickinfo: 'Brief description of the SES item'
        Txz01     : String(255);

        @sap.label    : 'Deletion Indicator'
        @sap.quickinfo: 'Flag indicating whether the SES item is marked for deletion'
        Loekz     : String(1);

        @sap.label    : 'Final Indicator'
        @sap.quickinfo: 'Flag indicating final posting of the SES item'
        Kzabn     : String(1);

        @sap.label    : 'Final Entry'
        @sap.quickinfo: 'Indicator showing whether this is the final service entry'
        Final     : String(1);

        @sap.label    : 'Performance Start'
        @sap.quickinfo: 'Start date of the service performance'
        Pwwe      : Decimal;

        @sap.label    : 'Performance End'
        @sap.quickinfo: 'End date of the service performance'
        Pwfr      : Decimal;

        @sap.label    : 'Document Date'
        @sap.quickinfo: 'Date on which the document was created'
        Bldat     : Date;

        @sap.label    : 'Posting Date'
        @sap.quickinfo: 'Date on which the document was posted in the system'
        Budat     : Date;

        @sap.label    : 'Reference Doc No.'
        @sap.quickinfo: 'Reference number of a related document'
        Xblnr     : String(20);

        @sap.label    : 'Header Text'
        @sap.quickinfo: 'Descriptive header text for the SES item'
        Bktxt     : String(255);

        @sap.label    : 'Account Assignment Category'
        @sap.quickinfo: 'Category of account assignment (e.g., Cost Center, WBS)'
        Knttp     : String(2);

        @sap.label    : 'Usage Indicator'
        @sap.quickinfo: 'Indicator for usage or consumption in the SES item'
        Kzvbr     : String(1);

        @sap.label    : 'Net Value'
        @sap.quickinfo: 'Net monetary value of the SES item'
        Netwr     : Decimal(15, 2);
}

entity SES_VIM_DETAILS_API {
        @sap.label    : 'Package Number'
        @sap.quickinfo: 'Identifier of the service package grouping items'
    key Packno         : String(20);

        @sap.label    : 'Internal Row'
        @sap.quickinfo: 'Internal row number for technical grouping'
    key Introw         : String(10);

        @sap.label    : 'External Row'
        @sap.quickinfo: 'External row number as referenced externally'
    key Extrow         : String(10);

        @sap.label    : 'Deleted Indicator'
        @sap.quickinfo: 'Flag showing if the row/item is marked as deleted'
        Del            : String(1);

        @sap.label    : 'Service Position'
        @sap.quickinfo: 'Position of the service in the service sheet'
        Srvpos         : String(10);

        @sap.label    : 'Range'
        @sap.quickinfo: 'Range reference for the service item'
        Rang           : String(10);

        @sap.label    : 'External Group'
        @sap.quickinfo: 'External grouping identifier for services'
        Extgroup       : String(10);

        @sap.label    : 'Package'
        @sap.quickinfo: 'Package identifier linked to the service'
        Pckge          : String(20);

        @sap.label    : 'Sub Package No.'
        @sap.quickinfo: 'Identifier of a sub-package grouping'
        SubPackno      : String(20);

        @sap.label    : 'Label Number'
        @sap.quickinfo: 'Label number assigned for reference'
        Lbnum          : String(20);

        @sap.label    : 'Output Type'
        @sap.quickinfo: 'Type of output associated with the service line'
        Ausgb          : String(5);

        @sap.label    : 'Service Level Pos.'
        @sap.quickinfo: 'Position at the service level hierarchy'
        Stlvpos        : String(10);

        @sap.label    : 'External Service No.'
        @sap.quickinfo: 'External reference number of the service'
        Extsrvno       : String(20);

        @sap.label    : 'Quantity'
        @sap.quickinfo: 'Service quantity recorded in this line'
        Menge          : Decimal(15, 3);

        @sap.label    : 'Unit of Measure'
        @sap.quickinfo: 'Measurement unit for the service (e.g., HRS, EA)'
        Meins          : String(3);

        @sap.label    : 'Overdelivery Tolerance'
        @sap.quickinfo: 'Permissible percentage for overdelivery'
        Uebto          : Decimal(5, 2);

        @sap.label    : 'Unlimited Overdelivery'
        @sap.quickinfo: 'Flag indicating unlimited overdelivery allowed'
        Uebtk          : String(1);

        @sap.label    : 'With Limit'
        @sap.quickinfo: 'Flag indicating if the service has a value limit'
        WithLim        : String(1);

        @sap.label    : 'Service Info Record Exists'
        @sap.quickinfo: 'Indicates if a service info record is available'
        Spinf          : String(1);

        @sap.label    : 'Price Unit'
        @sap.quickinfo: 'Price unit for the service'
        Peinh          : Decimal(10, 2);

        @sap.label    : 'Unit Price'
        @sap.quickinfo: 'Price per unit of service'
        Unitprice      : Decimal(15, 2);

        @sap.label    : 'Item Total Price'
        @sap.quickinfo: 'Total calculated price of this service item'
        Itemtotalprice : Decimal(15, 2);

        @sap.label    : 'From Position'
        @sap.quickinfo: 'Start position of the service assignment'
        Frompos        : String(10);

        @sap.label    : 'Currency'
        @sap.quickinfo: 'Currency code used for amounts (e.g., INR, USD, EUR)'
        Waers          : String(5);

        @sap.label    : 'To Position'
        @sap.quickinfo: 'End position of the service assignment'
        Topos          : String(10);

        @sap.label    : 'Short Text'
        @sap.quickinfo: 'Brief description of the service'
        Ktext1         : String(255);

        @sap.label    : 'Contract Item'
        @sap.quickinfo: 'Contract item number associated with the service'
        Vrtkz          : String(5);

        @sap.label    : 'Target Work Center'
        @sap.quickinfo: 'Work center where the service is targeted'
        Twrkz          : String(5);

        @sap.label    : 'Personnel Number'
        @sap.quickinfo: 'Identifier of the employee/personnel'
        Pernr          : String(10);

        @sap.label    : 'Country Grouping'
        @sap.quickinfo: 'Country grouping key for personnel data'
        Molga          : String(2);

        @sap.label    : 'Wage Type'
        @sap.quickinfo: 'Wage type linked to the service'
        Lgart          : String(4);

        @sap.label    : 'Wage Type Text'
        @sap.quickinfo: 'Description of the wage type'
        Lgtxt          : String(255);

        @sap.label    : 'Position'
        @sap.quickinfo: 'Organizational position reference'
        Stell          : String(10);

        @sap.label    : 'Service Number'
        @sap.quickinfo: 'Unique identifier of the service (IFtnr)'
        Iftnr          : String(20);

        @sap.label    : 'Posting Date'
        @sap.quickinfo: 'Date when the service entry was posted'
        Budat          : Date;

        @sap.label    : 'Inspection Date'
        @sap.quickinfo: 'Date when the service was inspected'
        Insdt          : Date;

        @sap.label    : 'Planning Package No.'
        @sap.quickinfo: 'Package number used during planning'
        PlnPackno      : String(20);

        @sap.label    : 'Planning Internal Row'
        @sap.quickinfo: 'Internal row reference used in planning'
        PlnIntrow      : String(10);

        @sap.label    : 'Account Assignment Package No.'
        @sap.quickinfo: 'Package number for account assignment'
        KntPackno      : String(20);

        @sap.label    : 'Account Assignment Internal Row'
        @sap.quickinfo: 'Internal row for account assignment'
        KntIntrow      : String(10);

        @sap.label    : 'Template Package No.'
        @sap.quickinfo: 'Package number from template reference'
        TmpPackno      : String(20);

        @sap.label    : 'Template Internal Row'
        @sap.quickinfo: 'Internal row from template reference'
        TmpIntrow      : String(10);

        @sap.label    : 'Limit for Service Level'
        @sap.quickinfo: 'Value limit defined for the service level'
        StlvLim        : Decimal(15, 2);

        @sap.label    : 'Limit Row'
        @sap.quickinfo: 'Row identifier for limit assignment'
        LimitRow       : String(10);

        @sap.label    : 'Actual Quantity'
        @sap.quickinfo: 'Quantity of service actually delivered'
        ActMenge       : Decimal(15, 3);

        @sap.label    : 'Actual Value'
        @sap.quickinfo: 'Monetary value of the actual delivered service'
        ActWert        : Decimal(15, 2);

        @sap.label    : 'Account Assignment Value'
        @sap.quickinfo: 'Value assigned to cost object/account'
        KntWert        : Decimal(15, 2);

        @sap.label    : 'Account Assignment Quantity'
        @sap.quickinfo: 'Quantity assigned to cost object/account'
        KntMenge       : Decimal(15, 3);

        @sap.label    : 'Target Value'
        @sap.quickinfo: 'Target monetary value for the service'
        Zielwert       : Decimal(15, 2);

        @sap.label    : 'Unplanned Value'
        @sap.quickinfo: 'Unplanned monetary value incurred'
        UngWert        : Decimal(15, 2);

        @sap.label    : 'Unplanned Quantity'
        @sap.quickinfo: 'Unplanned service quantity recorded'
        UngMenge       : Decimal(15, 3);

        @sap.label    : 'Alternative Internal Row'
        @sap.quickinfo: 'Alternative internal row reference'
        AltIntrow      : String(10);

        @sap.label    : 'Basic Data'
        @sap.quickinfo: 'Flag indicating basic data availability'
        Basic          : String(1);

        @sap.label    : 'Alternative'
        @sap.quickinfo: 'Indicator showing alternative service reference'
        Alternat       : String(1);

        @sap.label    : 'Bidder'
        @sap.quickinfo: 'Flag identifying bidder-related service entry'
        Bidder         : String(1);

        @sap.label    : 'Supplementary Data'
        @sap.quickinfo: 'Flag for supplementary service data'
        Supple         : String(1);

        @sap.label    : 'Free Quantity'
        @sap.quickinfo: 'Indicator of free service quantity provided'
        Freeqty        : String(1);

        @sap.label    : 'Information Flag'
        @sap.quickinfo: 'Flag used for informational service lines'
        Inform         : String(1);

        @sap.label    : 'Flat Rate'
        @sap.quickinfo: 'Flag indicating flat-rate service'
        Pausch         : String(1);

        @sap.label    : 'Eventual Service'
        @sap.quickinfo: 'Indicator for provisional/eventual service'
        Eventual       : String(1);

        @sap.label    : 'Tax Code'
        @sap.quickinfo: 'Tax code applied to the service'
        Mwskz          : String(4);

        @sap.label    : 'Tax Jurisdiction Code'
        @sap.quickinfo: 'Tax jurisdiction code for the service'
        Txjcd          : String(15);

        @sap.label    : 'Tax Date'
        @sap.quickinfo: 'Date relevant for tax calculation'
        Txdat          : Date;

        @sap.label    : 'Price Change Flag'
        @sap.quickinfo: 'Indicator showing if price change is allowed'
        PrsChg         : String(1);

        @sap.label    : 'Material Group'
        @sap.quickinfo: 'Material group classification for the service'
        Matkl          : String(18);

        @sap.label    : 'Gross Value'
        @sap.quickinfo: 'Gross value of the service line'
        Tbtwr          : Decimal(15, 2);

        @sap.label    : 'Net Value'
        @sap.quickinfo: 'Net value of the service line'
        Navnw          : Decimal(15, 2);

        @sap.label    : 'Base Amount'
        @sap.quickinfo: 'Base amount used for calculations'
        Baswr          : Decimal(15, 2);

        @sap.label    : 'Contract Number'
        @sap.quickinfo: 'Number of the related service contract'
        Kknumv         : String(10);

        @sap.label    : 'Unit for Work'
        @sap.quickinfo: 'Unit of measure for work performed'
        Iwein          : String(3);

        @sap.label    : 'Internal Work'
        @sap.quickinfo: 'Internal measurement of work quantity'
        IntWork        : Decimal(15, 3);

        @sap.label    : 'External ID'
        @sap.quickinfo: 'External identifier assigned to the service'
        Externalid     : String(50);

        @sap.label    : 'Cost Element'
        @sap.quickinfo: 'Cost element number for account assignment'
        Kstar          : String(10);

        @sap.label    : 'Actual Work'
        @sap.quickinfo: 'Work quantity actually performed'
        ActWork        : Decimal(15, 3);

        @sap.label    : 'Map Number'
        @sap.quickinfo: 'Map number reference for the service line'
        Mapno          : String(20);

        @sap.label    : 'Service Map Key'
        @sap.quickinfo: 'Key reference to the service mapping'
        Srvmapkey      : String(20);

        @sap.label    : 'Tax Tariff Code'
        @sap.quickinfo: 'Code representing tax tariff applicable'
        Taxtariffcode  : String(10);

        @sap.label    : 'Start Date'
        @sap.quickinfo: 'Start date for the service period'
        Sdate          : Date;

        @sap.label    : 'Begin Time'
        @sap.quickinfo: 'Start time of the service period'
        Begtime        : Time;

        @sap.label    : 'End Time'
        @sap.quickinfo: 'End time of the service period'
        Endtime        : Time;

        @sap.label    : 'External Personnel Number'
        @sap.quickinfo: 'External personnel reference number'
        Persext        : String(20);

        @sap.label    : 'CATS Counter'
        @sap.quickinfo: 'Counter from Cross-Application Time Sheet (CATS)'
        Catscounte     : String(10);

        @sap.label    : 'Stock Indicator'
        @sap.quickinfo: 'Flag indicating stock relevance'
        Stokz          : String(1);

        @sap.label    : 'Document Number'
        @sap.quickinfo: 'Document number associated with the SES detail'
        Belnr          : String(10);
}

// Product Catalog
entity ProductCatalogItems {
    key ProductId            : String
        @(cds.on.insert: $uuid)
        @sap.label     : 'Product ID'
        @sap.quickinfo : 'Unique identifier for the product';

        ProductName          : String(100)
        @sap.label     : 'Product Name'
        @sap.quickinfo : 'Name of the product';

        CommodityCode        : Integer
        @sap.label     : 'Commodity Code'
        @sap.quickinfo : 'UNSPSC commodity classification code';

        Category             : String(20)
        @sap.label     : 'Category'
        @sap.quickinfo : 'UNSPSC commodity classification code';

        SearchTerm           : array of String
        @sap.label     : 'Search Term'
        @sap.quickinfo : 'Keywords for product search';

        UnitPrice            : Decimal(15, 2)
        @sap.label     : 'Unit Price'
        @sap.quickinfo : 'Price per unit of the product';

        CurrencyCode         : String(3)
        @sap.label     : 'Currency Code'
        @sap.quickinfo : 'Currency code for pricing';

        UnitOfMeasure        : String(10)
        @sap.label     : 'Unit of Measure'
        @sap.quickinfo : 'Measurement unit for the product';

        LeadTimeDays         : Integer
        @sap.label     : 'Lead Time'
        @sap.quickinfo : 'Delivery lead time in days';

        PartNumber           : String(50)
        @sap.label     : 'Part Number'
        @sap.quickinfo : 'Manufacturer part number';

        AdditionalLink       : String(500)
        @sap.label     : 'Additional Link'
        @sap.quickinfo : 'URL for additional product information';

        ProductDescription   : String(500)
        @sap.label     : 'Product Description'
        @sap.quickinfo : 'Detailed description of the product';

        ProductImage         : String
        @sap.label     : 'Product Image'
        @sap.quickinfo : 'Product image file';

        ProductSpecification : String
        @sap.label     : 'Product Specification'
        @sap.quickinfo : 'PDF specification document';

        CreatedAt            : DateTime
        @sap.label     : 'Created At'
        @sap.quickinfo : 'Timestamp when record was created';

        CreatedBy            : String(50)
        @sap.label     : 'Created By'
        @sap.quickinfo : 'User who created the record';

        ModifiedAt           : DateTime
        @sap.label     : 'Modified At'
        @sap.quickinfo : 'Timestamp when record was last modified';

        ModifiedBy           : String(50)
        @sap.label     : 'Modified By'
        @sap.quickinfo : 'User who last modified the record';
}

entity CommodityCodes {
    key Commodity        : Integer
        @sap.label    : 'Commodity Code'
        @sap.quickinfo: 'UNSPSC commodity code';

        CommodityName    : String(100)
        @sap.label    : 'Description'
        @sap.quickinfo: 'Commodity code description';


        NumberOfProducts : Integer
        @sap.label    : 'Number of Products'
        @sap.quickinfo: 'Total number of products in this category';
}
