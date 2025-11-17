using ZP_MM_POHEAD_BND from './external/ZP_MM_POHEAD_BND.cds';

service ZP_MM_POHEAD_BNDSampleService {
    @readonly
    entity SAP__Currencies     as
        projection on ZP_MM_POHEAD_BND.SAP__Currencies {
            key CurrencyCode,
                ISOCode,
                Text,
                DecimalPlaces
        };

    @readonly
    entity SAP__UnitsOfMeasure as
        projection on ZP_MM_POHEAD_BND.SAP__UnitsOfMeasure {
            key UnitCode,
                ISOCode,
                ExternalCode,
                Text,
                DecimalPlaces
        };

    @readonly
    entity ZC_MM_ESLL          as
        projection on ZP_MM_POHEAD_BND.ZC_MM_ESLL {
            key Packno,
            key Introw,
                Extrow,
                Srvpos,
                SubPackno,
                Ktext1,
                Menge,
                Meins,
                Brtwr,
                waers
        };


    entity ZP_MM_POHEAD        as
        projection on ZP_MM_POHEAD_BND.ZP_MM_POHEAD {
                confirm_ac,
                Delete_mc,
                Update_mc,
                to_poitem_oc,
            key Ebeln,
                Ernam,
                Lifnr,
                Ekorg,
                name1,
                Waers,
                Bedat,
                zdays,
                Amount,
                Status,
                Email
        };


    entity ZP_MM_POITEM        as
        projection on ZP_MM_POHEAD_BND.ZP_MM_POITEM {
                Delete_mc,
                Update_mc,
            key Ebeln,
            key Ebelp,
                Txz01,
                Type,
                Matnr,
                Werks,
                Menge,
                Meins,
                Packno,
                SubPackno,
                Confirmedqty,
                eindt,
                knumv,
                Discount,
                Taxper,
                Taxval,
                Rate,
                Iamount,
                Total,
                Kposn,
                waers,
                Status
        };


    @readonly
    entity ZC_MM_ESLL_CAP      as
        projection on ZP_MM_POHEAD_BND.ZC_MM_ESLL {
            key Packno,
            key Introw,
                Extrow,
                Srvpos,
                SubPackno,
                Ktext1,
                Menge,
                Meins,
                Brtwr,
                waers
        };

    //ENTITY: Filtered PO Headers (Pending / In-Process)



    
    @readonly
    entity FilteredPOHeaders {
            @sap.label    : ' PO Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order'
        key Ebeln  : String; // PO Number

            @sap.label    : 'Created By'
            @sap.quickinfo: 'User ID of the person who created the Purchase Order'
            Ernam  : String; // Created By

            @sap.label    : 'Vendor Code'
            @sap.quickinfo: 'Unique code assigned to the vendor'
            Lifnr  : String; // Vendor Code

            @sap.label    : 'Vendor Name'
            @sap.quickinfo: 'Full name of the vendor or supplier'
            name1  : String; // Vendor Name

            @sap.label    : 'Purchase Organization'
            @sap.quickinfo: 'Organization responsible for procurement activities'
            Ekorg  : String; // Purchase Org

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Currency used in the Purchase Order (e.g., INR, USD, EUR)'
            Waers  : String; // Currency

            @sap.label    : 'PO Date'
            @sap.quickinfo: 'Date on which the Purchase Order was created'
            Bedat  : Date; // PO Date

            @sap.label    : 'Due Days'
            @sap.quickinfo: 'Number of days until payment or delivery is due'
            zdays  : Integer; // Due Days

            @sap.label    : 'PO Amount'
            @sap.quickinfo: 'Total value of the Purchase Order'
            Amount :Decimal(13, 3); // PO Amount

            @sap.label    : 'Status'
            @sap.quickinfo: 'Current processing state of the Purchase Order (e.g., Pending, In Process)'
            Status : String; // Status (Pending/In Process)
    };

    //ENTITY: Filtered PO Items (For a Selected PO Header)
    @readonly
    entity FilteredPOItems {
            @sap.label    : 'PO Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order'
        key Ebeln        : String; // PO Number

            @sap.label    : 'PO Item Number'
            @sap.quickinfo: 'Sequential number of the item within the Purchase Order'
        key Ebelp        : String; // PO Item Number

            @sap.label    : 'Item Description'
            @sap.quickinfo: 'Text description of the material or service'
            Txz01        : String; // Item Description

            @sap.label    : 'Material Type'
            @sap.quickinfo: 'Category of the material (e.g., raw material, finished product)'
            Type         : String; // Material Type

            @sap.label    : 'Material Number'
            @sap.quickinfo: 'Unique identifier for the material in the system'
            Matnr        : String; // Material Number

            @sap.label    : 'Plant'
            @sap.quickinfo: 'Plant or location where the material is required or delivered'
            Werks        : String; // Plant

            @sap.label    : 'Quantity'
            @sap.quickinfo: 'Ordered quantity of the item'
            Menge        : Decimal; // Quantity

            @sap.label    : 'Unit of Measure'
            @sap.quickinfo: 'Measurement unit for the ordered quantity (e.g., EA, KG)'
            Meins        : String; // Unit of Measure

            @sap.label    : 'Package Number'
            @sap.quickinfo: 'Identifier for the package grouping the item'
            Packno       : String; // Package Number

            @sap.label    : 'Sub Package Number'
            @sap.quickinfo: 'Identifier for a sub-package under the main package'
            SubPackno    : String; // Sub Package Number

            @sap.label    : 'Confirmed Quantity'
            @sap.quickinfo: 'Quantity confirmed by the vendor for delivery'
            Confirmedqty : Decimal; // Confirmed Quantity

            @sap.label    : 'Delivery Date'
            @sap.quickinfo: 'Scheduled date of delivery for the item'
            eindt        : String; // Delivery Date

            @sap.label    : 'Pricing Condition'
            @sap.quickinfo: 'Pricing condition record number applicable to this item'
            knumv        : String; // Pricing Condition

            @sap.label    : 'Discount Value'
            @sap.quickinfo: 'Discount amount applied to the item'
            Discount     : Decimal; // Discount Value

            @sap.label    : 'Tax Percentage'
            @sap.quickinfo: 'Applicable tax percentage for the item'
            Taxper       : Decimal; // Tax Percentage

            @sap.label    : 'Tax Amount'
            @sap.quickinfo: 'Calculated tax value based on tax percentage'
            Taxval       : Decimal; // Tax Amount

            @sap.label    : 'Rate per Unit'
            @sap.quickinfo: 'Price of one unit of the material or service'
            Rate         : Decimal; // Rate per Unit

            @sap.label    : 'Item Amount'
            @sap.quickinfo: 'Net amount of the item (before tax and discounts)'
            Iamount      : Decimal; // Item Amount

            @sap.label    : 'Total Amount'
            @sap.quickinfo: 'Final payable amount for the item including tax and discounts'
            Total        : Decimal; // Total Amount

            @sap.label    : 'Account Assignment'
            @sap.quickinfo: 'Account assignment category (e.g., cost center, asset)'
            Kposn        : String; // Account Assignment

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Currency in which the item value is expressed'
            waers        : String; // Currency

            @sap.label    : 'Item Status'
            @sap.quickinfo: 'Current status of the item (e.g., Pending, In Process)'
            Status       : String; // Item Status (Pending/In Process)
    };


    // Action for Multiple PO Items
    action confirmPOItem(poItems: many POItem) returns array of String;

    type POItem {
        Ebeln : String;
        Ebelp : String;
    }

}
