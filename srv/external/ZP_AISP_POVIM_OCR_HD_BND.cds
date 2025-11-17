/* checksum : e691b13a0226bc6f4d702c5b520071be */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZP_AISP_POVIM_OCR_HD_BND {};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.content.version : '1'
@sap.label : 'Projection view for PO based VIM with OCR Header'
entity ZP_AISP_POVIM_OCR_HD_BND.ZP_AISP_POVIM_OCR_HD {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  key Ebeln : String(10) not null;
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
  @sap.display.format : 'UpperCase'
  @sap.label : 'Control indicator'
  @sap.quickinfo : 'Control indicator for purchasing document type'
  Bsakz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Deletion Indicator'
  @sap.quickinfo : 'Deletion Indicator in Purchasing Document'
  Loekz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Status'
  @sap.quickinfo : 'Status of Purchasing Document'
  Statu : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Supplier'
  @sap.quickinfo : 'Vendor''s account number'
  Lifnr : String(10);
  @sap.label : 'E-Mail Address'
  Email : String(241);
  Ship1 : String(72);
  Ship2 : String(75);
  Vendoraddress : String(86);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Bank Key'
  @sap.quickinfo : 'Bank Keys'
  bank_key : String(15);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Bank Account'
  @sap.quickinfo : 'Bank account number'
  bank_acc : String(18);
  @sap.label : 'Bank Name'
  @sap.quickinfo : 'Name of Financial Institution'
  bank_name : String(60);
  @sap.label : 'Language Key'
  Spras : String(2);
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
  @sap.display.format : 'UpperCase'
  @sap.label : 'Down Payment'
  @sap.quickinfo : 'Down Payment Indicator'
  Dptyp : String(4);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Down Payment Amount'
  @sap.quickinfo : 'Down Payment Amount in Document Currency'
  Dpamt : Decimal(11, 3);
  @sap.label : 'Down Payment %'
  @sap.quickinfo : 'Down Payment Percentage'
  Dppct : Decimal(5, 2);
  @sap.display.format : 'Date'
  @sap.label : 'Due Date for DP'
  @sap.quickinfo : 'Due Date for Down Payment'
  Dpdat : Date;
  to_ocritem : Composition of many ZP_AISP_POVIM_OCR_HD_BND.ZP_AISP_POVIM_OCR_itm {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.content.version : '1'
@sap.label : 'Projection view for PO based VIM with OCR Item'
entity ZP_AISP_POVIM_OCR_HD_BND.ZP_AISP_POVIM_OCR_itm {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  key Ebeln : String(10) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Item'
  @sap.quickinfo : 'Item Number of Purchasing Document'
  key Ebelp : String(5) not null;
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  Waers : String(5);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Deletion Indicator'
  @sap.quickinfo : 'Deletion Indicator in Purchasing Document'
  Loekz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Doc. Condition No.'
  @sap.quickinfo : 'Number of the Document Condition'
  Knumv : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Origin'
  @sap.quickinfo : 'Origin of a Purchasing Document Item'
  Statu : String(1);
  @sap.display.format : 'Date'
  @sap.label : 'Last Changed on'
  @sap.quickinfo : 'Purchasing Document Item Change Date'
  Aedat : Date;
  @sap.label : 'Short Text'
  Txz01 : String(40);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Material'
  @sap.quickinfo : 'Material Number'
  Matnr : String(18);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Company Code'
  Bukrs : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Plant'
  Werks : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Storage location'
  Lgort : String(4);
  UnitPrice : Decimal(12, 2);
  @sap.unit : 'Meins'
  @sap.label : 'Target Quantity'
  Ktmng : Decimal(13, 3);
  @sap.unit : 'Meins'
  @sap.label : 'Order Quantity'
  @sap.quickinfo : 'Purchase Order Quantity'
  Menge : Decimal(13, 3);
  @sap.label : 'Order Unit'
  @sap.quickinfo : 'Purchase Order Unit of Measure'
  @sap.semantics : 'unit-of-measure'
  Meins : String(3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Net Order Price'
  @sap.quickinfo : 'Net Price in Purchasing Document (in Document Currency)'
  Netpr : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Net Order Value'
  @sap.quickinfo : 'Net Order Value in PO Currency'
  Netwr : Decimal(13, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Gross order value'
  @sap.quickinfo : 'Gross order value in PO currency'
  Brtwr : Decimal(13, 3);
  @sap.label : 'Amount'
  @sap.quickinfo : 'Condition Amount or Percentage'
  Kbetr : Decimal(24, 9);
  @sap.unit : 'Meins'
  @sap.label : 'Quantity'
  GRN_QTY : Decimal(13, 3);
  TOTAL_AMT : Decimal(12, 2);
  to_ocrheader : Association to ZP_AISP_POVIM_OCR_HD_BND.ZP_AISP_POVIM_OCR_HD {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
entity ZP_AISP_POVIM_OCR_HD_BND.SAP__Currencies {
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
entity ZP_AISP_POVIM_OCR_HD_BND.SAP__UnitsOfMeasure {
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

