/* checksum : aba42979aaf55707c9bb85dc799c58e1 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZP_AISP_SES_UPSES_SRB {};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.content.version : '1'
@sap.label : 'Services Value Help'
entity ZP_AISP_SES_UPSES_SRB.ZI_AISP_ServicesVH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Activity number'
  @sap.quickinfo : 'Activity Number'
  key ServiceNumber : String(18) not null;
  @sap.label : 'Base Unit of Measure'
  @sap.semantics : 'unit-of-measure'
  UnitOfMesure : String(3);
  @sap.label : 'Service Short Text'
  ServiceText : String(40);
  @sap.label : 'Language Key'
  LanguageKey : String(2);
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection View for Service Entry sheet Details'
entity ZP_AISP_SES_UPSES_SRB.ZP_AISP_SES_HDR {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  key Ebeln : String(10) not null;
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
  to_sesitems_oc : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Company Code'
  Bukrs : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purch. Doc. Category'
  @sap.quickinfo : 'Purchasing Document Category'
  Bstyp : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Doc. Type'
  @sap.quickinfo : 'Purchasing Document Type'
  Bsart : String(4);
  @sap.display.format : 'Date'
  @sap.label : 'Created On'
  @sap.quickinfo : 'Creation Date of Purchasing Document'
  Aedat : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Document Date'
  @sap.quickinfo : 'Purchasing Document Date'
  bedat : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Created By'
  @sap.quickinfo : 'User of person who created a purchasing document'
  Ernam : String(12);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Supplier'
  @sap.quickinfo : 'Vendor''s account number'
  Lifnr : String(10);
  @sap.label : 'E-Mail Address'
  Email : String(241);
  @sap.label : 'Name'
  @sap.quickinfo : 'Name 1'
  LIFNR_NAME : String(35);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purch. organization'
  @sap.quickinfo : 'Purchasing organization'
  Ekorg : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Group'
  Ekgrp : String(3);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  Waers : String(5);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  Amount : Decimal(13, 3);
  HeaderStaus : String(9);
  ServicePOType : String(10);
  person_res_intr : String(12);
  person_res_extr : String(12);
  location : String(12);
  short_text : String(40);
  @sap.display.format : 'Date'
  @sap.label : 'Date'
  from_date : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Date'
  end_date : Date;
  FIN_ENTRY : String(1);
  to_sesitems : Composition of many ZP_AISP_SES_UPSES_SRB.ZP_AISP_SES_ITEM_DETAIL {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection view for Existing SES item Details'
entity ZP_AISP_SES_UPSES_SRB.ZP_AISP_SES_ITEM_DETAIL {
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
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package number'
  key packno : String(10) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Line'
  @sap.quickinfo : 'Line Number'
  key introw : String(10) not null;
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
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package number'
  packageNofromPO : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package'
  @sap.quickinfo : 'Subpackage number'
  sub_packno : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Line Number'
  extrow : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Activity number'
  @sap.quickinfo : 'Activity Number'
  srvpos : String(18);
  @sap.unit : 'meins'
  @sap.label : 'Quantity'
  @sap.quickinfo : 'Quantity with Sign'
  menge : Decimal(13, 3);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  waers : String(5);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Gross Price'
  tbtwr : Decimal(11, 3);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Net Value'
  @sap.quickinfo : 'Net Value of Item'
  netwr : Decimal(11, 3);
  @sap.label : 'Base Unit of Measure'
  @sap.semantics : 'unit-of-measure'
  meins : String(3);
  @sap.label : 'Short Text'
  ktext1 : String(40);
  @sap.unit : 'meins'
  @sap.label : 'Entered Quantity'
  @sap.quickinfo : 'Purchase Order: Entered Quantity'
  act_menge : Decimal(13, 3);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Boolean Variable (X = True, - = False, Space = Unknown)'
  @sap.heading : ''
  final_entry : Boolean;
  @sap.label : 'Name'
  @sap.quickinfo : 'Text, 40 Characters Long'
  shortText : String(40);
  @sap.label : 'PersRsp.Int.'
  @sap.quickinfo : 'Person Responsible (Internally)'
  sitePerson : String(12);
  @sap.label : 'PersRsp.Ext.'
  @sap.quickinfo : 'Person Responsible (Externally)'
  personresp : String(12);
  @sap.display.format : 'Date'
  @sap.label : 'Date'
  from_date : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Date'
  end_date : Date;
  SESLineItemStatus : String(9);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  TOTAL_ACTVALUE : Decimal(13, 3);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  TOTAL_SUMLIMIT : Decimal(13, 3);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  pending_limit : Decimal(14, 3);
  asktx : String(40);
  to_seshdr : Association to ZP_AISP_SES_UPSES_SRB.ZP_AISP_SES_HDR {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
entity ZP_AISP_SES_UPSES_SRB.SAP__Currencies {
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
entity ZP_AISP_SES_UPSES_SRB.SAP__UnitsOfMeasure {
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

