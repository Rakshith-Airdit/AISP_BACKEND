/* checksum : 3edc10ba3cb95963b8e52c59e9e1efeb */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZP_AISP_NPOVIM_HEAD_BND {};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection View for non PO based Invoice'
entity ZP_AISP_NPOVIM_HEAD_BND.ZP_AISP_NPOVIM_HEAD {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Company Code'
  key Bukrs : String(4) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Fiscal Year'
  key Gjahr : String(4) not null;
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
  to_npovimitem_oc : Boolean;
  Invoiceno : String(25);
  Totalamt : Decimal(12, 2);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Document Type'
  Blart : String(2);
  @sap.display.format : 'Date'
  @sap.label : 'Document Date'
  @sap.quickinfo : 'Document Date in Document'
  Bldat : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Posting Date'
  @sap.quickinfo : 'Posting Date in the Document'
  Budat : Date;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Posting period'
  @sap.quickinfo : 'Fiscal period'
  Monat : String(2);
  @sap.display.format : 'Date'
  @sap.label : 'Entry Date'
  @sap.quickinfo : 'Day On Which Accounting Document Was Entered'
  Cpudt : Date;
  @sap.label : 'Time of Entry'
  Cputm : Time;
  @sap.display.format : 'Date'
  @sap.label : 'Changed On'
  @sap.quickinfo : 'Date of the Last Document Change by Transaction'
  Aedat : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Last Update'
  @sap.quickinfo : 'Date of the Last Document Update'
  Upddt : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Translation date'
  Wwert : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'User Name'
  Usnam : String(12);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Transaction Code'
  Tcode : String(20);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Cross-Comp.Code No.'
  @sap.quickinfo : 'Number of Cross-Company Code Posting Transaction'
  Bvorg : String(16);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Reference'
  @sap.quickinfo : 'Reference Document Number'
  Xblnr : String(16);
  to_npovimitem : Composition of many ZP_AISP_NPOVIM_HEAD_BND.ZP_AISP_NPOVIM_ITEM {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection View for non PO basedInvceItm'
entity ZP_AISP_NPOVIM_HEAD_BND.ZP_AISP_NPOVIM_ITEM {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Company Code'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  key Bukrs : String(4) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Fiscal Year'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  key Gjahr : String(4) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Item'
  @sap.quickinfo : 'Number of Line Item Within Accounting Document'
  key Buzei : String(3) not null;
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
  @sap.display.format : 'UpperCase'
  @sap.label : 'Line Item ID'
  @sap.quickinfo : 'Identification of the Line Item'
  Buzid : String(1);
  @sap.display.format : 'Date'
  @sap.label : 'Clearing Date'
  Augdt : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Clearing Entry Date'
  Augcp : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Clearing Document'
  @sap.quickinfo : 'Document Number of the Clearing Document'
  Augbl : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Posting Key'
  Bschl : String(2);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Account type'
  Koart : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Special G/L Ind.'
  @sap.quickinfo : 'Special G/L Indicator'
  Umskz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Sp. G/L Trans.Type'
  @sap.quickinfo : 'Special G/L Transaction Type'
  Umsks : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Target Sp.G/L Ind.'
  @sap.quickinfo : 'Target Special G/L Indicator'
  Zumsk : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Debit/Credit ind'
  @sap.quickinfo : 'Debit/Credit Indicator'
  Shkzg : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Cost Center'
  Kostl : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Supplier'
  @sap.quickinfo : 'Account Number of Supplier'
  Lifnr : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'G/L Account'
  @sap.quickinfo : 'G/L Account Number'
  Saknr : String(10);
  Material : String(40);
  @sap.unit : 'Meins'
  @sap.label : 'Quantity'
  @sap.quickinfo : 'Quantity as Per Supplier Confirmation'
  Quantity : Decimal(13, 3);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Business Area'
  Gsber : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Trading Part.BA'
  @sap.quickinfo : 'Trading partner''s business area'
  Pargb : String(4);
  @sap.label : 'Base Unit of Measure'
  @sap.semantics : 'unit-of-measure'
  Meins : String(3);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Tax Ctry/Reg.'
  @sap.quickinfo : 'Tax Reporting Country/Region'
  TaxCountry : String(3);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Tax Code'
  @sap.quickinfo : 'Tax on sales/purchases code'
  Mwskz : String(2);
  @sap.display.format : 'Date'
  @sap.label : 'Tax Rate Valid-From'
  @sap.quickinfo : 'Valid-From Date of the Tax Rate'
  TxdatFrom : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Withholding Tax Code'
  Qsskz : String(2);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Amt.in loc.cur.'
  @sap.quickinfo : 'Amount in local currency'
  Dmbtr : Decimal(13, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Amount'
  @sap.quickinfo : 'Amount in document currency'
  Wrbtr : Decimal(13, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Amount in FunctCrcy'
  @sap.quickinfo : 'Amount in Functional Currency'
  Fcsl : Decimal(23, 3);
  @sap.label : 'Functional Currency'
  @sap.semantics : 'currency-code'
  Rfccur : String(5);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Orig.Reduction Amt'
  @sap.quickinfo : 'Original Reduction Amount in Local Currency'
  Kzbtr : Decimal(13, 3);
  @sap.label : 'G/L Currency'
  @sap.quickinfo : 'Update Currency for General Ledger Transaction Figures'
  @sap.semantics : 'currency-code'
  Pswsl : String(5);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  Waers : String(5);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Transaction'
  @sap.quickinfo : 'Transaction Key'
  Ktosl : String(3);
  to_npovimhead : Association to ZP_AISP_NPOVIM_HEAD_BND.ZP_AISP_NPOVIM_HEAD {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
entity ZP_AISP_NPOVIM_HEAD_BND.SAP__Currencies {
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
entity ZP_AISP_NPOVIM_HEAD_BND.SAP__UnitsOfMeasure {
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

