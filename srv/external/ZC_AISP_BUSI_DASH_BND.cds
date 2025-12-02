/* checksum : e9caf2f6dfe56492a54d4baa53c3ad88 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZC_AISP_BUSI_DASH_BND {
  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Buss.Dash.- My Business(PO Value- Y2D,M)'
  entity ZC_AISP_BD_MY_BUSINESS {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    key VendorCode : String(10) not null;
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Y2D : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Jan : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Feb : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Mar : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Apr : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_May : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Jun : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Jul : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Aug : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Sep : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Oct : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Nov : Decimal(11, 3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    PoValue_Dec : Decimal(11, 3);
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    TotalAmountCurrency : String(5);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Buss.Dash- Top5 Contracts based on Value'
  entity ZC_AISP_BD_MY_COMMITMENTS {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    key VendorCode : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Document'
    @sap.quickinfo : 'Purchasing Document Number'
    PurchaseContract : String(10);
    @sap.display.format : 'Date'
    @sap.label : 'Validity Per. Start'
    @sap.quickinfo : 'Start of Validity Period'
    ValidityStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Validity Period End'
    @sap.quickinfo : 'End of Validity Period'
    ValidityEndDate : Date;
    @odata.Type : 'Edm.Byte'
    DaysPendingToExpire : Integer;
    @sap.unit : 'TotalValueCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    TotalValue : Decimal(11, 3);
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    TotalValueCurrency : String(5);
    @sap.unit : 'TotalOrderedQuantityUnit'
    @sap.label : 'Order Quantity'
    @sap.quickinfo : 'Purchase Order Quantity'
    TotalOrderedQuantity : Decimal(13, 3);
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    TotalOrderedQuantityUnit : String(3);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Buss. Dash.- Top5 Open PO (PO Value)'
  entity ZC_AISP_BD_TOP5_OPEN_PO {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    key VendorCode : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Document'
    @sap.quickinfo : 'Purchasing Document Number'
    PoNo : String(10);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    TotalAmount : Decimal(11, 3);
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    TotalAmountCurrency : String(5);
    @sap.unit : 'TotalOrderedQuantityUnit'
    @sap.label : 'Order Quantity'
    @sap.quickinfo : 'Purchase Order Quantity'
    TotalOrderedQuantity : Decimal(13, 3);
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    TotalOrderedQuantityUnit : String(3);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Buss. Dashboard - Top5 Products (PO Qty)'
  entity ZC_AISP_BD_TOP5_PRODUCTS {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    key VendorCode : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    MaterialNo : String(18);
    @sap.label : 'Short Text'
    MaterialName : String(40);
    @sap.unit : 'TotalOrderedQuantityUnit'
    @sap.label : 'Order Quantity'
    @sap.quickinfo : 'Purchase Order Quantity'
    TotalOrderedQuantity : Decimal(13, 3);
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    TotalOrderedQuantityUnit : String(3);
    @sap.unit : 'TotalAmountCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Price'
    TotalAmount : Decimal(11, 3);
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    TotalAmountCurrency : String(5);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  entity SAP__Currencies {
    @sap.label : 'Currency'
    @sap.semantics : 'currency-code'
    key CurrencyCode : String(5) not null;
    @sap.label : 'ISO code'
    ISOCode : String(3) not null;
    @sap.label : 'Short text'
    Text : String(15) not null;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Decimals'
    DecimalPlaces : Integer not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  entity SAP__UnitsOfMeasure {
    @sap.label : 'Internal UoM'
    @sap.semantics : 'unit-of-measure'
    key UnitCode : String(3) not null;
    @sap.label : 'ISO code'
    ISOCode : String(3) not null;
    @sap.label : 'Commercial'
    ExternalCode : String(3) not null;
    @sap.label : 'Measurement Unit Txt'
    Text : String(30) not null;
    @sap.label : 'Decimal Places'
    DecimalPlaces : Integer;
  };
};

