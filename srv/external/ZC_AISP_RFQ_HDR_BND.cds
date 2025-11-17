/* checksum : e68be5ffcd4a9df0d40cecf130e37f4d */
@cds.external               : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported: 'true'
@sap.supported.formats      : 'atom json xlsx'
service ZC_AISP_RFQ_HDR_BND {};

@cds.external        : true
@cds.persistence.skip: true
@sap.creatable       : 'false'
@sap.updatable       : 'false'
@sap.deletable       : 'false'
@sap.content.version : '1'
@sap.label           : 'Consumption View for RFQ Header'
entity ZC_AISP_RFQ_HDR_BND.ZC_AISP_RFQ_HDR {
        @sap.display.format: 'UpperCase'
        @sap.Label         : 'RFQ Number'
        @sap.QuickInfo     : 'Unique identifier for the RFQ'
    key RfqNumber        : String(10) not null;

        @sap.display.format: 'UpperCase'
        @sap.Label         : 'Bidder'
        @sap.QuickInfo     : 'Supplier/vendor code'
    key Bidder           : String(10) not null;

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Company Code'
        CompanyCode      : String(4);

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Purchasing Doc. Type'
        @sap.quickinfo     : 'Purchasing Document Type'
        DocumentType     : String(4);

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Purch. organization'
        @sap.quickinfo     : 'Purchasing organization'
        PurchasingOrg    : String(4);

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Purchasing Group'
        PurchasingGroup  : String(3);

        @sap.display.format: 'Date'
        @sap.label         : 'Document Date'
        @sap.quickinfo     : 'Purchasing Document Date'
        DocumentDate     : Date;

        @sap.label         : 'Currency'
        @sap.quickinfo     : 'Currency Key'
        @sap.semantics     : 'currency-code'
        PriceUnit        : String(5);

        @sap.display.format: 'Date'
        @sap.label         : 'Quotation Deadline'
        @sap.quickinfo     : 'Deadline for Submission of Bid/Quotation'
        Deadline_dt      : Date;

        @sap.display.format: 'Date'
        @sap.label         : 'Date'
        @sap.quickinfo     : 'Creation date of the change document'
        Published_d      : Date;

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Created By'
        @sap.quickinfo     : 'User of person who created a purchasing document'
        CreatedBy        : String(12);

        @sap.label         : 'Time'
        @sap.quickinfo     : 'Time changed'
        Published_t      : Time;

        @sap.label         : 'Name'
        @sap.quickinfo     : 'Name 1'
        VendorName       : String(35);

        @sap.label: 'E-Mail Address'
        Email            : String(241);

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Account group'
        @sap.quickinfo     : 'Vendor account group'
        VendorAccgrp     : String(4);

        @sap.label         : 'Name'
        @sap.quickinfo     : 'Account Group Name'
        VendorAccgrpName : String(30);

        @sap.unit          : 'PriceUnit'
        @sap.variable.scale: 'true'
        @sap.label         : 'Target Value'
        @sap.quickinfo     : 'Target Value for Header Area per Distribution'
        TargetValue      : Decimal(15, 3);
        Status           : String(9);

        @sap.label         : 'Description'
        @sap.quickinfo     : 'Description of terms of payment'
        PymentDesc       : String(30);
        Published_d_t    : String(15);
        to_rfqitem       : Composition of many ZC_AISP_RFQ_HDR_BND.ZC_AISP_RFQ_ITEM {};
};

@cds.external        : true
@cds.persistence.skip: true
@sap.creatable       : 'false'
@sap.updatable       : 'false'
@sap.deletable       : 'false'
@sap.content.version : '1'
@sap.label           : 'Consumption View for RFQ Item'
entity ZC_AISP_RFQ_HDR_BND.ZC_AISP_RFQ_ITEM {
        @sap.display.format: 'UpperCase'
        @sap.label         : 'Purchasing Document'
        @sap.quickinfo     : 'Purchasing Document Number'
    key RfqNumber      : String(10) not null;

        @sap.display.format: 'NonNegative'
        @sap.label         : 'Item'
        @sap.quickinfo     : 'Item Number of Purchasing Document'
    key ItemNumber     : String(5) not null;

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Ref. to suplr'
        @sap.quickinfo     : 'Reference to other supplier'
    key Bidder         : String(10) not null;

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Material'
        @sap.quickinfo     : 'Material Number'
        MaterialNo     : String(18);

        @sap.label: 'Short Text'
        MaterialDesc   : String(40);
        LotType        : String(30);

        @sap.label         : 'Order Unit'
        @sap.quickinfo     : 'Purchase Order Unit of Measure'
        @sap.semantics     : 'unit-of-measure'
        UnitOfMeasure  : String(3);

        @sap.label         : 'Currency'
        @sap.quickinfo     : 'Currency Key'
        @sap.semantics     : 'currency-code'
        Currency       : String(5);
        PlantAddress   : String(157);

        @sap.unit          : 'UnitOfMeasure'
        @sap.label         : 'Scheduled Quantity'
        Quantity       : Decimal(13, 3);

        @sap.display.format: 'UpperCase'
        @sap.label         : 'Plant'
        Plant          : String(4);

        @sap.unit          : 'Currency'
        @sap.variable.scale: 'true'
        @sap.label         : 'Net Order Price'
        @sap.quickinfo     : 'Net Price in Purchasing Document (in Document Currency)'
        Netpr          : Decimal(11, 3);

        @sap.unit          : 'Currency'
        @sap.variable.scale: 'true'
        @sap.label         : 'Net Order Value'
        @sap.quickinfo     : 'Net Order Value in PO Currency'
        Netwr          : Decimal(13, 3);

        @sap.sortable      : 'false'
        @sap.filterable    : 'false'
        basic_longtext : String(1200);
        to_rfqheader   : Association to ZC_AISP_RFQ_HDR_BND.ZC_AISP_RFQ_HDR {};
};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
entity ZC_AISP_RFQ_HDR_BND.SAP__Currencies {
        @sap.label    : 'Currency'
        @sap.semantics: 'currency-code'
    key CurrencyCode  : String(5) not null;

        @sap.label: 'ISO code'
        ISOCode       : String(3) not null;

        @sap.label: 'Short text'
        Text          : String(15) not null;

        @odata.Type   : 'Edm.Byte'
        @sap.label    : 'Decimals'
        DecimalPlaces : Integer not null;
};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
entity ZC_AISP_RFQ_HDR_BND.SAP__UnitsOfMeasure {
        @sap.label    : 'Internal UoM'
        @sap.semantics: 'unit-of-measure'
    key UnitCode      : String(3) not null;

        @sap.label: 'ISO code'
        ISOCode       : String(3) not null;

        @sap.label: 'Commercial'
        ExternalCode  : String(3) not null;

        @sap.label: 'Measurement Unit Txt'
        Text          : String(30) not null;

        @sap.label: 'Decimal Places'
        DecimalPlaces : Integer;
};
