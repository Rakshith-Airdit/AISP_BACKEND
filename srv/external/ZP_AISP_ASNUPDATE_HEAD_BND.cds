/* checksum : 5a1b29dbdda8e2c11bb7018e58607a46 */
@cds.external               : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported: 'true'
@sap.supported.formats      : 'atom json xlsx'
service ZP_AISP_ASNUPDATE_HEAD_BND {};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
@sap.deletable.path  : 'Delete_mc'
@sap.updatable.path  : 'Update_mc'
@sap.label           : 'Projection View for ASN Update'
entity ZP_AISP_ASNUPDATE_HEAD_BND.ZP_AISP_ASNUPDATE_HEAD {
      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purchasing Document'
      @sap.quickinfo     : 'Purchasing Document Number'
      ASNamount        : Decimal(13, 3);
  key Ebeln            : String(10) not null;
  GRNStatus:String;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'ASN Number'
  key vbeln            : String(10) not null;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'

      Delete_mc        : Boolean;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Update_mc        : Boolean;

      @sap.label         : 'Dynamic CbA-Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      to_asnupditem_oc : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Created By'
      @sap.quickinfo     : 'User of person who created a purchasing document'
      Ernam            : String(12);
      Lifnr            : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purch. organization'
      @sap.quickinfo     : 'Purchasing organization'
      Ekorg            : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purchasing Group'
      Ekgrp            : String(3);

      @sap.label         : 'Currency'
      @sap.quickinfo     : 'Currency Key'
      @sap.semantics     : 'currency-code'
      Waers            : String(5);

      @sap.display.format: 'Date'
      @sap.label         : 'Document Date'
      @sap.quickinfo     : 'Purchasing Document Date'
      Bedat            : String;

      @sap.label         : 'Name'
      @sap.quickinfo     : 'Name 1'
      name1            : String(35);

      @sap.label         : 'Street'
      @sap.quickinfo     : 'Street and House Number'
      stras            : String(35);

      @sap.label         : 'City'
      ort01            : String(35);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Postal Code'
      pstlz            : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Plant'
      werks            : String(4);

      @sap.label         : 'Name 1'
      @sap.quickinfo     : 'Name'
      Plantname        : String(30);
      Ship1            : String(74);
      Shipfrom         : String(84);
      Ship2            : String(91);
      Ship3            : String(59);
      Shipto           : String(101);
      Status           : String(15);
      to_asnupditem    : Composition of many ZP_AISP_ASNUPDATE_HEAD_BND.ZP_AISP_ASNUPDATE_ITEM {};
};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
@sap.deletable.path  : 'Delete_mc'
@sap.updatable.path  : 'Update_mc'
@sap.label           : 'Projection View for ASN Update Item'
entity ZP_AISP_ASNUPDATE_HEAD_BND.ZP_AISP_ASNUPDATE_ITEM {
      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purchasing Document'
      @sap.quickinfo     : 'Purchasing Document Number'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
  key Ebeln            : String(10) not null;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'ASN Number'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
  key Vbeln            : String(10) not null;

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Item'
      @sap.quickinfo     : 'Item Number of Purchasing Document'
  key Ebelp            : String(5) not null;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Delete_mc        : Boolean;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Update_mc        : Boolean;
      Type             : String(8);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Material'
      @sap.quickinfo     : 'Material Number'
      matnr            : String(18);

      @sap.label         : 'Short Text'
      txz01            : String(40);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Item'
      @sap.quickinfo     : 'Delivery Item'
      posnr            : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Confirm. Category'
      @sap.quickinfo     : 'Confirmation Category'
      Ebtyp            : String(2);

      @sap.display.format: 'Date'
      @sap.label         : 'Delivery Date'
      @sap.quickinfo     : 'Delivery Date of Supplier Confirmation'
      Deliverydate     : String;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Deliv. Date Category'
      @sap.quickinfo     : 'Date Category of Delivery Date in Supplier Confirmation'
      Lpein            : String(1);

      @sap.label         : 'Time'
      @sap.quickinfo     : 'Delivery Date Time-Spot in Supplier Confirmation'
      Uzeit            : Time;

      @sap.label         : 'Creation Time'
      @sap.quickinfo     : 'Time at Which Suppluer Confirmation was Created'
      Ezeit            : Time;

      @sap.unit          : 'meins'
      @sap.label         : 'Order Quantity'
      @sap.quickinfo     : 'Purchase Order Quantity'
      POquantity       : Decimal(13, 3);

      @sap.unit          : 'meins'
      @sap.label         : 'Quantity'
      @sap.quickinfo     : 'Quantity as Per Supplier Confirmation'
      Menge            : Decimal(13, 3);
      Amount           : Decimal(12, 2);
      Taxper           : Decimal(12, 2);

      @sap.unit          : 'Waers'
      @sap.variable.scale: 'true'
      @sap.label         : 'Value'
      @sap.quickinfo     : 'Condition Value'
      Taxval           : Decimal(15, 3);
      Rate             : Decimal(12, 2);
      Discount         : Decimal(12, 2);
      Total            : Decimal(12, 2);

      @sap.unit          : 'meins'
      @sap.label         : 'Qty Reduced (MRP)'
      @sap.quickinfo     : 'Quantity Reduced (MRP)'
      Dabmg            : Decimal(13, 3);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Goods Movement Sts'
      @sap.quickinfo     : 'Goods Movement Status (Item)'
      wbsta            : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Creation indicator'
      @sap.quickinfo     : 'Creation Indicator: Supplier Confirmation'
      Estkz            : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'MRP-Relevant'
      @sap.quickinfo     : 'Indicator: Confirmation is Relevant to Materials Planning'
      Kzdis            : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Reference'
      @sap.quickinfo     : 'Reference Document Number (for Dependencies see Long Text)'
      Xblnr            : String(35);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Item'
      @sap.quickinfo     : 'Delivery Item'
      Vbelp            : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Mfr part profile'
      Mprof            : String(4);

      @sap.label         : 'Base Unit of Measure'
      @sap.semantics     : 'unit-of-measure'
      meins            : String(3);

      @sap.label         : 'No. Rem./Expediters'
      @sap.quickinfo     : 'Number of Reminders/Expediters'
      Mahnz            : Decimal(3, 0);

      @sap.label         : 'Currency'
      @sap.quickinfo     : 'Currency Key'
      @sap.semantics     : 'currency-code'
      Waers            : String(5);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Batch'
      @sap.quickinfo     : 'Batch Number'
      Charg            : String(10);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'HigherLevelItemBatch'
      @sap.quickinfo     : 'Higher-Level Item of Batch Split Item'
      Uecha            : String(6);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Sequential Number'
      @sap.quickinfo     : 'Sequential Number of Supplier Confirmation'
      RefEtens         : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'In Plant'
      @sap.quickinfo     : 'Delivery has Status ''In Plant'''
      Imwrk            : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Delivery'
      VbelnSt          : String(10);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Item'
      @sap.quickinfo     : 'Delivery Item'
      VbelpSt          : String(6);

      @sap.display.format: 'Date'
      @sap.label         : 'Handover Date'
      @sap.quickinfo     : 'Handover Date at the Handover Location'
      Handoverdate     : Date;

      @sap.label         : 'Handover Time'
      @sap.quickinfo     : 'Handover time at the handover location'
      Handovertime     : Time;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Stock Segment'
      SgtScat          : String(40);

      @odata.Type        : 'Edm.DateTimeOffset'
      @odata.Precision   : 7
      @sap.label         : 'UTC Timestamp'
      Msgtstmp         : Timestamp;

      @sap.unit          : 'meins'
      @sap.label         : 'CW POQTY'
      @sap.quickinfo     : 'Quantity of Order Confirmation in Base/Parallel UoM'
      xcwmxmenge       : Decimal(13, 3);

      @sap.unit          : 'meins'
      @sap.label         : 'CW MRP Reduced Qty'
      @sap.quickinfo     : 'MRP Reduced Quantity in Base/Parallel UoM'
      xcwmxdabmg       : Decimal(13, 3);

      @sap.display.format: 'Date'
      @sap.label         : 'Start Date'
      @sap.quickinfo     : 'Start Date for Period of Performance'
      Startdate        : Date;

      @sap.display.format: 'Date'
      @sap.label         : 'End Date'
      @sap.quickinfo     : 'End Date for Period of Performance'
      Enddate          : Date;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Service Performer'
      Serviceperformer : String(10);

      @sap.unit          : 'Waers'
      @sap.variable.scale: 'true'
      @sap.label         : 'Expected Value'
      @sap.quickinfo     : 'Expected Value of Overall Limit'
      ExpectedValue    : Decimal(13, 3);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Confirmation'
      @sap.quickinfo     : 'Supplier Confirmation Number'
      SupplierConfNo   : String(10);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Confirmation Item'
      @sap.quickinfo     : 'Supplier Confirmation Item'
      SupplierConfItem : String(5);

      @sap.display.format: 'Date'
      @sap.label         : 'Data Aging'
      @sap.quickinfo     : 'Data Filter Value for Data Aging'
      Dataaging        : Date;

      @sap.unit          : 'meins'
      @sap.label         : 'Allocated Stock'
      @sap.quickinfo     : 'Allocated Stock Quantity'
      FshSallocQty     : Decimal(13, 3);

      @sap.unit          : 'meins'
      @sap.label         : 'Original Quantity'
      @sap.quickinfo     : 'Original Quantity of Shipping Notification/Inbound Delivery'
      Ormng            : Decimal(13, 3);

      @sap.label         : 'GUID of SAP TM'
      @sap.quickinfo     : 'Reference UUID of Transportation Management'
      TmsRefUuid       : UUID;
      to_asnupdhead    : Association to ZP_AISP_ASNUPDATE_HEAD_BND.ZP_AISP_ASNUPDATE_HEAD {};
};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
entity ZP_AISP_ASNUPDATE_HEAD_BND.SAP__Currencies {
      @sap.label    : 'Currency'
      @sap.semantics: 'currency-code'
  key CurrencyCode  : String(5) not null;

      @sap.label    : 'ISO code'
      ISOCode       : String(3) not null;

      @sap.label    : 'Short text'
      Text          : String(15) not null;

      @odata.Type   : 'Edm.Byte'
      @sap.label    : 'Decimals'
      DecimalPlaces : Integer not null;
};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
entity ZP_AISP_ASNUPDATE_HEAD_BND.SAP__UnitsOfMeasure {
      @sap.label    : 'Internal UoM'
      @sap.semantics: 'unit-of-measure'
  key UnitCode      : String(3) not null;

      @sap.label    : 'ISO code'
      ISOCode       : String(3) not null;

      @sap.label    : 'Commercial'
      ExternalCode  : String(3) not null;

      @sap.label    : 'Measurement Unit Txt'
      Text          : String(30) not null;

      @sap.label    : 'Decimal Places'
      DecimalPlaces : Integer;
};
