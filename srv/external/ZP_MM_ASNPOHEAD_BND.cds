/* checksum : da7e7530b47365bd83517131d40da824 */
@cds.external               : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported: 'true'
@sap.supported.formats      : 'atom json xlsx'
service ZP_MM_ASNPOHEAD_BND {};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
@sap.deletable.path  : 'Delete_mc'
@sap.updatable.path  : 'Update_mc'
@sap.label           : 'Projection View for ASN header'
entity ZP_MM_ASNPOHEAD_BND.ZP_MM_ASNPOHEAD {
      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purchasing Document'
      @sap.quickinfo     : 'Purchasing Document Number'
  key Ebeln           : String(10) not null;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Amount          : Decimal(13, 3);
      Delete_mc       : Boolean;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Update_mc       : Boolean;

      @sap.label         : 'Dynamic CbA-Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      to_poasnitem_oc : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Created By'
      @sap.quickinfo     : 'User of person who created a purchasing document'
      Ernam           : String(12);
      Lifnr           : String(10);

      @sap.label         : 'Name'
      @sap.quickinfo     : 'Name 1'
      name1           : String(35);

      @sap.label         : 'Street'
      @sap.quickinfo     : 'Street and House Number'
      stras           : String(35);

      @sap.label         : 'City'
      ort01           : String(35);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Postal Code'
      pstlz           : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Plant'
      werks           : String(4);

      @sap.label         : 'Name 1'
      @sap.quickinfo     : 'Name'
      Plantname       : String(30);
      Ship1           : String(74);
      Shipfrom        : String(84);
      Ship2           : String(91);
      Ship3           : String(59);
      Shipto          : String(101);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purch. organization'
      @sap.quickinfo     : 'Purchasing organization'
      Ekorg           : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purchasing Group'
      Ekgrp           : String(3);

      @sap.label         : 'Currency'
      @sap.quickinfo     : 'Currency Key'
      @sap.semantics     : 'currency-code'
      Waers           : String(5);

      @sap.display.format: 'Date'
      @sap.label         : 'Document Date'
      @sap.quickinfo     : 'Purchasing Document Date'
      Bedat           : String;
      Status          : String(18);
      to_poasnitem    : Composition of many ZP_MM_ASNPOHEAD_BND.ZP_MM_ASNPOITEM {};
};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
@sap.deletable.path  : 'Delete_mc'
@sap.updatable.path  : 'Update_mc'
@sap.label           : 'Projection View for ASN Item'
entity ZP_MM_ASNPOHEAD_BND.ZP_MM_ASNPOITEM {
      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purchasing Document'
      @sap.quickinfo     : 'Purchasing Document Number'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
  key Ebeln             : String(10) not null;

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Item'
      @sap.quickinfo     : 'Item Number of Purchasing Document'
      Discount          : Decimal(13, 3);
  key Ebelp             : String(5) not null;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Delete_mc         : Boolean;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Update_mc         : Boolean;

      @sap.label         : 'Dynamic CbA-Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      to_shipheaddet_oc : Boolean;

      @sap.label         : 'Short Text'
      Txz01             : String(40);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Material'
      @sap.quickinfo     : 'Material Number'
      Matnr             : String(18);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Plant'
      Werks             : String(4);

      @sap.label         : 'Order Quantity'
      @sap.quickinfo     : 'Purchase Order Quantity'
      Menge             : Decimal(13, 3);

      @sap.unit          : 'Meins'
      Pendingqty        : Decimal(14, 3);

      @sap.unit          : 'Meins'
      Deliveryqty       : Decimal(14, 3);
      Taxper            : Decimal(12, 2);

      @sap.unit          : 'waers'
      @sap.variable.scale: 'true'
      @sap.label         : 'Value'
      @sap.quickinfo     : 'Condition Value'
      Taxval            : Decimal(15, 3);
      Rate              : Decimal(12, 2);
      Total             : Decimal(12, 2);

      @sap.label         : 'Order Unit'
      @sap.quickinfo     : 'Purchase Order Unit of Measure'
      @sap.semantics     : 'unit-of-measure'
      Meins             : String(3);

      @sap.label         : 'Net Order Price'
      @sap.quickinfo     : 'Net Price in Purchasing Document (in Document Currency)'
      Netpr             : Decimal(12, 3);

      @sap.label         : 'Net Order Value'
      @sap.quickinfo     : 'Net Order Value in PO Currency'
      Netwr             : Decimal(14, 3);

      @sap.label         : 'Currency'
      @sap.quickinfo     : 'Currency Key'
      @sap.semantics     : 'currency-code'
      waers             : String(5);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Storage location'
      Lgort             : String(4);
      Status            : String(9);
      Asnstatus         : String(19);
      to_poasnhead      : Association to ZP_MM_ASNPOHEAD_BND.ZP_MM_ASNPOHEAD {};
      to_shipheaddet    : Composition of many ZP_MM_ASNPOHEAD_BND.ZP_MM_SHIPHEAD {};
};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
@sap.deletable.path  : 'Delete_mc'
@sap.updatable.path  : 'Update_mc'
@sap.label           : 'Projection View for Shipment Details'
entity ZP_MM_ASNPOHEAD_BND.ZP_MM_SHIPHEAD {
      @sap.display.format: 'UpperCase'
      @sap.label         : 'ASN No'
  key Vbeln                  : String(10) not null;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Purchasing Document'
      @sap.quickinfo     : 'Purchasing Document Number'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
  key ebeln                  : String(10) not null;

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Item'
      @sap.quickinfo     : 'Item Number of Purchasing Document'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
  key ebelp                  : String(5) not null;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Delete_mc              : Boolean;

      @sap.label         : 'Dyn. Method Control'
      @sap.creatable     : 'false'
      @sap.updatable     : 'false'
      @sap.sortable      : 'false'
      @sap.filterable    : 'false'
      Update_mc              : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Created By'
      @sap.quickinfo     : 'Name of Person Responsible for Creating the Object'
      Ernam                  : String(12);

      @sap.display.format: 'Date'
      @sap.label         : 'Pland Gds Mvmnt Date'
      @sap.quickinfo     : 'Planned Goods Movement Date'
      Wadat                  : Date;

      @sap.display.format: 'Date'
      @sap.label         : 'Transptn Plang Date'
      @sap.quickinfo     : 'Transportation Planning Date'
      Tddat                  : Date;

      @sap.display.format: 'Date'
      @sap.label         : 'Delivery Date'
      Lfdat                  : Date;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Bill of Lading'
      Bolnr                  : String(35);

      @sap.display.format: 'Date'
      Deliverydate           : Date;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Means of Trans. ID'
      @sap.quickinfo     : 'Means of Transport ID'
      Traid                  : String(20);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Confirm. Category'
      @sap.quickinfo     : 'Confirmation Category'
      Ebtyp                  : String(2);

      @sap.display.format: 'Date'
      @sap.label         : 'Delivery Date'
      @sap.quickinfo     : 'Delivery Date of Supplier Confirmation'
      Eindt                  : Date;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Deliv. Date Category'
      @sap.quickinfo     : 'Date Category of Delivery Date in Supplier Confirmation'
      Lpein                  : String(1);

      @sap.display.format: 'Date'
      @sap.label         : 'Creation Date'
      @sap.quickinfo     : 'Creation Date of Confirmation'
      Erdat                  : Date;

      @sap.label         : 'Creation Time'
      @sap.quickinfo     : 'Time at Which Suppluer Confirmation was Created'
      Ezeit                  : Time;

      @sap.unit          : 'Meins'
      @sap.label         : 'Quantity'
      @sap.quickinfo     : 'Quantity as Per Supplier Confirmation'
      Menge                  : Decimal(13, 3);

      @sap.label         : 'Order Unit'
      @sap.quickinfo     : 'Purchase Order Unit of Measure'
      @sap.semantics     : 'unit-of-measure'
      Meins                  : String(3);

      @sap.unit          : 'Meins'
      @sap.label         : 'Qty Reduced (MRP)'
      @sap.quickinfo     : 'Quantity Reduced (MRP)'
      Dabmg                  : Decimal(13, 3);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Creation indicator'
      @sap.quickinfo     : 'Creation Indicator: Supplier Confirmation'
      Estkz                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Deletion Indicator'
      @sap.quickinfo     : 'Supplier Confirmation Deletion Indicator'
      Loekz                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'MRP-Relevant'
      @sap.quickinfo     : 'Indicator: Confirmation is Relevant to Materials Planning'
      Kzdis                  : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Reference'
      @sap.quickinfo     : 'Reference Document Number (for Dependencies see Long Text)'
      Xblnr                  : String(35);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Item'
      @sap.quickinfo     : 'Delivery Item'
      Vbelp                  : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Mfr part profile'
      Mprof                  : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'MPN material'
      @sap.quickinfo     : 'Material number corresponding to manufacturer part number'
      Ematn                  : String(18);

      @sap.label         : 'No. Rem./Expediters'
      @sap.quickinfo     : 'Number of Reminders/Expediters'
      Mahnz                  : Decimal(3, 0);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Batch'
      @sap.quickinfo     : 'Batch Number'
      Charg                  : String(10);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'HigherLevelItemBatch'
      @sap.quickinfo     : 'Higher-Level Item of Batch Split Item'
      Uecha                  : String(6);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Sequential Number'
      @sap.quickinfo     : 'Sequential Number of Supplier Confirmation'
      RefEtens               : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'In Plant'
      @sap.quickinfo     : 'Delivery has Status ''In Plant'''
      Imwrk                  : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Delivery'
      VbelnSt                : String(10);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Item'
      @sap.quickinfo     : 'Delivery Item'
      VbelpSt                : String(6);

      @sap.display.format: 'Date'
      @sap.label         : 'Handover Date'
      @sap.quickinfo     : 'Handover Date at the Handover Location'
      Handoverdate           : Date;

      @sap.label         : 'Handover Time'
      @sap.quickinfo     : 'Handover time at the handover location'
      Handovertime           : Time;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Stock Segment'
      SgtScat                : String(40);

      @odata.Type        : 'Edm.DateTimeOffset'
      @odata.Precision   : 7
      @sap.label         : 'UTC Timestamp'
      Msgtstmp               : Timestamp;

      @sap.unit          : 'Meins'
      @sap.label         : 'CW POQTY'
      @sap.quickinfo     : 'Quantity of Order Confirmation in Base/Parallel UoM'
      xcwmxmenge             : Decimal(13, 3);

      @sap.unit          : 'Meins'
      @sap.label         : 'CW MRP Reduced Qty'
      @sap.quickinfo     : 'MRP Reduced Quantity in Base/Parallel UoM'
      xcwmxdabmg             : Decimal(13, 3);

      @sap.display.format: 'Date'
      @sap.label         : 'Start Date'
      @sap.quickinfo     : 'Start Date for Period of Performance'
      Startdate              : Date;

      @sap.display.format: 'Date'
      @sap.label         : 'End Date'
      @sap.quickinfo     : 'End Date for Period of Performance'
      Enddate                : Date;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Service Performer'
      Serviceperformer       : String(10);

      @sap.label         : 'Currency'
      @sap.quickinfo     : 'Currency Key'
      @sap.semantics     : 'currency-code'
      waers                  : String(5);

      @sap.unit          : 'waers'
      @sap.variable.scale: 'true'
      @sap.label         : 'Expected Value'
      @sap.quickinfo     : 'Expected Value of Overall Limit'
      ExpectedValue          : Decimal(13, 3);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Confirmation'
      @sap.quickinfo     : 'Supplier Confirmation Number'
      SupplierConfNo         : String(10);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Confirmation Item'
      @sap.quickinfo     : 'Supplier Confirmation Item'
      SupplierConfItem       : String(5);

      @sap.display.format: 'Date'
      @sap.label         : 'Data Aging'
      @sap.quickinfo     : 'Data Filter Value for Data Aging'
      Dataaging              : Date;

      @sap.unit          : 'Meins'
      @sap.label         : 'Allocated Stock'
      @sap.quickinfo     : 'Allocated Stock Quantity'
      FshSallocQty           : Decimal(13, 3);

      @sap.label         : 'GUID of SAP TM'
      @sap.quickinfo     : 'Reference UUID of Transportation Management'
      TmsRefUuid             : UUID;

      @sap.label         : 'Time'
      @sap.quickinfo     : 'Entry time'
      Erzet                  : Time;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Sales District'
      Bzirk                  : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Shipping Point'
      @sap.quickinfo     : 'Shipping Point / Receiving Point'
      Vstel                  : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Sales Organization'
      Vkorg                  : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Delivery Type'
      Lfart                  : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Complete Delivery'
      @sap.quickinfo     : 'Complete Delivery Defined for Each Sales Order?'
      Autlf                  : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Order Combination'
      @sap.quickinfo     : 'Order Combination Indicator'
      Kzazu                  : Boolean;

      @sap.display.format: 'Date'
      @sap.label         : 'Loading Date'
      Lddat                  : Date;

      @sap.display.format: 'Date'
      @sap.label         : 'Picking Date'
      Kodat                  : Date;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Supplier'
      @sap.quickinfo     : 'Vendor''s account number'
      Lifnr                  : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Means-of-Trans. Type'
      @sap.quickinfo     : 'Means-of-Transport Type'
      Traty                  : String(4);

      @sap.display.format: 'Date'
      @sap.label         : 'Release date'
      @sap.quickinfo     : 'Release date of the document determined by credit management'
      Cmfre                  : Date;

      @sap.display.format: 'Date'
      @sap.label         : 'Next date'
      Cmngv                  : Date;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'GR/GI Slip No.'
      @sap.quickinfo     : 'Goods Receipt/Issue Slip Number'
      Xabln                  : String(10);

      @sap.display.format: 'Date'
      @sap.label         : 'Document Date'
      @sap.quickinfo     : 'Document Date in Document'
      Bldat                  : Date;

      @sap.display.format: 'Date'
      @sap.label         : 'Act. Gds Mvmnt Date'
      @sap.quickinfo     : 'Actual Goods Movement Date'
      WadatIst               : Date;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'ShipmentBlockReason'
      @sap.quickinfo     : 'Shipment Blocking Reason'
      Trspg                  : String(2);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'ID Transport System'
      @sap.quickinfo     : 'ID for External Transport System'
      Tpsid                  : String(5);

      @sap.label         : 'External Delivery ID'
      @sap.quickinfo     : 'External Identification of Delivery Note'
      Lifex                  : String(35);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Order'
      @sap.quickinfo     : 'Order Number'
      Ternr                  : String(12);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Search Procedure'
      @sap.quickinfo     : 'Search Procedure for Batch Determination'
      KalsmCh                : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Correction delivery'
      Klief                  : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Procedure'
      @sap.quickinfo     : 'Shipping: Pricing procedure'
      Kalsp                  : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Doc. condition no.'
      @sap.quickinfo     : 'Number of document condition - pricing'
      Knump                  : String(10);

      @sap.unit          : 'waers'
      @sap.variable.scale: 'true'
      @sap.label         : 'Net Value'
      @sap.quickinfo     : 'Net Value of the Sales Order in Document Currency'
      Netwr                  : Decimal(15, 3);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Route Schedule'
      Aulwe                  : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Receiving Plant'
      @sap.quickinfo     : 'Receiving Plant for Deliveries'
      Werks                  : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Financial Doc. No.'
      @sap.quickinfo     : 'Financial doc. processing: Internal financial doc. number'
      Lcnum                  : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Paymt Guarant. Proc.'
      @sap.quickinfo     : 'Payment Guarantee Procedure'
      Abssc                  : String(6);

      @sap.label         : 'Picking Time'
      @sap.quickinfo     : 'Picking Time (Local Time, with Reference to a Plant)'
      Kouhr                  : Time;

      @sap.label         : 'Transp. Plan. Time'
      @sap.quickinfo     : 'Transp. Planning Time (Local, Relating to a Shipping Point)'
      Tduhr                  : Time;

      @sap.label         : 'Loading Time'
      @sap.quickinfo     : 'Loading Time (Local Time Relating to a Shipping Point)'
      Lduhr                  : Time;

      @sap.label         : 'Goods Issue Time'
      @sap.quickinfo     : 'Time of Goods Issue (Local, Relating to a Plant)'
      Wauhr                  : Time;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Door for Whse No.'
      @sap.quickinfo     : 'Door for Warehouse Number'
      Lgtor                  : String(3);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Staging Area'
      @sap.quickinfo     : 'Staging Area for Warehouse Complex'
      Lgbzo                  : String(10);

      @sap.label         : 'Lett.-of-Credit Crcy'
      @sap.quickinfo     : 'Currency key for letter-of-credit procg in foreign trade'
      @sap.semantics     : 'currency-code'
      Akwae                  : String(5);
      Akkur                  : Decimal(9, 5);

      @sap.label         : 'Depreciation %'
      @sap.quickinfo     : 'Depreciation percentage for financial document processing'
      Akprz                  : Decimal(5, 2);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'DG Mgmt Profile'
      @sap.quickinfo     : 'Dangerous Goods Management Profile in SD Documents'
      Proli                  : String(3);

      @sap.label         : 'Key'
      @sap.quickinfo     : 'Worldwide unique key for LIKP-VBELN'
      Handle                 : UUID;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Time segment exists'
      Tsegfl                 : Boolean;
      Tsegtp                 : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Del. loc. time zone'
      @sap.quickinfo     : 'Time zone of delivering location'
      Tzonis                 : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Rec. loc. time zone'
      @sap.quickinfo     : 'Time zone of recipient location'
      Tzonrc                 : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Contains DG'
      @sap.quickinfo     : 'Indicator: Document contains dangerous goods'
      ContDg                 : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Original system'
      @sap.quickinfo     : 'Distribution delivery: Original system'
      Verursys               : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Ind. goods mvmnt'
      @sap.quickinfo     : 'Indicator for controlling goods movement'
      Kzwab                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Transaction Code'
      Tcode                  : String(20);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Shipping Type'
      Vsart                  : String(2);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Means of Transport'
      Trmtyp                 : String(18);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Spec.Processing'
      @sap.quickinfo     : 'Special Processing Indicator'
      Sdabw                  : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Company ID'
      Vbund                  : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Calcn of value open'
      @sap.quickinfo     : 'Calculation of val. open'
      Xwoff                  : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Auto. TO Creation'
      @sap.quickinfo     : 'Automatic TO Creation Immediately After TR Generation'
      Dirta                  : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Prodn Supply Area'
      @sap.quickinfo     : 'Production Supply Area'
      Prvbe                  : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Delivery Type'
      Folar                  : String(4);

      @sap.display.format: 'Date'
      @sap.label         : 'POD Date'
      @sap.quickinfo     : 'Date (Proof of Delivery)'
      Podat                  : Date;

      @sap.label         : 'Confirm. Time'
      @sap.quickinfo     : 'Confirmation Time'
      Potim                  : Time;

      @sap.label         : 'No. Itms Pred. Sys.'
      @sap.quickinfo     : 'Number of Delivery Items with Precedessor in Other System'
      Vganz                  : Integer;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Document deletion ID'
      @sap.quickinfo     : 'Document deletion indicator'
      SpeLoekz               : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Location Sequence'
      @sap.quickinfo     : 'Sequence of Intermediate Locations in Returns Process'
      SpeLocSeq              : String(3);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Del.Conf.Stat.'
      @sap.quickinfo     : 'Delivery Confirmation Status'
      SpeAccAppSts           : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Ship.Info.Stat.'
      @sap.quickinfo     : 'Shipment Information Status'
      SpeShpInfSts           : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Ret.ASN Canc.'
      @sap.quickinfo     : 'Returns: Flag showing that an ASN is cancelled'
      SpeRetCanc             : Boolean;

      @sap.label         : 'Goods Issue Time'
      @sap.quickinfo     : 'Time of Goods Issue (Local, Relating to a Plant)'
      SpeWauhrIst            : Time;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Time Zone'
      SpeWazoneIst           : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Status Decent. Whse'
      @sap.quickinfo     : 'Distribution Status (Decentralized Warehouse Processing)'
      SpeRevVlstk            : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Scenario Logistic Ex'
      @sap.quickinfo     : 'Scenario Logistic Execution'
      SpeLeScenario          : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Original System Type'
      SpeOrigSys             : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Changer''s Sys.Type'
      @sap.quickinfo     : 'Last Changer''s System Type'
      SpeChngSys             : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Geographical Route'
      @sap.quickinfo     : 'Description of a Geographical Route'
      SpeGeoroute            : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Chg Ind for Route'
      @sap.quickinfo     : 'Change Indicator for the Route'
      SpeGeorouteind         : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Change Indicator'
      @sap.quickinfo     : 'Change Indicator for the Carrier'
      SpeCarrierInd          : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Goods Traffic Type'
      SpeGtsRel              : String(2);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'GTS Route Code'
      @sap.quickinfo     : 'Route Code for SAP Global Trade Services'
      SpeGtsRtCde            : String(10);

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Release Time Stamp'
      SpeRelTmstmp           : DateTime;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Msrmnt Unit System'
      @sap.quickinfo     : 'Measurement Unit System'
      SpeUnitSystem          : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Invoice Before GI'
      @sap.quickinfo     : 'Invoice Creation Before Goods Issue'
      SpeInvBfrGi            : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Quality Insp. Status'
      @sap.quickinfo     : 'Status of Quality Inspection for Returns Deliveries'
      SpeQiStatus            : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Redirected'
      @sap.quickinfo     : 'SPE indicator if redirecting has occured'
      SpeRedInd              : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Storage Status'
      @sap.quickinfo     : 'SAP Global Trade Services: Storage Status of Delivery'
      Sakes                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Type of Ext. Ident.'
      @sap.quickinfo     : 'Type of External Identification'
      SpeLifexType           : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Means of Transport'
      SpeTtype               : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'PRO Number'
      @sap.quickinfo     : 'Partner Identification : Progressive Identification Number'
      SpeProNumber           : String(35);

      @sap.label         : 'Akkreditiv'
      @sap.quickinfo     : 'Akkreditiv (GUID)'
      LocGuid                : UUID;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Billing Indicator'
      @sap.quickinfo     : 'EWM Billing Indicator'
      SpeBillingInd          : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Print Profile'
      @sap.quickinfo     : 'Description of Print Profile'
      PrinterProfile         : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Adv. Returns Active'
      @sap.quickinfo     : 'Advanced Returns Management Active'
      MsrActive              : String(1);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Document log'
      @sap.quickinfo     : 'Confirmation number'
      Prtnr                  : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Storage Loc. Change'
      @sap.quickinfo     : 'Temporary Change of Storage Locations in Delivery'
      StgeLocChange          : String(1);

      @sap.label         : 'Control Key'
      @sap.quickinfo     : 'Control Key for Document Transfer to TM'
      TmCtrlKey              : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Split Initiator'
      @sap.quickinfo     : 'Delivery Split Initiator'
      DlvSplitInitia         : String(1);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Delivery Version'
      DlvVersion             : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Type of Previous Doc'
      @sap.quickinfo     : 'Type of Previous Document'
      GtsVorpa               : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'No. of Previous Doc.'
      @sap.quickinfo     : 'Number of Previous Document'
      GtsVornu               : String(25);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Mode of Transport'
      @sap.quickinfo     : 'Mode of Transport at the Border (Intrastat)'
      GtsExpvz               : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Port/Airport'
      GtsPorti               : String(4);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Mode of Transport'
      @sap.quickinfo     : 'Mode of Transport at the Border'
      ItmExpvz               : String(2);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Ctry MeansTr-Border'
      @sap.quickinfo     : 'Origin of Means of Transport when Crossing the Border'
      ItmStgbe               : String(3);

      @sap.label         : 'Id Means Transp Bord'
      @sap.quickinfo     : 'Identifier for Means of Transport crossing the Border'
      ItmKzgbe               : String(30);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'ConveyanceRefIdn'
      @sap.quickinfo     : 'Cross-Border Conveyance Reference ID'
      ItmVygid               : String(35);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Mode Transp Inland'
      @sap.quickinfo     : 'Inland Mode of Transport'
      ItmIever               : String(2);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Ctry MeansTr-Inland'
      @sap.quickinfo     : 'Country of Origin of the Means of Transport at Departure'
      ItmStabe               : String(3);

      @sap.label         : 'Id Means Transp Inl'
      @sap.quickinfo     : 'Identification for the Means of Transport Inland'
      ItmKzabe               : String(30);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Handover Location'
      @sap.quickinfo     : 'Location for a physical handover of goods'
      Handoverloc            : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'HandoverLoc.TimeZone'
      @sap.quickinfo     : 'Time Zone of Handover Location'
      Handovertzone          : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Delivery Conf. Sts'
      @sap.quickinfo     : 'Delivery Confirmation Status (All Items)'
      Bestk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Maximum Value'
      @sap.quickinfo     : 'Status of Credit Check Against Maximum Document Value'
      Cmpsc                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Terms of Payment'
      @sap.quickinfo     : 'Status of Credit Check Against Terms of Payment'
      Cmpsd                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Financial Document'
      @sap.quickinfo     : 'Status of Credit Check Against Financial Document'
      Cmpsi                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Expt Cred. Insurance'
      @sap.quickinfo     : 'Status of Credit Check Against Export Credit Insurance'
      Cmpsj                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Payment Card Status'
      @sap.quickinfo     : 'Status of Credit Check Against Payment Card Authorization'
      Cmpsk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'SAP Cred. Mgmt'
      @sap.quickinfo     : 'Status of Credit Check SAP Credit Management'
      CmpsCm                 : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'CrMa TE Status'
      @sap.quickinfo     : 'Status of Technical Error SAP Credit Management'
      CmpsTe                 : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Credit Status'
      @sap.quickinfo     : 'Overall Status of Credit Checks'
      Cmgst                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Intco Billing Status'
      @sap.quickinfo     : 'Intercompany Billing Status (All Items)'
      Fkivk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Deliv.Rel. Billg Sts'
      @sap.quickinfo     : 'Delivery-Related Billing Status (All Items)'
      Fkstk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Overall Status'
      @sap.quickinfo     : 'Overall Processing Status (Header/All Items)'
      Gbstk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'On Hold'
      @sap.quickinfo     : 'Inbound delivery header not yet complete (on Hold)'
      Hdall                  : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Pos. Hold'
      @sap.quickinfo     : 'At least one of ID items not yet complete (on Hold)'
      Hdals                  : Boolean;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Pick Confirmation'
      @sap.quickinfo     : 'Status of Pick Confirmation'
      Koquk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Picking Status'
      @sap.quickinfo     : 'Picking Status/Putaway Status (All Items)'
      Kostk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'WM Activity Status'
      @sap.quickinfo     : 'Status of Warehouse Management Activities (All Items)'
      Lvstk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'POD Status'
      @sap.quickinfo     : 'POD Status on Header Level'
      Pdstk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Packing Status'
      @sap.quickinfo     : 'Packing Status (All Items)'
      Pkstk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Temp Inb.'
      @sap.quickinfo     : 'Temporary inbound delivery'
      SpeTmpid               : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Overall Block Status'
      @sap.quickinfo     : 'Overall Block Status (Header)'
      Spstg                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Transp. Plng Sts'
      @sap.quickinfo     : 'Transportation Planning Status (Header)'
      Trsta                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Overall Header'
      @sap.quickinfo     : 'Incompletion Status (Header)'
      Uvall                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'All Items'
      @sap.quickinfo     : 'Incompletion Status (All Items)'
      Uvals                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Billing – Header'
      @sap.quickinfo     : 'Billing Incompletion Status (Header)'
      Uvfak                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Billing – All Items'
      @sap.quickinfo     : 'Billing Incompletion Status (All Items)'
      Uvfas                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Packing – Header'
      @sap.quickinfo     : 'Packing Incompletion Status (Header)'
      Uvpak                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Packing – All Items'
      @sap.quickinfo     : 'Packing Incompletion Status (All Items)'
      Uvpas                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Picking/Putaway–Hdr'
      @sap.quickinfo     : 'Picking/Putaway Incompletion Status (Header)'
      Uvpik                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Picking/Ptwy – Items'
      @sap.quickinfo     : 'Picking/Putaway Incompletion Status (All Items)'
      Uvpis                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Delivery – Header'
      @sap.quickinfo     : 'Delivery Incompletion Status (Header)'
      Uvvlk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Delivery – All Items'
      @sap.quickinfo     : 'Delivery Incompletion Status (All Items)'
      Uvvls                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'GoodsMvt–Header'
      @sap.quickinfo     : 'Goods Movement Incompletion Status (Header)'
      Uvwak                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'GdsMvt–All Itms'
      @sap.quickinfo     : 'Goods Movement Incompletion Status (All Items)'
      Uvwas                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'HU Placed in Stock'
      @sap.quickinfo     : 'Handling Unit Placed in Stock'
      Vestk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Status Decent. Whse'
      @sap.quickinfo     : 'Distribution Status (Decentralized Warehouse Processing)'
      Vlstk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Goods Movement Sts'
      @sap.quickinfo     : 'Goods Movement Status (All Items)'
      Wbstk                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Header reserves 1'
      @sap.quickinfo     : 'Customer reserves 1: Header status'
      Uvk01                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Header reserves 2'
      @sap.quickinfo     : 'Customer reserves 2: Header status'
      Uvk02                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Header reserves 3'
      @sap.quickinfo     : 'Customer reserves 3: Header status'
      Uvk03                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Header reserves 4'
      @sap.quickinfo     : 'Custmer reserves 4: Header status'
      Uvk04                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Header reserves 5'
      @sap.quickinfo     : 'Customer reserves 5: Header status'
      Uvk05                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Total reserves 1'
      @sap.quickinfo     : 'Customer reserves 1: Sum of all items'
      Uvs01                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Total reserves 2'
      @sap.quickinfo     : 'Customer reserves 2: Sum of all items'
      Uvs02                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Total reserves 3'
      @sap.quickinfo     : 'Customer reserves 3: Sum of all items'
      Uvs03                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Total reserves 4'
      @sap.quickinfo     : 'Customer reserves 4: Sum of all items'
      Uvs04                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Total reserves 5'
      @sap.quickinfo     : 'Customer reserves 5: Sum of all items'
      Uvs05                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Prod. Marktablty Sts'
      @sap.quickinfo     : 'Total Product Marketability Check Status'
      TotalPcsta             : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Dangerous Goods Sts'
      @sap.quickinfo     : 'Total Dangerous Goods Check Status'
      TotalDgsta             : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Sfty Data Sheet Sts'
      @sap.quickinfo     : 'Total Safety Data Sheet Check Status'
      TotalSdssta            : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'ET ARC Status'
      @sap.quickinfo     : 'Excise Tax Total ARC Status (on Delivery Header Level)'
      TotalArcStatus         : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Intco Billing Status'
      @sap.quickinfo     : 'Intercompany Billing Status (All Items)'
      IcoFkivk               : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Embargo Status'
      @sap.quickinfo     : 'Embargo Status (All Items)'
      TotalEmcst             : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Screening Status'
      @sap.quickinfo     : 'Screening Status (All Items)'
      TotalSlcst             : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Legal Control Status'
      TotalLccst             : String(1);

      @sap.label         : 'Ext. Bus. Syst. ID'
      @sap.quickinfo     : 'External Business System ID'
      ExtBusSystId           : String(60);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Spec.Iss. Val. SiT'
      @sap.quickinfo     : 'Specification for Issuing Valuated Stock in Transit'
      SitkzDb                : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Adv. SR Relevance'
      @sap.quickinfo     : 'Advanced Shipping and Receiving Relevance'
      TmAdvShipRecv          : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Warehouse Execution'
      @sap.quickinfo     : 'Warehouse Execution Status'
      TmWhseExec             : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Warehouse Execution Block'
      @sap.heading       : ''
      TmWhseBlock            : String(2);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Legal Contrl License'
      @sap.quickinfo     : 'Legal Control License Indicator'
      LglcLicInd             : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Qty. Corr. Adv. SR'
      @sap.quickinfo     : 'Quantity Correction After Goods Receipt in Advanced SR'
      CorrInd                : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Dummy function in length 1'
      @sap.heading       : ''
      DummyDeliveryInclEewPs : String(1);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Loading Units'
      xbev1xluleinh          : String(8);

      @sap.label         : 'Number Category 1'
      xbev1xrpfaess          : Decimal(7, 0);

      @sap.label         : 'Number Category 2'
      xbev1xrpkist           : Decimal(7, 0);

      @sap.label         : 'Number Category 3'
      xbev1xrpcont           : Decimal(7, 0);

      @sap.label         : 'Number Category 4'
      xbev1xrpsonst          : Decimal(7, 0);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Sequence Number'
      @sap.quickinfo     : 'Loading Sequence Number in the Tour'
      xbev1xrpflgnr          : String(5);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Current point'
      @sap.quickinfo     : 'Last Notified Point of the Route from Tracking'
      IdtCurEvtloc           : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Arrival/Departure'
      @sap.quickinfo     : 'Indicates Arrival or Departure at the Current Point'
      IdtCurEvtqua           : String(1);

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Current time stamp'
      @sap.quickinfo     : 'Event Time Stamp for the Tracking Message at Current Point'
      IdtCurEvttst           : DateTime;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Current base point'
      @sap.quickinfo     : 'Base Point for Time Estimation from Tracking'
      IdtCurEstloc           : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Arrival/Departure'
      @sap.quickinfo     : 'Arrival/Departure for Time Estimation'
      IdtCurEstqua           : String(1);

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Time estim. stamp'
      @sap.quickinfo     : 'Base Date for Estimation of the Delivery Date in Tracking'
      IdtCurEsttst           : DateTime;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Event / Estimation'
      @sap.quickinfo     : 'Various Qualifiers of the Tracking Entry'
      IdtCurWrkqua           : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Prior point'
      @sap.quickinfo     : 'Prior Route Point From Tracking'
      IdtPreEvtloc           : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Arrival/Departure'
      @sap.quickinfo     : 'Indicates the Arrival and Departure at Prior Point'
      IdtPreEvtqua           : String(1);

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Prior time stamp'
      @sap.quickinfo     : 'Event Time Stamp for the Tracking Message at Prior Point'
      IdtPreEvttst           : DateTime;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Prior base point'
      @sap.quickinfo     : 'Prior Base Point for Time Estimation from Tracking'
      IdtPreEstloc           : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Arrival/Departure'
      @sap.quickinfo     : 'Arrival/Departure for Time Estimation'
      IdtPreEstqua           : String(1);

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Time estim. stamp'
      @sap.quickinfo     : 'Base Date for Estimation of the Delivery Date in Tracking'
      IdtPreEsttst           : DateTime;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Event / Estimation'
      @sap.quickinfo     : 'Various Qualifiers of the Prior Tracking Entry'
      IdtPreWrkqua           : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Current base point'
      @sap.quickinfo     : 'Reference Point for Time Estimation from Tracking'
      IdtRefEstloc           : String(10);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Arrival/Departure'
      @sap.quickinfo     : 'Indicates Arrival/Departure at the Reference Point'
      IdtRefEstqua           : String(1);

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Time estim. stamp'
      @sap.quickinfo     : 'Base Date for Estimation of the Delivery Date in Tracking'
      IdtRefEsttst           : DateTime;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Delivery date fixed'
      @sap.quickinfo     : 'Commitment Level of Delivery Date and Time'
      IdtFirmLfdat           : String(2);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'IDoc number'
      IdtDocnum              : String(16);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Inbound Dly. Group'
      @sap.quickinfo     : 'Inbound Dely Group: Multi-Level Goods Receipt Automotive'
      BorgrGrp               : String(35);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Kanban Indicator'
      Kbnkz                  : String(1);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Transaction Number'
      FshTransaction         : String(10);

      @sap.display.format: 'NonNegative'
      @sap.label         : 'Last VAS Item Number'
      FshVasLastItem         : String(5);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'VAS Cust. Group'
      @sap.quickinfo     : 'Value-Added Services Customer Group'
      FshVasCg               : String(3);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'PSST Group'
      RfmPsstGroup           : String(10);

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Ext. act. date'
      @sap.quickinfo     : 'External Actual Transfer of Control Date'
      ExtActDateTocd         : DateTime;

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Ext. plan. date'
      @sap.quickinfo     : 'External Planned Transfer of Control Date'
      ExtPlanDateTocd        : DateTime;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Time zone ext. TOCD'
      @sap.quickinfo     : 'Time zone for external Transfer of Control Date'
      ExtTzoneTocd           : String(6);

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Int. act. date'
      @sap.quickinfo     : 'Internal Actual Transfer of Control Date'
      IntActDateTocd         : DateTime;

      @odata.Type        : 'Edm.DateTimeOffset'
      @sap.label         : 'Int. plan. date'
      @sap.quickinfo     : 'Internal Planned Transfer of Control Date'
      IntPlanDateTocd        : DateTime;

      @sap.display.format: 'UpperCase'
      @sap.label         : 'Time zone int. TOCD'
      @sap.quickinfo     : 'Time zone for internal Transfer of Control Date'
      IntTzoneTocd           : String(6);

      @sap.display.format: 'UpperCase'
      @sap.label         : 'JIT-Relevant'
      JitRlvnt               : Boolean;
      to_poasnhd             : Association to ZP_MM_ASNPOHEAD_BND.ZP_MM_ASNPOHEAD {};
      to_poasnitm            : Association to ZP_MM_ASNPOHEAD_BND.ZP_MM_ASNPOITEM {};
};

@cds.external        : true
@cds.persistence.skip: true
@sap.content.version : '1'
entity ZP_MM_ASNPOHEAD_BND.SAP__Currencies {
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
entity ZP_MM_ASNPOHEAD_BND.SAP__UnitsOfMeasure {
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
