using ZP_AISP_ASNUPDATE_HEAD_BND from './external/ZP_AISP_ASNUPDATE_HEAD_BND.cds';

service ZP_AISP_ASNUPDATE_HEAD_BNDSampleService {
    @readonly
    entity SAP__Currencies        as
        projection on ZP_AISP_ASNUPDATE_HEAD_BND.SAP__Currencies {
            key CurrencyCode,
                ISOCode,
                Text,
                DecimalPlaces
        };

    @readonly
    entity SAP__UnitsOfMeasure    as
        projection on ZP_AISP_ASNUPDATE_HEAD_BND.SAP__UnitsOfMeasure {
            key UnitCode,
                ISOCode,
                ExternalCode,
                Text,
                DecimalPlaces
        };

    @readonly
    entity ZP_AISP_ASNUPDATE_HEAD as
        projection on ZP_AISP_ASNUPDATE_HEAD_BND.ZP_AISP_ASNUPDATE_HEAD {
                Delete_mc,
                Update_mc,
                ASNamount,
                to_asnupditem_oc,
            key Ebeln,
            key vbeln,
                Ernam,
                Lifnr,
                Ekorg,
                Ekgrp,
                Waers,
                Bedat,
                name1,
                stras,
                ort01,
                pstlz,
                werks,
                Plantname,
                Ship1,
                Shipfrom,
                Ship2,
                Ship3,
                Shipto,
                Status,
                GRNStatus
        };

    @readonly
    entity ZP_AISP_ASNUPDATE_ITEM as
        projection on ZP_AISP_ASNUPDATE_HEAD_BND.ZP_AISP_ASNUPDATE_ITEM {
                Delete_mc,
                Update_mc,
            key Ebeln,
            key Vbeln,
            key Ebelp,
                Type,
                matnr,
                txz01,
                posnr,
                Ebtyp,
                Deliverydate,
                Lpein,
                Uzeit,
                Ezeit,
                POquantity,
                Menge,
                Amount,
                Taxper,
                Taxval,
                Rate,
                Discount,
                Total,
                Dabmg,
                wbsta,
                Estkz,
                Kzdis,
                Xblnr,
                Vbelp,
                Mprof,
                meins,
                Mahnz,
                Waers,
                Charg,
                Uecha,
                RefEtens,
                Imwrk,
                VbelnSt,
                VbelpSt,
                Handoverdate,
                Handovertime,
                SgtScat,
                Msgtstmp,
                xcwmxmenge,
                xcwmxdabmg,
                Startdate,
                Enddate,
                Serviceperformer,
                ExpectedValue,
                SupplierConfNo,
                SupplierConfItem,
                Dataaging,
                FshSallocQty,
                Ormng,
                TmsRefUuid
        };

    type ShipmentData  : {
        trackingNumber        : String;
        originLocation        : String;
        destinationLocation   : String;
        scheduledShipmentDate : DateTime;
        expectedDeliveryDate  : DateTime;
        ShipmentWeight        : Integer;
    }

    type transportData : {
        carrierName          : String;
        transportMode        : String;
        driverName           : String;
        driverWhatsappNumber : String;
        vehicleNumber        : String;
    }

    type ASNHead {
        ShipmentDetails  : array of ShipmentData;
        TransportDetails : array of transportData;
    }

    type ASNItem {
        Ebeln        : String; // Purchase Order Number
        Vbeln        : String; // Inbound Delivery
        Ebelp        : String; // Purchase Order Item
        posnr        : String; // Item Number (for ASN)
        Ebtyp        : String; // ASN Type (e.g., LA)
        Deliverydate : Date; // Delivery Date
        Menge        : Decimal; // Quantity
        wbsta        : String; // Status (e.g., A for Active)
        matnr        : String; // Material Number
        meins        : String; // Unit of Measure (e.g., EA)
        POquantity   : String
    }

    entity ASN_UPDATE_HEAD {
            @sap.label    : 'Delete Marker'
            @sap.quickinfo: 'Indicator showing whether the ASN update record is marked for deletion'
            Delete_mc        : Boolean;

            @sap.label    : 'Update Marker'
            @sap.quickinfo: 'Indicator showing whether the ASN update record has been updated'
            Update_mc        : Boolean;

            @sap.label    : 'ASN Amount'
            @sap.quickinfo: 'Total value of the Advanced Shipping Notification'
            ASNamount        : Integer;

            @sap.label    : 'ASN Update Items'
            @sap.quickinfo: 'Navigation link to related ASN update item details'
            to_asnupditem_oc : Boolean;

            @sap.label    : 'PO Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order linked to the ASN'
        key Ebeln            : String;

            @sap.label    : 'Delivery Number'
            @sap.quickinfo: 'Unique identifier of the outbound delivery document linked to the ASN'
        key vbeln            : String;

            @sap.label    : 'Created By'
            @sap.quickinfo: 'User ID of the person who created the ASN update'
            Ernam            : String;

            @sap.label    : 'Vendor Code'
            @sap.quickinfo: 'Unique code assigned to the vendor sending the ASN'
            Lifnr            : String;

            @sap.label    : 'Purchase Organization'
            @sap.quickinfo: 'Organization responsible for procurement'
            Ekorg            : String;

            @sap.label    : 'Purchasing Group'
            @sap.quickinfo: 'Purchasing group handling the ASN/PO'
            Ekgrp            : String;

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Currency used in the ASN transaction (e.g., INR, USD, EUR)'
            Waers            : String;

            @sap.label    : 'ASN Date'
            @sap.quickinfo: 'Date when the ASN update was created'
            Bedat            : String;

            @sap.label    : 'Vendor Name'
            @sap.quickinfo: 'Full name of the vendor or supplier'
            name1            : String;

            @sap.label    : 'Street'
            @sap.quickinfo: 'Street address of the vendor or plant'
            stras            : String;

            @sap.label    : 'City'
            @sap.quickinfo: 'City where the vendor or plant is located'
            ort01            : String;

            @sap.label    : 'Postal Code'
            @sap.quickinfo: 'Postal or ZIP code of the vendor or plant address'
            pstlz            : String;

            @sap.label    : 'Plant Code'
            @sap.quickinfo: 'Identifier of the plant related to the ASN'
            werks            : String;

            @sap.label    : 'Plant Name'
            @sap.quickinfo: 'Name of the plant related to the ASN'
            Plantname        : String;

            @sap.label    : 'Shipping Point 1'
            @sap.quickinfo: 'First shipping point for dispatching goods'
            Ship1            : String;

            @sap.label    : 'Ship From'
            @sap.quickinfo: 'Origin location from where the goods are shipped'
            Shipfrom         : String;

            @sap.label    : 'Shipping Point 2'
            @sap.quickinfo: 'Second shipping point for dispatching goods'
            Ship2            : String;

            @sap.label    : 'Shipping Point 3'
            @sap.quickinfo: 'Third shipping point for dispatching goods'
            Ship3            : String;

            @sap.label    : 'Ship To'
            @sap.quickinfo: 'Destination location where the goods are shipped to'
            Shipto           : String;

            @sap.label    : 'ASN Status'
            @sap.quickinfo: 'Current processing status of the ASN (e.g., Pending, In Process)'
            Status           : String;

            @sap.label    : 'GRN Status'
            @sap.quickinfo: 'Status of the Goods Receipt Note linked to the ASN'
            GRNStatus        : String;
    // ShipmentDetails  : array of ShipmentData;
    // TransportDetails : array of transportData;
    }

    entity ASN_SHIPMENT_AND_TRANSPORT_DATA {
            @sap.label    : 'PO Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order linked to the ASN'
        key Ebeln            : String;

            @sap.label    : 'Delivery Number'
            @sap.quickinfo: 'Unique identifier of the outbound delivery document'
            Vbeln            : String;

            @sap.label    : 'Shipment Details'
            @sap.quickinfo: 'List of shipment-related details linked to the ASN'
            ShipmentDetails  : array of ShipmentData;

            @sap.label    : 'Transport Details'
            @sap.quickinfo: 'List of transport-related details linked to the ASN'
            TransportDetails : array of transportData;

            @sap.label    : 'Created At'
            @sap.quickinfo: 'Date and time when the ASN shipment/transport record was created'
            createdAt        : Date;

            @sap.label    : 'Updated At'
            @sap.quickinfo: 'Date and time when the ASN shipment/transport record was last updated'
            updatedAt        : Date;
    }

    action updateASN(asnHead: array of ASNHead, asnItems: many ASNItem) returns array of String;

    type ASNItems {
        Ebeln : String;
        Vbeln : String;
        Ebelp : String;

    }

    action DeleteASN(asnItems: many ASNItems)                           returns array of String;
}
