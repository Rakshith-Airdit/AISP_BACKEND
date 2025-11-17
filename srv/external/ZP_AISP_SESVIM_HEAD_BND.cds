/* checksum : f8d677c57cfd166058f81dbeac98e506 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZP_AISP_SESVIM_HEAD_BND {};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.content.version : '1'
@sap.label : 'For getting SES Details.'
entity ZP_AISP_SESVIM_HEAD_BND.ZI_AISP_SESVIM_DETAILS {
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package number'
  key Packno : String(10) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Line'
  @sap.quickinfo : 'Line Number'
  key Introw : String(10) not null;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Line Number'
  key Extrow : String(10) not null;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Deletion Indicator'
  Del : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Activity number'
  @sap.quickinfo : 'Activity Number'
  Srvpos : String(18);
  @odata.Type : 'Edm.Byte'
  @sap.label : 'Hierarchy level'
  @sap.quickinfo : 'Hierarchy level of group'
  Rang : Integer;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Outline Level'
  Extgroup : String(8);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Service Assignment'
  Pckge : String(1);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package'
  @sap.quickinfo : 'Subpackage number'
  SubPackno : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Service Type'
  @sap.quickinfo : 'Short Description of Service Type'
  Lbnum : String(3);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Edition'
  @sap.quickinfo : 'Edition of Service Type'
  Ausgb : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'SSC Item'
  @sap.quickinfo : 'Standard Service Catalog Item'
  Stlvpos : String(18);
  @sap.display.format : 'UpperCase'
  @sap.label : 'External Service No.'
  @sap.quickinfo : 'Supplier''s Service Number'
  Extsrvno : String(18);
  @sap.unit : 'Meins'
  @sap.label : 'Quantity'
  @sap.quickinfo : 'Quantity with Sign'
  Menge : Decimal(13, 3);
  @sap.label : 'Base Unit of Measure'
  @sap.semantics : 'unit-of-measure'
  Meins : String(3);
  @sap.label : 'Overfulfillment Tol.'
  @sap.quickinfo : 'Overfulfillment Tolerance'
  Uebto : Decimal(3, 1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Unlimited Overfulf.'
  @sap.quickinfo : 'Unlimited Overfulfillment'
  Uebtk : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Also Unplanned'
  @sap.quickinfo : 'Also Search in Limits'
  WithLim : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Condition Update'
  @sap.quickinfo : 'Update Conditions'
  Spinf : Boolean;
  @sap.label : 'Price unit'
  Peinh : Decimal(5, 0);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Gross Price'
  Unitprice : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Net Value'
  @sap.quickinfo : 'Net Value of Item'
  Itemtotalprice : Decimal(11, 3);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Lower Limit'
  Frompos : String(6);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  Waers : String(5);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Upper Limit'
  Topos : String(6);
  @sap.label : 'Short Text'
  Ktext1 : String(40);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Distrib. Indicator'
  @sap.quickinfo : 'Distribution Indicator for Multiple Account Assignment'
  Vrtkz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Partial invoice'
  @sap.quickinfo : 'Partial invoice indicator'
  Twrkz : String(1);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Personnel Number'
  Pernr : String(8);
  @sap.display.format : 'UpperCase'
  @sap.label : 'HCM Localization'
  Molga : String(2);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Wage Type'
  Lgart : String(4);
  @sap.label : 'Wage Type Long Text'
  Lgtxt : String(25);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Job key'
  @sap.quickinfo : 'Job'
  Stell : String(8);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Number'
  @sap.quickinfo : 'Sequence Number for CO/MM-SRV Interface Tables'
  Iftnr : String(10);
  @sap.display.format : 'Date'
  @sap.label : 'Posting Date'
  @sap.quickinfo : 'Posting Date in the Document'
  Budat : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Insert date'
  @sap.quickinfo : 'Date on Which This Record was Stored in the Table'
  Insdt : Date;
  @sap.display.format : 'NonNegative'
  @sap.label : 'P'
  @sap.quickinfo : 'Source package number'
  PlnPackno : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'I'
  @sap.quickinfo : 'Entry: Planned package line'
  PlnIntrow : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Pkg. no.'
  @sap.quickinfo : 'Entry: Unplanned from contract'
  KntPackno : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Line'
  @sap.quickinfo : 'Entry: Unplanned from contract'
  KntIntrow : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Entry: Unplanned service from model specifications'
  @sap.heading : ''
  TmpPackno : String(10);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Entry: Unplanned service from model specifications'
  @sap.heading : ''
  TmpIntrow : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'SSC limits'
  @sap.quickinfo : 'Service line refers to standard service catalog limits'
  StlvLim : Boolean;
  @sap.display.format : 'NonNegative'
  @sap.label : 'Line'
  @sap.quickinfo : 'Entry: Unplanned, limit line'
  LimitRow : String(10);
  @sap.unit : 'Meins'
  @sap.label : 'Entered Quantity'
  @sap.quickinfo : 'Purchase Order: Entered Quantity'
  ActMenge : Decimal(13, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Entered Value'
  ActWert : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Value Released'
  @sap.quickinfo : 'Contract: Value Released (via Release Orders)'
  KntWert : Decimal(11, 3);
  @sap.unit : 'Meins'
  @sap.label : 'Qty Released'
  @sap.quickinfo : 'Contract: Quantity Released (by Issue of Release Orders)'
  KntMenge : Decimal(13, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Tgt Val.'
  @sap.quickinfo : 'Target Value'
  Zielwert : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Unpl. Released Val.'
  @sap.quickinfo : 'Contract: Unplanned Released Value'
  UngWert : Decimal(11, 3);
  @sap.unit : 'Meins'
  @sap.label : 'Unpl. Released Qty'
  @sap.quickinfo : 'Contract: Unplanned Released Quantity'
  UngMenge : Decimal(13, 3);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Alternative'
  @sap.quickinfo : 'Alternatives: Reference to basic item'
  AltIntrow : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Basic Line'
  Basic : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Alternative Line'
  Alternat : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Bidder''s Line'
  Bidder : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Supplementary Line'
  Supple : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Line with Open Qty'
  @sap.quickinfo : 'Line with Open Quantity'
  Freeqty : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Informatory Line'
  Inform : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Blanket Line'
  Pausch : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Contingency Line'
  Eventual : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Tax Code'
  @sap.quickinfo : 'Tax on sales/purchases code'
  Mwskz : String(2);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Tax Jurisdiction'
  Txjcd : String(15);
  @sap.display.format : 'Date'
  @sap.label : 'Tax Date'
  @sap.quickinfo : 'Date for Determining Tax Rates'
  Txdat : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Price Change'
  @sap.quickinfo : 'Price Change in Entry Sheet'
  PrsChg : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Material Group'
  Matkl : String(9);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Gross Price'
  Tbtwr : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Non-ded. input tax'
  @sap.quickinfo : 'Non-deductible input tax'
  Navnw : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Tax base amount'
  Baswr : Decimal(11, 3);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Doc. Condition No.'
  @sap.quickinfo : 'Number of the Document Condition'
  Kknumv : String(10);
  @sap.label : 'Unit for Work'
  @sap.semantics : 'unit-of-measure'
  Iwein : String(3);
  @sap.unit : 'Iwein'
  @sap.label : 'Work'
  @sap.quickinfo : 'Internal Work'
  IntWork : Decimal(8, 2);
  @sap.label : 'SRM Reference'
  @sap.quickinfo : 'SRM Reference Key'
  Externalid : String(40);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Cost Element'
  Kstar : String(10);
  @sap.unit : 'Iwein'
  @sap.label : 'Work'
  @sap.quickinfo : 'Internal Work'
  ActWork : Decimal(8, 2);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Mapping Commitment'
  @sap.quickinfo : 'Mapping Field f. PACKNO, INTROW at Item Level for Commitment'
  Mapno : String(4);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Item ID'
  @sap.quickinfo : 'Item Key for eSOA Messages'
  Srvmapkey : String(10);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Tax Tariff Code'
  Taxtariffcode : String(16);
  @sap.display.format : 'Date'
  @sap.label : 'Date'
  Sdate : Date;
  @sap.label : 'Start Time'
  Begtime : Time;
  @sap.label : 'End Time'
  Endtime : Time;
  @sap.label : 'Personnel Number'
  @sap.quickinfo : 'External Personnel Number'
  Persext : String(40);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Counter'
  @sap.quickinfo : 'Counter for Records in Time Recording'
  Catscounte : String(12);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Reversed'
  @sap.quickinfo : 'Indicator: Document was reversed'
  Stokz : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Document no.'
  Belnr : String(10);
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection view for Service Entry Sheet based Invoice Head'
entity ZP_AISP_SESVIM_HEAD_BND.ZP_AISP_SESVIM_HEAD {
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
  to_sesvimitm_oc : Boolean;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Company Code'
  Bukrs : String(4);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Created By'
  @sap.quickinfo : 'User of person who created a purchasing document'
  Ernam : String(12);
  @odata.Type : 'Edm.DateTimeOffset'
  @odata.Precision : 7
  @sap.label : 'Last Changed'
  @sap.quickinfo : 'Change Time Stamp'
  Lastchangedatetime : Timestamp;
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
  Status : String(25);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  Amount : Decimal(13, 3);
  @sap.label : 'Name'
  @sap.quickinfo : 'Name 1'
  name1 : String(35);
  Ship1 : String(72);
  Ship2 : String(75);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Payment terms'
  @sap.quickinfo : 'Terms of payment key'
  Zterm : String(4);
  Vendoraddress : String(86);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Bank Account'
  @sap.quickinfo : 'Bank account number'
  Bankacc : String(18);
  @sap.label : 'Bank Name'
  @sap.quickinfo : 'Name of Financial Institution'
  Bankname : String(60);
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
  @sap.label : 'Fixed Exchange Rate'
  @sap.quickinfo : 'Indicator for Fixed Exchange Rate'
  Kufix : Boolean;
  @sap.display.format : 'Date'
  @sap.label : 'Document Date'
  @sap.quickinfo : 'Purchasing Document Date'
  Bedat : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Down Payment'
  @sap.quickinfo : 'Down Payment Indicator'
  Dptyp : String(4);
  @sap.label : 'Down Payment %'
  @sap.quickinfo : 'Down Payment Percentage'
  Dppct : Decimal(5, 2);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Down Payment Amount'
  @sap.quickinfo : 'Down Payment Amount in Document Currency'
  Dpamt : Decimal(11, 3);
  @sap.display.format : 'Date'
  @sap.label : 'Due Date for DP'
  @sap.quickinfo : 'Due Date for Down Payment'
  Dpdat : Date;
  to_sesvimitm : Composition of many ZP_AISP_SESVIM_HEAD_BND.ZP_AISP_SESVIM_ITEM {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
@sap.deletable.path : 'Delete_mc'
@sap.updatable.path : 'Update_mc'
@sap.label : 'Projection view for Service Entry Sheet based Invoice Item'
entity ZP_AISP_SESVIM_HEAD_BND.ZP_AISP_SESVIM_ITEM {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Entry Sheet'
  @sap.quickinfo : 'Entry Sheet Number'
  key Lblni : String(10) not null;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Document'
  @sap.quickinfo : 'Purchasing Document Number'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
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
  @sap.display.format : 'NonNegative'
  @sap.label : 'Item'
  @sap.quickinfo : 'Item Number of Purchasing Document'
  Ebelp : String(5);
  @sap.display.format : 'UpperCase'
  @sap.label : 'External Number'
  @sap.quickinfo : 'External Entry Sheet Number'
  Lblne : String(16);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Created By'
  @sap.quickinfo : 'Name of Person Responsible for Creating the Object'
  Ernam : String(12);
  @sap.display.format : 'Date'
  @sap.label : 'Created on'
  @sap.quickinfo : 'Date on which the record was created'
  Erdat : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Changed On'
  @sap.quickinfo : 'Last Changed On'
  Aedat : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Changed By'
  @sap.quickinfo : 'Name of Person Who Changed Object'
  Aenam : String(12);
  @sap.label : 'PersRsp.Int.'
  @sap.quickinfo : 'Person Responsible (Internally)'
  Sbnamag : String(12);
  @sap.label : 'PersRsp.Ext.'
  @sap.quickinfo : 'Person Responsible (Externally)'
  Sbnaman : String(12);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package'
  @sap.quickinfo : 'Subpackage number'
  SubPackno : String(10);
  Status : String(15);
  @sap.display.format : 'Date'
  @sap.label : 'Period'
  Lzvon : Date;
  @sap.display.format : 'Date'
  @sap.label : 'End'
  @sap.quickinfo : 'End of period'
  Lzbis : Date;
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Gross Value'
  @sap.quickinfo : 'Value of Services'
  Lwert : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Unplanned Portion'
  @sap.quickinfo : 'Portion from Unplanned Services'
  Uwert : Decimal(11, 3);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Unpl. Val. w/o Cntr.'
  @sap.quickinfo : 'Portion Unplanned Value Without Reference to Contract'
  Unplv : Decimal(11, 3);
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  Waers : String(5);
  @sap.display.format : 'NonNegative'
  @sap.label : 'Package number'
  Packno : String(10);
  @sap.label : 'Short Text'
  @sap.quickinfo : 'Short Text of Service Entry Sheet'
  Txz01 : String(40);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Deletion indicator'
  @sap.quickinfo : 'Deletion indicator in entry sheet'
  Loekz : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Acceptance'
  @sap.quickinfo : 'Acceptance indicator'
  Kzabn : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Final Entry'
  @sap.quickinfo : 'Indicator: Final Entry Sheet'
  Final : String(1);
  @sap.label : 'Quality'
  @sap.quickinfo : 'Points score for quality of services'
  Pwwe : Decimal(3, 0);
  @sap.label : 'On-time delivery'
  @sap.quickinfo : 'Points score for on-time delivery'
  Pwfr : Decimal(3, 0);
  @sap.display.format : 'Date'
  @sap.label : 'Document Date'
  @sap.quickinfo : 'Document Date in Document'
  Bldat : Date;
  @sap.display.format : 'Date'
  @sap.label : 'Posting Date'
  @sap.quickinfo : 'Posting Date in the Document'
  Budat : Date;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Reference'
  @sap.quickinfo : 'Reference Document Number'
  Xblnr : String(16);
  @sap.label : 'Document Header Text'
  Bktxt : String(25);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Acct Assignment Cat.'
  @sap.quickinfo : 'Account Assignment Category'
  Knttp : String(1);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Consumption'
  @sap.quickinfo : 'Consumption posting'
  Kzvbr : String(1);
  @sap.unit : 'Waers'
  @sap.variable.scale : 'true'
  @sap.label : 'Net Value'
  @sap.quickinfo : 'Net Value of Entry Sheet'
  Netwr : Decimal(11, 3);
  to_sesvimhd : Association to ZP_AISP_SESVIM_HEAD_BND.ZP_AISP_SESVIM_HEAD {  };
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
entity ZP_AISP_SESVIM_HEAD_BND.SAP__Currencies {
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
entity ZP_AISP_SESVIM_HEAD_BND.SAP__UnitsOfMeasure {
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

