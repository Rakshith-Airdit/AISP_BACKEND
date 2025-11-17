/* checksum : 495bed3b1a231c1362c2b5bad0b01850 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZP_MM_POHEAD_BND {};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.content.version : '1'
@sap.label : 'Consumption view for Service PO'
entity ZP_MM_POHEAD_BND.ZC_MM_ESLL {
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package number'
  key Packno : String(10) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Line'
  @sap.quickinfo : 'Line Number'
  key Introw : String(10) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Line Number'
  Extrow : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Activity number'
  @sap.quickinfo : 'Activity Number'
  Srvpos : String(18);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package'
  @sap.quickinfo : 'Subpackage number'
  SubPackno : String(10);
  @sap.label : 'Short Text'
  Ktext1 : String(40);
  @sap.label : 'Quantity'
  @sap.quickinfo : 'Quantity with Sign'
  Menge : Decimal(13, 3);
  @sap.label : 'Base Unit of Measure'
  @sap.semantics : 'unit-of-measure'
  Meins : String(3);
  @sap.label : 'Gross Price'
  Brtwr : Decimal(12, 3);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  waers : String(5);
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection View for PO header'
entity ZP_MM_POHEAD_BND.ZP_MM_POHEAD {
  @sap.display.format : 'UpperCase'
  Email :String;
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  key Ebeln : String(10) not null;
  @sap.label : 'Dyn. Action Control'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  confirm_ac : Boolean;
  @sap.label : 'Dyn. Method Control'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Delete_mc : Boolean;
  @sap.label : 'Dyn. Method Control'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Update_mc : Boolean;
  @sap.label : 'Dynamic CbA-Control'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  to_poitem_oc : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Created By'
  @sap.quickinfo : 'User of person who created a purchasing document'
  Ernam : String(12);
  Lifnr : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purch. organization'
  @sap.quickinfo : 'Purchasing organization'
  Ekorg : String(4);
  @sap.label : 'Name'
  @sap.quickinfo : 'Name 1'
  name1 : String(35);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  Waers : String(5);
  @sap.display.format : 'Date'
  @sap.label : 'Document Date'
  @sap.quickinfo : 'Purchasing Document Date'
  Bedat : Date;
  zdays : Integer;
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  Amount : Decimal(13, 3);
  Status : String(10);
  to_poitem : Composition of many ZP_MM_POHEAD_BND.ZP_MM_POITEM {  };
} actions {
  action confirm(
    @sap.label : 'Item'
    Ebelp : String(5)
  ) returns ZP_MM_POHEAD_BND.DummyFunctionImportResult;
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection View for PO item'
entity ZP_MM_POHEAD_BND.ZP_MM_POITEM {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  key Ebeln : String(10) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Item'
  @sap.quickinfo : 'Item Number of Purchasing Document'
  key Ebelp : String(5) not null;
  @sap.label : 'Dyn. Method Control'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Delete_mc : Boolean;
  @sap.label : 'Dyn. Method Control'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  Update_mc : Boolean;
  @sap.label : 'Short Text'
  Txz01 : String(40);
  Type : String(8);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Material'
  @sap.quickinfo : 'Material Number'
  Matnr : String(18);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Plant'
  Werks : String(4);
  @sap.unit : 'Meins'
  @sap.label : 'Order Quantity'
  @sap.quickinfo : 'Purchase Order Quantity'
  Menge : Decimal(13, 3);
  @sap.label : 'Order Unit'
  @sap.quickinfo : 'Purchase Order Unit of Measure'
  @sap.semantics : 'unit-of-measure'
  Meins : String(3);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package number'
  Packno : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package'
  @sap.quickinfo : 'Subpackage number'
  SubPackno : String(10);
  @sap.unit : 'Meins'
  @sap.label : 'Quantity'
  @sap.quickinfo : 'Quantity as Per Supplier Confirmation'
  Confirmedqty : Decimal(13, 3);
  @sap.display.format : 'Date'
  @sap.label : 'Delivery date'
  @sap.quickinfo : 'Item delivery date'
  eindt : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Doc. Condition No.'
  @sap.quickinfo : 'Number of the Document Condition'
  knumv : String(10);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Value'
  @sap.quickinfo : 'Condition Value'
  Discount : Decimal(15, 3);
  Taxper : Decimal(12, 2);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Value'
  @sap.quickinfo : 'Condition Value'
  Taxval : Decimal(15, 3);
  Rate : Decimal(12, 2);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  Iamount : Decimal(12, 2);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  Total : Decimal(12, 2);
  Kposn : String(5);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  waers : String(5);
  Status : String(9);
  to_esll : Association to many ZP_MM_POHEAD_BND.ZC_MM_ESLL {  };
  to_esll2 : Association to many ZP_MM_POHEAD_BND.ZC_MM_ESLL {  };
  to_pohead : Association to ZP_MM_POHEAD_BND.ZP_MM_POHEAD {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
entity ZP_MM_POHEAD_BND.SAP__Currencies {
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
entity ZP_MM_POHEAD_BND.SAP__UnitsOfMeasure {
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

@cds.external : true
type ZP_MM_POHEAD_BND.DummyFunctionImportResult {
  @sap.label : 'TRUE'
  IsInvalid : Boolean;
};

