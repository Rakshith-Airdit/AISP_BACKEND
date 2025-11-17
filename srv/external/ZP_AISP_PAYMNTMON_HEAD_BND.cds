/* checksum : 5ffc9c3398a03f9516d4159aee8fece8 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZP_AISP_PAYMNTMON_HEAD_BND {};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.content.version : '1'
@sap.label : 'Projection View for payment monitoring header'
entity ZP_AISP_PAYMNTMON_HEAD_BND.ZP_AISP_PAYMENTMON_HEAD {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Document Number'
  @sap.quickinfo : 'Document Number of an Accounting Document'
  key Belnr : String(10) not null;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  key Ebeln : String(10) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Fiscal Year'
  Gjahr : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Company Code'
  Bukrs : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Document Number'
  @sap.quickinfo : 'Document Number of an Accounting Document'
  Bkpfbelnr : String(10);
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
  @sap.label : 'Reference'
  @sap.quickinfo : 'Reference Document Number'
  Xblnr : String(16);
  @sap.display.format : 'Date'
  @sap.label : 'Posting Date'
  @sap.quickinfo : 'Posting Date in the Document'
  Budat : Date;
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Gross Invoice Amount'
  @sap.quickinfo : 'Gross Invoice Amount in Document Currency'
  Invoiceamt : Decimal(13, 3);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Deletion Indicator'
  @sap.quickinfo : 'Deletion Indicator in Purchasing Document'
  Loekz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Status'
  @sap.quickinfo : 'Status of Purchasing Document'
  Statu : String(1);
  @sap.display.format : 'Date'
  @sap.label : 'Clearing Date'
  augdt : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Clearing Document'
  @sap.quickinfo : 'Document Number of the Clearing Document'
  augbl : String(10);
  Paymentstatus : String(15);
  Downpymntstatus : String(6);
  @sap.display.format : 'Date'
  @sap.label : 'Created On'
  @sap.quickinfo : 'Creation Date of Purchasing Document'
  Aedat : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Created By'
  @sap.quickinfo : 'User of person who created a purchasing document'
  Ernam : String(12);
  @odata.Type : 'Edm.DateTimeOffset'
  @odata.Precision : 7
  @sap.label : 'Last Changed'
  @sap.quickinfo : 'Change Time Stamp'
  Lastchangedatetime : Timestamp;
  Invy : String(14);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Item Number Interval'
  Pincr : String(5);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Down Payment Amount'
  @sap.quickinfo : 'Down Payment Amount in Document Currency'
  Dpamt : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Amount'
  @sap.quickinfo : 'Amount in document currency'
  Wrbtr : Decimal(13, 3);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Last Item'
  @sap.quickinfo : 'Last Item Number'
  Lponr : String(5);
  Invoicepayee : String(65);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Supplier'
  @sap.quickinfo : 'Vendor''s account number'
  Lifnr : String(10);
  @sap.label : 'Name'
  @sap.quickinfo : 'Name 1'
  name1 : String(35);
  @sap.label : 'E-Mail Address'
  Email : String(241);
  Paymentrecpnt : String(86);
  @sap.label : 'Language Key'
  Spras : String(2);
  POtype : String(8);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  Waers : String(5);
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
entity ZP_AISP_PAYMNTMON_HEAD_BND.SAP__Currencies {
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
entity ZP_AISP_PAYMNTMON_HEAD_BND.SAP__UnitsOfMeasure {
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

