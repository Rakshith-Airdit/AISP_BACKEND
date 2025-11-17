/* checksum : 865d455080cec8a8e8d668755139a710 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service ZC_AISP_VALUEHELP_BND {};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Valuehelp for Company code'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_COMPANYCODE_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Company Code'
  key CompanyCode : String(4) not null;
  @sap.label : 'Company Name'
  @sap.quickinfo : 'Name of Company Code or Company'
  Description : String(25);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Currency'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_CURRENCY_VH {
  @sap.label : 'Currency'
  @sap.quickinfo : 'Currency Key'
  @sap.semantics : 'currency-code'
  key Waers : String(5) not null;
  @sap.label : 'Long Text'
  Ltext : String(40);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Incoterms Valuehelp'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_INCOTERMS_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Incoterms'
  @sap.quickinfo : 'Incoterms (Part 1)'
  key Inco1 : String(3) not null;
  @sap.label : 'Description'
  Bezei : String(30);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Valuehelp for Material details'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_MATERIALDETAILS_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Material'
  @sap.quickinfo : 'Material Number'
  key Matnr : String(18) not null;
  @sap.label : 'Material Description'
  Maktx : String(40);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Material Group'
  MaterialGroup : String(9);
  @sap.label : 'Technical'
  @sap.quickinfo : 'External Unit of Measurement in Technical Format (6-Char.)'
  UnitOfMeasure : String(6);
  @sap.label : 'Measurement Unit Txt'
  @sap.quickinfo : 'Unit of Measurement Text (Maximum 30 Characters)'
  Description : String(30);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Valuehelp for Material Group'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_MATERIALGROUP_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Material Group'
  key Matkl : String(9) not null;
  @sap.label : 'Material Group Desc.'
  @sap.quickinfo : 'Material Group Description'
  Wgbez : String(20);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Payment Terms'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_PAYMENTTERMS_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Payment terms'
  @sap.quickinfo : 'Terms of payment key'
  key Zterm : String(4) not null;
  @sap.label : 'Description'
  @sap.quickinfo : 'Description of terms of payment'
  Vtext : String(30);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Valuehelp for Plant'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_PLANT_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Plant'
  key Werks : String(4) not null;
  @sap.label : 'Name 1'
  @sap.quickinfo : 'Name'
  Name1 : String(30);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Valuehelp for Purchase Group'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_PURCHASEGROUP_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purchasing Group'
  key Ekgrp : String(3) not null;
  @sap.label : 'Description p. group'
  @sap.quickinfo : 'Description of purchasing group'
  Eknam : String(18);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Valuehelp for Purchase Organization'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_PURCHASEORG_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Purch. organization'
  @sap.quickinfo : 'Purchasing organization'
  key Ekorg : String(4) not null;
  @sap.label : 'Description'
  @sap.quickinfo : 'Description of purchasing organization'
  Ekotx : String(20);
};

@cds.external : true
@cds.persistence.skip : true
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.deletable : 'false'
@sap.searchable : 'true'
@sap.content.version : '1'
@sap.label : 'Valuehelp for Supplier Details'
entity ZC_AISP_VALUEHELP_BND.ZC_AISP_VENDORDETAILS_VH {
  @sap.display.format : 'UpperCase'
  @sap.label : 'Supplier'
  @sap.quickinfo : 'Account Number of Supplier'
  key Lifnr : String(10) not null;
  @sap.display.format : 'UpperCase'
  @sap.label : 'Country/Region Key'
  Country : String(3);
  @sap.label : 'Name'
  @sap.quickinfo : 'Name 1'
  VendorName : String(35);
  @sap.label : 'City'
  City : String(35);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Postal Code'
  PostalCode : String(10);
  @sap.label : 'Street'
  @sap.quickinfo : 'Street and House Number'
  Street : String(35);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Address'
  Adrnr : String(10);
  @sap.label : 'E-Mail Address'
  VendorEmail : String(241);
  @sap.display.format : 'UpperCase'
  @sap.label : 'Account group'
  @sap.quickinfo : 'Vendor account group'
  VendorAccGroup : String(4);
  @sap.label : 'Name'
  @sap.quickinfo : 'Account Group Name'
  Description : String(30);
};

@cds.external : true
@cds.persistence.skip : true
@sap.content.version : '1'
entity ZC_AISP_VALUEHELP_BND.SAP__Currencies {
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
entity ZC_AISP_VALUEHELP_BND.SAP__UnitsOfMeasure {
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

