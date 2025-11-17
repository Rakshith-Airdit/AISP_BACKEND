namespace VIM;


context MasterTable {
    entity PovimHeader {
            @sap.label    : 'Purchase Order Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order linked to this record'
            Ebeln                : String; // Purchase Order Number

            @sap.label    : 'Inbound Delivery'
            @sap.quickinfo: 'Inbound delivery document number associated with the PO'
            Vbeln                : String; // Inbound Delivery

            @sap.label    : 'Reference Document Number'
            @sap.quickinfo: 'Cross-reference document number (e.g., invoice/shipment reference)'
            Xblnr                : String; // Reference Document Number

            @sap.label    : 'Material Document Number'
            @sap.quickinfo: 'Material document generated for goods movement postings'
            Mblnr                : String; // Material Document Number

            @sap.label    : 'Company Code'
            @sap.quickinfo: 'Legal entity (company code) responsible for the document'
            Bukrs                : String; // Company Code

            @sap.label    : 'Document Date'
            @sap.quickinfo: 'Date on which the document was created/issued'
            Bedat                : String; // Document Date

            @sap.label    : 'Document Type'
            @sap.quickinfo: 'Type of purchasing document (e.g., Standard, Subcontracting)'
            Bstyp                : String; // Document Type

            @sap.label    : 'Purchase Order Type'
            @sap.quickinfo: 'Category of purchase order (e.g., NB – Standard PO)'
            Bsart                : String; // Purchase Order Type

            @sap.label    : 'Document Category'
            @sap.quickinfo: 'High-level category/classification of the document'
            Bsakz                : String; // Document Category

            @sap.label    : 'Deletion Flag'
            @sap.quickinfo: 'Indicates whether the document or item is marked for deletion'
            Loekz                : String; // Deletion Flag

            @sap.label    : 'Status'
            @sap.quickinfo: 'Overall processing status of the document'
            Statu                : String; // Status

            @sap.label    : 'Last Change Date (Technical)'
            @sap.quickinfo: 'Technical date of last change to the document'
            Aedat                : String; // Last Change Date

            @sap.label    : 'Created By'
            @sap.quickinfo: 'User ID of the person who created the document'
            Ernam                : String; // Created By

            @sap.label    : 'Last Changed Date'
            @sap.quickinfo: 'Business-readable last changed date (if different from Aedat)'
            LastChangeDate       : String; // Last Changed Date

            @sap.label    : 'Purchasing Document Increment'
            @sap.quickinfo: 'Internal increment/counter for the purchasing document'
            Pincr                : String; // Purchasing Document Increment

            @sap.label    : 'Purchase Order Item'
            @sap.quickinfo: 'Item number within the purchase order'
            Lponr                : String; // Purchase Order Item

            @sap.label    : 'Vendor Number'
            @sap.quickinfo: 'Supplier account number (LIFNR)'
            Lifnr                : String; // Vendor Number

            @sap.label    : 'ASN Amount'
            @sap.quickinfo: 'Total amount associated with the advance shipping notice'
            ASNamount            : Decimal; // ASN Amount

            @sap.label    : 'ASN Date'
            @sap.quickinfo: 'Date when the advance shipping notice was created/sent'
            AsnDate              : String; // ASN Date

            // @sap.label    : 'Approval Status'
            // @sap.quickinfo: 'Current approval status in the workflow'
            // Status             : String; // Approval Status

            @sap.label    : 'Vendor Name'
            @sap.quickinfo: 'Name of the supplier'
            Name1                : String; // Vendor Name

            @sap.label    : 'Vendor Address'
            @sap.quickinfo: 'Formatted address of the supplier'
            VendorAddress        : String; // Vendor Address

            @sap.label    : 'Bank Key'
            @sap.quickinfo: 'Bank identification key (e.g., routing/IFSC)'
            BankKey              : String; // Bank Key

            @sap.label    : 'Bank Account'
            @sap.quickinfo: 'Supplier’s bank account number'
            BankAccount          : String; // Bank Account

            @sap.label    : 'Bank Name'
            @sap.quickinfo: 'Name of the supplier’s bank'
            BankName             : String; // Bank Name

            @sap.label    : 'Payment Term'
            @sap.quickinfo: 'Payment terms (e.g., due days, cash discount)'
            Zterm                : String; // Payment Term

            @sap.label    : 'Discount Days 1'
            @sap.quickinfo: 'Number of days for the first cash discount period'
            Zbd1t                : Decimal; // Discount 1

            @sap.label    : 'Discount Days 2'
            @sap.quickinfo: 'Number of days for the second cash discount period'
            Zbd2t                : Decimal; // Discount 2

            @sap.label    : 'Discount Days 3'
            @sap.quickinfo: 'Number of days for the third cash discount period'
            Zbd3t                : Decimal; // Discount 3

            @sap.label    : 'Discount Percent 1'
            @sap.quickinfo: 'Cash discount percentage for the first period'
            Zbd1p                : Decimal; // Discount Percent 1

            @sap.label    : 'Discount Percent 2'
            @sap.quickinfo: 'Cash discount percentage for the second period'
            Zbd2p                : Decimal; // Discount Percent 2

            @sap.label    : 'Purchasing Organization'
            @sap.quickinfo: 'Organization unit responsible for procurement'
            Ekorg                : String; // Purchasing Organization

            @sap.label    : 'Purchasing Group'
            @sap.quickinfo: 'Buyer / buying group responsible for this document'
            Ekgrp                : String; // Purchasing Group

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Transaction currency code (WAERS)'
            Waers                : String; // Currency

            @sap.label    : 'Fixed Exchange Rate'
            @sap.quickinfo: 'Indicates a fixed currency/exchange rate is applied'
            Kufix                : Decimal; // Fixed Currency

            @sap.label    : 'Valid From'
            @sap.quickinfo: 'Start date of validity (e.g., conditions/contract)'
            Kdatb                : String; // Valid From Date

            @sap.label    : 'Valid To'
            @sap.quickinfo: 'End date of validity (e.g., conditions/contract)'
            Kdate                : String; // Valid To Date

            @sap.label    : 'Planned Delivery Date'
            @sap.quickinfo: 'Planned date for delivery of goods/services'
            Bwbdt                : String; // Planned Delivery Date

            @sap.label    : 'Delivery Date'
            @sap.quickinfo: 'Promised/requested date for delivery'
            Angdt                : String; // Delivery Date

            @sap.label    : 'Binding Date'
            @sap.quickinfo: 'Date until which an offer/commitment remains binding'
            Bnddt                : String; // Binding Date

            @sap.label    : 'Goods Receipt Date'
            @sap.quickinfo: 'Date on which the goods receipt was posted'
            Gwldt                : String; // Goods Receipt Date

            @sap.label    : 'Reference PO Number'
            @sap.quickinfo: 'Related or preceding purchase order number'
            Ausnr                : String; // Reference Purchase Order Number

            @sap.label    : 'Document Number'
            @sap.quickinfo: 'Generic related document number (context-dependent)'
            Angnr                : String; // Document Number

            @sap.label    : 'Planned Delivery'
            @sap.quickinfo: 'Planned delivery reference (quantity/date)'
            Ihran                : String; // Planned Delivery

            @sap.label    : 'Deliveries Pending'
            @sap.quickinfo: 'Outstanding deliveries yet to be received'
            Ihrez                : String; // Deliveries Pending

            @sap.label    : 'Sales Organization'
            @sap.quickinfo: 'Sales organization involved, if applicable'
            Verkf                : String; // Sales Organization

            @sap.label    : 'Vendor Code (Alt.)'
            @sap.quickinfo: 'Alternate vendor code used in processes'
            Llief                : String; // Vendor Code

            @sap.label    : 'Customer Number'
            @sap.quickinfo: 'Customer account number (if relevant)'
            Kunnr                : String; // Customer Number

            @sap.label    : 'Active ID'
            @sap.quickinfo: 'Identifier denoting active record/version'
            ActiveId             : String; // Active ID

            @sap.label    : 'Account Number'
            @sap.quickinfo: 'Account assignment/contract number'
            Konnr                : String; // Account Number

            @sap.label    : 'Account Group'
            @sap.quickinfo: 'Grouping used for account classification'
            Abgru                : String; // Account Group

            @sap.label    : 'Automatic Delivery Flag'
            @sap.quickinfo: 'Indicates whether automatic delivery is allowed'
            Autlf                : String; // Authorisation Flag

            @sap.label    : 'Active Indicator'
            @sap.quickinfo: 'Marks whether the record is currently active'
            Weakt                : String; // Active Indicator

            @sap.label    : 'Total Amount'
            @sap.quickinfo: 'Total value of the document in document currency'
            TotalAmount          : Decimal;

            @sap.label    : 'Approval Comment'
            @sap.quickinfo: 'Remarks recorded by approvers when approving'
            APPROVED_COMMENT     : String;

            @sap.label    : 'Rejection Comment'
            @sap.quickinfo: 'Reason/remarks provided upon rejection'
            REJECTED_COMMENT     : String;

            @sap.label    : 'Created On'
            @sap.quickinfo: 'Timestamp when the record was created'
            CREATED_ON           : Timestamp;

            @sap.label    : 'Last Updated On'
            @sap.quickinfo: 'Timestamp of the most recent update'
            LAST_UPDATED_ON      : Timestamp;

            @sap.label    : 'Process Level'
            @sap.quickinfo: 'Current level/stage in the business workflow'
            PROCESS_LEVEL        : String;

            @sap.label    : 'Invoice Reference Number'
            @sap.quickinfo: 'External invoice reference linked to this process'
            Invoicerefno         : String; // Invoice Reference Number

            @sap.label    : 'Invoice Date'
            @sap.quickinfo: 'Date printed or recorded on the invoice'
            Invoicedate          : Date;

            @sap.label    : 'Approver Role'
            @sap.quickinfo: 'Role responsible for the current approval step'
            APPROVER_ROLE        : String;

            @sap.label    : 'Approver Level'
            @sap.quickinfo: 'Numeric level of the approver in the workflow'
            APPROVER_LEVEL       : Integer;

            @sap.label    : 'Current Assignee'
            @sap.quickinfo: 'User currently assigned to act on the item'
            CURRENT_ASSIGNEE     : String;

            @sap.label    : 'Company Code (Display)'
            @sap.quickinfo: 'Display copy of the company code for UI/use cases'
            COMPANY_CODE         : String;

            @sap.label    : 'Invoice Number'
            @sap.quickinfo: 'Identifier of the vendor/customer invoice'
            INVOICE_NUMBER       : String;

            @sap.label    : 'Max Approver Level'
            @sap.quickinfo: 'Highest approver level configured for this workflow'
            MAX_APPROVER_LEVEL   : Integer;


            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for this process'
        key REQUEST_NO           : Integer;

            @sap.label    : 'Source type'
            @sap.quickinfo: 'Source type'
            SOURCE_TYPE          : String;


            @sap.label    : 'Invoice ref no'
            @sap.quickinfo: 'It mainatains the invoice reference number for the PO, If reference number is here that means invoice has been posted or invoice is not posted'
            supplierInvoiceRefNo : String;

            @sap.label    : 'STATUS'
            @sap.quickinfo: '3 - Rejected, 4 - Pending, 5 - Approved'
            STATUS               : Integer;

            @sap.label    : 'VIM Items'
            @sap.quickinfo: 'Association to all VIM items belonging to this request'
            TO_VIM_ITEMS         : Association to many VIM.MasterTable.PovimItem
                                       on TO_VIM_ITEMS.REQUEST_NO = REQUEST_NO;

            @sap.label    : 'VIM Attachments'
            @sap.quickinfo: 'Association to all company profile attachments for this request'
            TO_VIM_ATTACHMENTS   : Association to many VIM.MasterTable.Attachment_CompanyProfile
                                       on TO_VIM_ATTACHMENTS.REQUEST_NO = REQUEST_NO
    }

    entity PovimItem {
            @sap.label    : 'Purchase Order Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order'
            Ebeln        : String; // Purchase Order Number

            @sap.label    : 'Inbound Delivery'
            @sap.quickinfo: 'Inbound delivery document number linked to the PO'
            Vbeln        : String; // Inbound Delivery

            @sap.label    : 'Purchase Order Item'
            @sap.quickinfo: 'Item number within the Purchase Order'
            Ebelp        : String; // Purchase Order Item

            @sap.label    : 'Short Text Description'
            @sap.quickinfo: 'Brief description of the item or material'
            Txz01        : String; // Short Text Description

            @sap.label    : 'ASN Type'
            @sap.quickinfo: 'Type/category of the Advance Shipping Notification'
            Ebtyp        : String; // ASN Type

            @sap.label    : 'Expected Delivery Date'
            @sap.quickinfo: 'Planned delivery date for the item'
            Eindt        : Date; // Expected Delivery Date

            @sap.label    : 'Delivery Quantity'
            @sap.quickinfo: 'Quantity scheduled for delivery'
            Lpein        : Decimal; // Delivery Quantity

            @sap.label    : 'Time of Delivery'
            @sap.quickinfo: 'Planned time of delivery'
            Uzeit        : Time; // Time of Delivery

            @sap.label    : 'Document Date'
            @sap.quickinfo: 'Date when the document was created'
            Erdat        : Date; // Document Date

            @sap.label    : 'Delivery Time'
            @sap.quickinfo: 'Time when the delivery was recorded'
            Ezeit        : Time; // Delivery Time

            @sap.label    : 'Quantity'
            @sap.quickinfo: 'Actual quantity of the material/item'
            Menge        : Decimal; // Quantity

            @sap.label    : 'ASN Quantity'
            @sap.quickinfo: 'Quantity specified in the ASN'
            AsnQty       : Decimal; // ASN Quantity

            @sap.label    : 'ASN Item Amount'
            @sap.quickinfo: 'Amount for the item in the ASN'
            ASNitAmount  : Decimal; // ASN Amount

            @sap.label    : 'Goods Receipt ASN Amount'
            @sap.quickinfo: 'Amount recorded in the goods receipt for the ASN item'
            GRNitAmount  : Decimal; // Goods Receipt ASN Amount

            @sap.label    : 'Tax Percentage'
            @sap.quickinfo: 'Tax percentage applied to the item'
            Taxper       : Decimal; // Tax Percentage

            @sap.label    : 'Tax Value'
            @sap.quickinfo: 'Tax value calculated for the item'
            Taxval       : Decimal; // Tax Value

            @sap.label    : 'Total Amount'
            @sap.quickinfo: 'Total amount including taxes for the item'
            Total        : Decimal; // Total Amount

            @sap.label    : 'Unit of Measure'
            @sap.quickinfo: 'Measurement unit for the quantity (e.g., EA, KG, L)'
            Meins        : String; // Unit of Measure

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Transaction currency (e.g., INR, USD, EUR)'
            Waers        : String; // Currency

            @sap.label    : 'Stock Type'
            @sap.quickinfo: 'Type of stock (e.g., unrestricted, quality, blocked)'
            Estkz        : String; // Stock Type

            @sap.label    : 'Deletion Flag'
            @sap.quickinfo: 'Indicates whether the item is flagged for deletion'
            Loekz        : String; // Deletion Flag

            @sap.label    : 'Discount Flag'
            @sap.quickinfo: 'Indicates whether discounts are applied to the item'
            Kzdis        : String; // Discount Flag

            @sap.label    : 'Reference Document Number'
            @sap.quickinfo: 'Reference to another document (e.g., invoice, shipment)'
            Xblnr        : String; // Reference Document Number

            @sap.label    : 'Inbound Delivery Item'
            @sap.quickinfo: 'Item number within the inbound delivery'
            Vbelp        : String; // Item Number for Inbound Delivery

            @sap.label    : 'Material Profile'
            @sap.quickinfo: 'Profile that defines material-specific settings'
            Mprof        : String; // Material Profile

            @sap.label    : 'Material Number'
            @sap.quickinfo: 'Unique identifier of the material'
            Ematn        : String; // Material Number

            @sap.label    : 'Shipping Indicator'
            @sap.quickinfo: 'Indicator used for shipping/expediting purposes'
            Mahnz        : String; // Shipping Indicator

            @sap.label    : 'Batch Number'
            @sap.quickinfo: 'Batch/lot number of the material'
            Charg        : String; // Batch Number

            @sap.label    : 'Shipment Control'
            @sap.quickinfo: 'Shipment control indicator'
            Uecha        : String; // Shipment Control

            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier linked to this item'
        key REQUEST_NO   : Integer;

            @sap.label    : 'Invoice Reference Number'
            @sap.quickinfo: 'Reference number of the linked invoice'
            Invoicerefno : String; // Invoice Reference Number

            @sap.label    : 'Invoice Date'
            @sap.quickinfo: 'Date printed/recorded on the invoice'
            Invoicedate  : Date;
    }

    entity Attachment_CompanyProfile {
            @sap.label    : 'Vendor Code'
            @sap.quickinfo: 'Unique code assigned to the vendor'
        key VendorCode      : String;

            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier linked to the attachment'
        key REQUEST_NO      : Int32;

            @sap.label    : 'Description'
            @sap.quickinfo: 'Brief description of the attachment content'
            DESCRIPTION     : String;

            @sap.label    : 'Image URL'
            @sap.quickinfo: 'URL location where the attachment image is stored'
            IMAGEURL        : String;

            @sap.label    : 'Image File Name'
            @sap.quickinfo: 'Original file name of the uploaded image'
            IMAGE_FILE_NAME : String;

            @sap.label    : 'Comment'
            @sap.quickinfo: 'Additional remarks or notes related to the attachment'
            COMMENT         : String;

            @sap.label    : 'Status'
            @sap.quickinfo: 'Current status of the attachment (e.g., Active, Inactive)'
            STATUS          : String;

            @sap.label    : 'Attachment ID'
            @sap.quickinfo: 'Unique identifier of the attachment record'
        key ATTACHMENT_ID   : String;
    };

    entity VIM_APPROVAL_COMMENTS {
            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for which the comment is recorded'
        key REQUEST_NO     : String(20);

            @sap.label    : 'Approval Level'
            @sap.quickinfo: 'Numeric level of the approval step in the workflow'
            APPROVAL_LEVEL : Integer;

            @sap.label    : 'Approver ID'
            @sap.quickinfo: 'Unique identifier of the approver (e.g., user ID or employee ID)'
            APPROVER_ID    : String(50);

            @sap.label    : 'Approver Role'
            @sap.quickinfo: 'Role of the approver in the approval process'
            APPROVER_ROLE  : String(50);

            @sap.label    : 'Action'
            @sap.quickinfo: 'Action taken by the approver (e.g., Approved, Rejected, Forwarded)'
            ACTION         : String(20);

            @sap.label    : 'Comment'
            @sap.quickinfo: 'Remarks or notes provided by the approver'
            COMMENT        : String(500);

            @sap.label    : 'Timestamp'
            @sap.quickinfo: 'Date and time when the action/comment was recorded'
            TIMESTAMP      : Timestamp;
    };

    entity VIM_APPROVAL_LOGS {

            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for which the approval log is recorded'
        key REQUEST_NO     : Integer;

            @sap.label    : 'Approval Level'
            @sap.quickinfo: 'Numeric level of the approval step in the workflow'
            APPROVAL_LEVEL : Integer;

            @sap.label    : 'Approver ID'
            @sap.quickinfo: 'Unique identifier of the approver (e.g., user ID or employee ID)'
            APPROVER_ID    : String;

            @sap.label    : 'Approver Role'
            @sap.quickinfo: 'Role of the approver in the approval process'
            APPROVER_ROLE  : String;

            @sap.label    : 'Action'
            @sap.quickinfo: 'Action taken by the approver (e.g., Approved, Rejected, Forwarded)'
            ACTION         : String;

            @sap.label    : 'Comment'
            @sap.quickinfo: 'Remarks or notes provided by the approver'
            COMMENT        : String;

            @sap.label    : 'Timestamp'
            @sap.quickinfo: 'Date and time when the action was performed'
            TIMESTAMP      : Timestamp;

            @sap.label    : 'S/4HANA Response'
            @sap.quickinfo: 'Response message returned from the S/4HANA system'
            S4Response     : String; // Optional

            @sap.label    : 'S/4HANA Error Message'
            @sap.quickinfo: 'Error message from S/4HANA in case of failure'
            S4ErrorMessage : String; // Optional

            @sap.label    : 'Updated On'
            @sap.quickinfo: 'Timestamp when the approval log was last updated'
            UPDATED_ON     : Timestamp; // Optional
    };

    entity NPoVimHead {
            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for the Non-PO invoice'
        key REQUEST_NO                : Integer;

            @sap.label    : 'Invoice Number'
            @sap.quickinfo: 'Unique number identifying the vendor invoice'
            INVOICE_NUMBER            : String;

            @sap.label    : 'Source Type'
            @sap.quickinfo: 'Source type email or portal'
            SOURCE_TYPE               : String;

            @sap.label    : 'Invoice Date'
            @sap.quickinfo: 'Date when the invoice was issued'
            INVOICE_DATE              : Date;

            @sap.label    : 'Total Amount'
            @sap.quickinfo: 'Total invoice amount in document currency'
            TOTAL_AMOUNT              : Decimal;

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Currency code of the invoice (e.g., INR, USD, EUR)'
            CURRENCY                  : String;

            @sap.label    : 'Supplier Number'
            @sap.quickinfo: 'Unique vendor identifier (LIFNR) for the supplier'
            SUPPLIER_NUMBER           : String; // Lifnr

            @sap.label    : 'Supplier Reference No after post call to s4'
            @sap.quickinfo: 'After final post call'
            SUPPLIER_INVOICE_REF_NO   : String;

            @sap.label    : 'Vendor Status'
            @sap.quickinfo: 'Status set by the vendor when uploading and submitting the document'
            VENDOR_STATUS             : String; // vendor action status

            @sap.label    : 'Supplier Name'
            @sap.quickinfo: 'Full name of the vendor or supplier'
            SUPPLIER_NAME             : String;

            @sap.label    : 'Approver Role'
            @sap.quickinfo: 'Role responsible for approving the Non-PO invoice'
            APPROVER_ROLE             : String;

            @sap.label    : 'Expense Type'
            @sap.quickinfo: 'Type/category of expense recorded in the invoice'
            EXPENSE_TYPE              : String;

            @sap.label    : 'Company Code'
            @sap.quickinfo: 'Company code (from master data) responsible for the posting'
            COMPANY_CODE              : String; // Master

            @sap.label    : 'Status'
            @sap.quickinfo: 'Current processing status of the Non-PO invoice Example: 5 -Approved, 25 - Pending, 4 - Pending, 3 - Rejected'
            STATUS                    : Integer;

            @sap.label    : 'Record Created'
            @sap.quickinfo: 'Supplier Created or Upload the invoice'
            CREATED_ON                : Date;

            @sap.label    : 'Status Description'
            @sap.quickinfo: 'Readable description of the current status'
            STATUS_DESC               : String;

            @sap.label    : 'Invoice Reference Number'
            @sap.quickinfo: 'Reference number returned from SAP response for invoice processing'
            INVOICE_REF_NO            : String; // SAP Response

            @sap.label    : 'Posting Date'
            @sap.quickinfo: 'Date of posting in SAP (as returned in response)'
            POSTING_DATE              : String; // SAP Response

            @sap.label    : 'Approval Comment'
            @sap.quickinfo: 'Remarks recorded when the invoice is approved'
            APPROVED_COMMENT          : String;

            @sap.label    : 'Rejection Comment'
            @sap.quickinfo: 'Remarks or reason provided when the invoice is rejected'
            REJECTED_COMMENT          : String;

            @sap.label    : 'Current Assignee'
            @sap.quickinfo: 'User currently assigned to process the invoice'
            CURRENT_ASSIGNEE          : String;

            @sap.label    : 'Current Assignee Role'
            @sap.quickinfo: 'Role of the current assignee handling the invoice'
            CURRENT_ASSIGNEE_ROLE     : String;

            @sap.label    : 'Central Tax'
            @sap.quickinfo: 'Central GOVT TAx'
            CGST                      : Decimal;

            @sap.label    : '  State Tax'
            @sap.quickinfo: 'State Govt Tax'
            SGST                      : Decimal;

            @sap.label    : 'Integrated Goods and Services Tax'
            @sap.quickinfo: 'Integrated Goods and Services Tax'
            IGST                      : Decimal;


            @sap.label    : 'Non-PO Invoice Items'
            @sap.quickinfo: 'Association to all Non-PO invoice item records for this request'
            TO_VIM_NON_PO_ITEMS       : Association to many VIM.MasterTable.NPoVimItem
                                            on TO_VIM_NON_PO_ITEMS.REQUEST_NO = REQUEST_NO;

            @sap.label    : 'Non-PO Invoice Attachments'
            @sap.quickinfo: 'Association to all attachment records uploaded for this Non-PO invoice'
            TO_VIM_NON_PO_ATTCHEMENTS : Association to many VIM.MasterTable.NPoVimAttachments
                                            on TO_VIM_NON_PO_ATTCHEMENTS.REQUEST_NO = REQUEST_NO;
    }

    entity NPoVimItem {
            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for the Non-PO invoice item'
        key REQUEST_NO       : Integer;

            @sap.label    : 'Item Number'
            @sap.quickinfo: 'Invoice line item number (BUZEI)'
            SR_NO            : Integer; // Buzei // Invoice item no.

            @sap.label    : 'Material'
            @sap.quickinfo: 'Material number associated with the item, if applicable'
            MATERIAL         : String;

            @sap.label    : 'Cost Object Type'
            @sap.quickinfo: 'Type of cost object (e.g., Cost Center, WBS Element, Internal Order)'
            COST_OBJECT_TYPE : String;

            @sap.label    : 'Cost Object'
            @sap.quickinfo: 'Identifier of the cost object to which this expense is charged'
            COST_OBJECT      : String;

            @sap.label    : 'G/L Account'
            @sap.quickinfo: 'General Ledger account number for financial posting'
            GL_ACCOUNT       : String;

            @sap.label    : 'Quantity'
            @sap.quickinfo: 'Quantity of goods or services for this invoice item'
            QUANTITY         : Int32;

            @sap.label    : 'Price'
            @sap.quickinfo: 'Unit price or total price for this invoice item'
            PRICE            : Decimal;
    }

    entity NPoVimAttachments {
            @sap.label    : 'Vendor Code'
            @sap.quickinfo: 'Unique code assigned to the vendor who uploaded the attachment'
        key VendorCode      : String;

            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier linked to the Non-PO invoice attachment'
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

    entity VIM_NPO_APPROVAL_LOGS {
            @sap.label    : 'Request Number'
            @sap.quickinfo: 'Internal request identifier for the Non-PO invoice approval log'
        key REQUEST_NO     : Integer;

            @sap.label    : 'Approval Level'
            @sap.quickinfo: 'Numeric level of the approval step in the workflow'
            APPROVAL_LEVEL : Integer;

            @sap.label    : 'Approver ID'
            @sap.quickinfo: 'Unique identifier of the approver (e.g., user ID or employee ID)'
            APPROVER_ID    : String;

            @sap.label    : 'Approver Role'
            @sap.quickinfo: 'Role of the approver in the Non-PO approval process'
            APPROVER_ROLE  : String;

            @sap.label    : 'Action'
            @sap.quickinfo: 'Action taken by the approver (e.g., Approved, Rejected, Forwarded)'
            ACTION         : String;

            @sap.label    : 'Comment'
            @sap.quickinfo: 'Remarks or notes provided by the approver'
            COMMENT        : String;

            @sap.label    : 'Timestamp'
            @sap.quickinfo: 'Date and time when the action was performed'
            TIMESTAMP      : Timestamp;
    }

    entity CostObjectTypes {
            @sap.label    : 'Type Code'
            @sap.quickinfo: 'Unique identifier code for the cost object type'
        key TYPE_CODE   : String;

            @sap.label    : 'Description'
            @sap.quickinfo: 'Text description of the cost object type'
            DESCRIPTION : String;
    }

    entity CostObjects {
            @sap.label    : 'Cost Object Value'
            @sap.quickinfo: 'Unique identifier or code of the cost object'
        key VALUE : String;

            @sap.label    : 'Cost Object Type'
            @sap.quickinfo: 'Type/category of the cost object (e.g., Cost Center, WBS, Internal Order)'
        key TYPE  : String;

            @sap.label    : 'Label'
            @sap.quickinfo: 'Readable description or label for the cost object'
            LABEL : String;
    }

    entity GLAccounts {
            @sap.label    : 'G/L Account'
            @sap.quickinfo: 'General Ledger account number used for financial postings'
        key SAKNR : String; // GL Account

            @sap.label    : 'Description'
            @sap.quickinfo: 'Short text description of the G/L account'
            TXT20 : String; // Description
    }
}
