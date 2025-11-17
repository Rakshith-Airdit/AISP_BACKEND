/* checksum : b2654e95289710f39f5c5364a7ef72ba */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZP_AISP_POVIM_HEAD_BND {};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection View for PO based Invoice'
entity ZP_AISP_POVIM_HEAD_BND.ZP_AISP_POVIM_HEAD {
  @sap.display.format : 'UpperCase'
  Invoicenumber :String;
  // TotalAmount :String;
  // REQUEST_NO:Integer;
  // REJECTED_COMMENT:String;
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  key Ebeln : String(10) not null;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Delivery'
  key vbeln : String(10) not null;
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
  to_povimitm_oc : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Reference'
  @sap.quickinfo : 'Reference Document Number (for Dependencies see Long Text)'
  xblnr : String(35);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Material Document'
  @sap.quickinfo : 'Number of Material Document'
  mblnr : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Company Code'
  Bukrs : String(4);
  @sap.display.format : 'Date'
  @sap.label : 'Document Date'
  @sap.quickinfo : 'Purchasing Document Date'
  Bedat : DateTime;
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
  @sap.display.format : 'Date'
  @sap.label : 'Created On'
  @sap.quickinfo : 'Creation Date of Purchasing Document'
  Aedat : DateTime;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Created By'
  @sap.quickinfo : 'User of person who created a purchasing document'
  Ernam : String(12);
  @odata.Type : 'Edm.DateTimeOffset'
  @odata.Precision : 7
  @sap.label : 'Last Changed'
  @sap.quickinfo : 'Change Time Stamp'
  Lastchangedatetime : String;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Item Number Interval'
  Pincr : String(5);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Last Item'
  @sap.quickinfo : 'Last Item Number'
  Lponr : String(5);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Supplier'
  @sap.quickinfo : 'Vendor''s account number'
  Lifnr : String(10);
  ASNamount : Decimal(12, 2);
  @sap.display.format : 'Date'
  @sap.label : 'Creation Date'
  @sap.quickinfo : 'Creation Date of Confirmation'
  asndate : DateTime;
  Status : String(15);
  @sap.label : 'Name'
  @sap.quickinfo : 'Name 1'
  name1 : String(35);
  Vendoraddress : String(88);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Bank Key'
  @sap.quickinfo : 'Bank Keys'
  Bankkey : String(15);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Bank Account'
  @sap.quickinfo : 'Bank account number'
  Bankacc : String(18);
  @sap.label : 'Bank Name'
  @sap.quickinfo : 'Name of Financial Institution'
  Bankname : String(60);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Payment terms'
  @sap.quickinfo : 'Terms of payment key'
  Zterm : String(4);
  @sap.label : 'Payment in'
  @sap.quickinfo : 'Cash (Prompt Payment) Discount Days'
  Zbd1t : Decimal(3, 0);
  @sap.label : 'Payment in'
  @sap.quickinfo : 'Cash (Prompt Payment) Discount Days'
  Zbd2t : Decimal(3, 0);
  @sap.label : 'Payment in'
  @sap.quickinfo : 'Cash (Prompt Payment) Discount Days'
  Zbd3t : Decimal(3, 0);
  @sap.label : 'Disc.percent 1'
  @sap.quickinfo : 'Cash discount percentage 1'
  Zbd1p : Decimal(5, 3);
  @sap.label : 'Disc.percent 2'
  @sap.quickinfo : 'Cash Discount Percentage 2'
  Zbd2p : Decimal(5, 3);
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
  @sap.label : 'Fixed Exchange Rate'
  @sap.quickinfo : 'Indicator for Fixed Exchange Rate'
  Kufix : Boolean;
  @sap.display.format : 'Date'
  @sap.label : 'Validity Per. Start'
  @sap.quickinfo : 'Start of Validity Period'
  Kdatb : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Validity Period End'
  @sap.quickinfo : 'End of Validity Period'
  Kdate : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Application Close'
  @sap.quickinfo : 'Closing Date for Applications'
  Bwbdt : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Quotation Deadline'
  @sap.quickinfo : 'Deadline for Submission of Bid/Quotation'
  Angdt : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Binding Period'
  @sap.quickinfo : 'Binding Period for Quotation'
  Bnddt : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Warranty'
  @sap.quickinfo : 'Warranty Date'
  Gwldt : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Bid invitation'
  @sap.quickinfo : 'Bid invitation number'
  Ausnr : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Quotation'
  @sap.quickinfo : 'Quotation Number'
  Angnr : String(10);
  @sap.display.format : 'Date'
  @sap.label : 'Quotation Date'
  @sap.quickinfo : 'Quotation Submission Date'
  Ihran : Date;
  @sap.label : 'Your Reference'
  Ihrez : String(12);
  @sap.label : 'Salesperson'
  @sap.quickinfo : 'Responsible Salesperson at Supplier''s Office'
  Verkf : String(30);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Goods Supplier'
  Llief : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Customer'
  @sap.quickinfo : 'Customer Number'
  Kunnr : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Active Purchase Doc'
  @sap.quickinfo : 'Active Purchasing Document'
  ActiveId : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Outline agreement'
  @sap.quickinfo : 'Number of principal purchase agreement'
  Konnr : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Field Not Used'
  @sap.heading : ''
  Abgru : String(2);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Complete Delivery'
  @sap.quickinfo : 'Complete Delivery Stipulated for Each Purchase Order'
  Autlf : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'GR Message'
  @sap.quickinfo : 'Indicator: Goods Receipt Message'
  Weakt : Boolean;
  to_povimitm : Composition of many ZP_AISP_POVIM_HEAD_BND.ZP_AISP_POVIM_ITEM {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection View for PO based Inv Item'
entity ZP_AISP_POVIM_HEAD_BND.ZP_AISP_POVIM_ITEM {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  key Ebeln : String(10) not null;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Delivery'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  key Vbeln : String(10) not null;
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
  txz01 : String(40);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Confirm. Category'
  @sap.quickinfo : 'Confirmation Category'
  Ebtyp : String(2);
  @sap.display.format : 'Date'
  @sap.label : 'Delivery Date'
  @sap.quickinfo : 'Delivery Date of Supplier Confirmation'
  Eindt : String;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Deliv. Date Category'
  @sap.quickinfo : 'Date Category of Delivery Date in Supplier Confirmation'
  Lpein : String(1);
  @sap.display.format : 'Date'
  @sap.label : 'Creation Date'
  @sap.quickinfo : 'Creation Date of Confirmation'
  Erdat : String;
  @sap.label : 'Creation Time'
  @sap.quickinfo : 'Time at Which Suppluer Confirmation was Created'
  Ezeit : Time;
  @sap.unit : 'meins'
  @sap.label : 'Quantity'
  menge : Decimal(13, 3);
  @sap.unit : 'meins'
  @sap.label : 'Delivery Quantity'
  @sap.quickinfo : 'Original Quantity of Delivery Item'
  Asnqty : Decimal(13, 3);
  ASNitamount : Decimal(12, 2);
  GRNitamount : Decimal(12, 2);
  Taxper : Decimal(12, 2);
  @sap.unit : 'waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Value'
  @sap.quickinfo : 'Condition Value'
  Taxval : Decimal(15, 3);
  Total : Decimal(12, 2);
  @sap.label : 'Base Unit of Measure'
  @sap.semantics : 'unit-of-measure'
  meins : String(3);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  waers : String(5);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Creation indicator'
  @sap.quickinfo : 'Creation Indicator: Supplier Confirmation'
  Estkz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Deletion Indicator'
  @sap.quickinfo : 'Supplier Confirmation Deletion Indicator'
  Loekz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'MRP-Relevant'
  @sap.quickinfo : 'Indicator: Confirmation is Relevant to Materials Planning'
  Kzdis : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Reference'
  @sap.quickinfo : 'Reference Document Number (for Dependencies see Long Text)'
  Xblnr : String(35);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Item'
  @sap.quickinfo : 'Delivery Item'
  Vbelp : String(6);
  Status : String(15);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Mfr part profile'
  Mprof : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'MPN material'
  @sap.quickinfo : 'Material number corresponding to manufacturer part number'
  Ematn : String(18);
  @sap.label : 'No. Rem./Expediters'
  @sap.quickinfo : 'Number of Reminders/Expediters'
  Mahnz : Decimal(3, 0);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Batch'
  @sap.quickinfo : 'Batch Number'
  Charg : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'HigherLevelItemBatch'
  @sap.quickinfo : 'Higher-Level Item of Batch Split Item'
  Uecha : String(6);
  Invoicerefno : String(25);
  @sap.display.format : 'Date'
  Invoicedate : Date;
  to_povimhd : Association to ZP_AISP_POVIM_HEAD_BND.ZP_AISP_POVIM_HEAD {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
entity ZP_AISP_POVIM_HEAD_BND.SAP__Currencies {
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
entity ZP_AISP_POVIM_HEAD_BND.SAP__UnitsOfMeasure {
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

