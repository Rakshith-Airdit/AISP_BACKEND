using ZP_MM_ASNPOHEAD_BND from './external/ZP_MM_ASNPOHEAD_BND.cds';

service ZP_MM_ASNPOHEAD_BNDSampleService {
    @readonly
    entity SAP__Currencies     as
        projection on ZP_MM_ASNPOHEAD_BND.SAP__Currencies {
            key CurrencyCode,
                ISOCode,
                Text,
                DecimalPlaces
        };

    @readonly
    entity SAP__UnitsOfMeasure as
        projection on ZP_MM_ASNPOHEAD_BND.SAP__UnitsOfMeasure {
            key UnitCode,
                ISOCode,
                ExternalCode,
                Text,
                DecimalPlaces
        };

    @readonly
    entity ZP_MM_ASNPOHEAD     as
        projection on ZP_MM_ASNPOHEAD_BND.ZP_MM_ASNPOHEAD {
                Delete_mc,
                Update_mc,
                Amount,
                to_poasnitem_oc,
            key Ebeln,
                Ernam,
                Lifnr,
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
                Ekorg,
                Ekgrp,
                Waers,
                Bedat,
                Status
        };

    @readonly
    entity ZP_MM_ASNPOITEM     as
        projection on ZP_MM_ASNPOHEAD_BND.ZP_MM_ASNPOITEM {
                Delete_mc,
                Update_mc,
                Discount,
                to_shipheaddet_oc,
            key Ebeln,
            key Ebelp,
                Txz01,
                Matnr,
                Werks,
                Menge,
                Pendingqty,
                Deliveryqty,
                Taxper,
                Taxval,
                Rate,
                Total,
                Meins,
                Netpr,
                Netwr,
                waers,
                Lgort,
                Status,
                Asnstatus
        };

    @readonly
    entity ZP_MM_SHIPHEAD      as
        projection on ZP_MM_ASNPOHEAD_BND.ZP_MM_SHIPHEAD {
                Delete_mc,
                Update_mc,
            key Vbeln,
            key ebeln,
            key ebelp,
                Ernam,
                Wadat,
                Tddat,
                Lfdat,
                Bolnr,
                Deliverydate,
                Traid,
                Ebtyp,
                Eindt,
                Lpein,
                Erdat,
                Ezeit,
                Menge,
                Meins,
                Dabmg,
                Estkz,
                Loekz,
                Kzdis,
                Xblnr,
                Vbelp,
                Mprof,
                Ematn,
                Mahnz,
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
                waers,
                ExpectedValue,
                SupplierConfNo,
                SupplierConfItem,
                Dataaging,
                FshSallocQty,
                TmsRefUuid,
                Erzet,
                Bzirk,
                Vstel,
                Vkorg,
                Lfart,
                Autlf,
                Kzazu,
                Lddat,
                Kodat,
                Lifnr,
                Traty,
                Cmfre,
                Cmngv,
                Xabln,
                Bldat,
                WadatIst,
                Trspg,
                Tpsid,
                Lifex,
                Ternr,
                KalsmCh,
                Klief,
                Kalsp,
                Knump,
                Netwr,
                Aulwe,
                Werks,
                Lcnum,
                Abssc,
                Kouhr,
                Tduhr,
                Lduhr,
                Wauhr,
                Lgtor,
                Lgbzo,
                Akwae,
                Akkur,
                Akprz,
                Proli,
                Handle,
                Tsegfl,
                Tsegtp,
                Tzonis,
                Tzonrc,
                ContDg,
                Verursys,
                Kzwab,
                Tcode,
                Vsart,
                Trmtyp,
                Sdabw,
                Vbund,
                Xwoff,
                Dirta,
                Prvbe,
                Folar,
                Podat,
                Potim,
                Vganz,
                SpeLoekz,
                SpeLocSeq,
                SpeAccAppSts,
                SpeShpInfSts,
                SpeRetCanc,
                SpeWauhrIst,
                SpeWazoneIst,
                SpeRevVlstk,
                SpeLeScenario,
                SpeOrigSys,
                SpeChngSys,
                SpeGeoroute,
                SpeGeorouteind,
                SpeCarrierInd,
                SpeGtsRel,
                SpeGtsRtCde,
                SpeRelTmstmp,
                SpeUnitSystem,
                SpeInvBfrGi,
                SpeQiStatus,
                SpeRedInd,
                Sakes,
                SpeLifexType,
                SpeTtype,
                SpeProNumber,
                LocGuid,
                SpeBillingInd,
                PrinterProfile,
                MsrActive,
                Prtnr,
                StgeLocChange,
                TmCtrlKey,
                DlvSplitInitia,
                DlvVersion,
                GtsVorpa,
                GtsVornu,
                GtsExpvz,
                GtsPorti,
                ItmExpvz,
                ItmStgbe,
                ItmKzgbe,
                ItmVygid,
                ItmIever,
                ItmStabe,
                ItmKzabe,
                Handoverloc,
                Handovertzone,
                Bestk,
                Cmpsc,
                Cmpsd,
                Cmpsi,
                Cmpsj,
                Cmpsk,
                CmpsCm,
                CmpsTe,
                Cmgst,
                Fkivk,
                Fkstk,
                Gbstk,
                Hdall,
                Hdals,
                Koquk,
                Kostk,
                Lvstk,
                Pdstk,
                Pkstk,
                SpeTmpid,
                Spstg,
                Trsta,
                Uvall,
                Uvals,
                Uvfak,
                Uvfas,
                Uvpak,
                Uvpas,
                Uvpik,
                Uvpis,
                Uvvlk,
                Uvvls,
                Uvwak,
                Uvwas,
                Vestk,
                Vlstk,
                Wbstk,
                Uvk01,
                Uvk02,
                Uvk03,
                Uvk04,
                Uvk05,
                Uvs01,
                Uvs02,
                Uvs03,
                Uvs04,
                Uvs05,
                TotalPcsta,
                TotalDgsta,
                TotalSdssta,
                TotalArcStatus,
                IcoFkivk,
                TotalEmcst,
                TotalSlcst,
                TotalLccst,
                ExtBusSystId,
                SitkzDb,
                TmAdvShipRecv,
                TmWhseExec,
                TmWhseBlock,
                LglcLicInd,
                CorrInd,
                DummyDeliveryInclEewPs,
                xbev1xluleinh,
                xbev1xrpfaess,
                xbev1xrpkist,
                xbev1xrpcont,
                xbev1xrpsonst,
                xbev1xrpflgnr,
                IdtCurEvtloc,
                IdtCurEvtqua,
                IdtCurEvttst,
                IdtCurEstloc,
                IdtCurEstqua,
                IdtCurEsttst,
                IdtCurWrkqua,
                IdtPreEvtloc,
                IdtPreEvtqua,
                IdtPreEvttst,
                IdtPreEstloc,
                IdtPreEstqua,
                IdtPreEsttst,
                IdtPreWrkqua,
                IdtRefEstloc,
                IdtRefEstqua,
                IdtRefEsttst,
                IdtFirmLfdat,
                IdtDocnum,
                BorgrGrp,
                Kbnkz,
                FshTransaction,
                FshVasLastItem,
                FshVasCg,
                RfmPsstGroup,
                ExtActDateTocd,
                ExtPlanDateTocd,
                ExtTzoneTocd,
                IntActDateTocd,
                IntPlanDateTocd,
                IntTzoneTocd,
                JitRlvnt
        };

    type ShipmentData  : {
        trackingNumber        : String;
        originLocation        : String;
        destinationLocation   : String;
        scheduledShipmentDate : Date;
        expectedDeliveryDate  : Date;
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
        Ebeln       : String;
        Ebelp       : String;
        Txz01       : String;
        Matnr       : String;
        Menge       : Decimal;
        Pendingqty  : Decimal;
        Deliveryqty : Decimal;
        Meins       : String
    }

    entity ASN_CREATION_HEAD {
            @sap.label    : 'PO Number'
            @sap.quickinfo: 'Unique identifier of the Purchase Order linked to the ASN'
        key Ebeln           : String;

            @sap.label    : 'Delete Marker'
            @sap.quickinfo: 'Indicator showing whether the ASN record is marked for deletion'
            Delete_mc       : Boolean;

            @sap.label    : 'Update Marker'
            @sap.quickinfo: 'Indicator showing whether the ASN record has been updated'
            Update_mc       : Boolean;

            @sap.label    : 'ASN Amount'
            @sap.quickinfo: 'Total value of the Advanced Shipping Notification'
            Amount          : Integer;

            @sap.label    : 'ASN Items'
            @sap.quickinfo: 'Navigation link to related ASN item details'
            to_poasnitem_oc : Boolean;

            @sap.label    : 'Created By'
            @sap.quickinfo: 'User ID of the person who created the ASN'
            Ernam           : String;

            @sap.label    : 'Vendor Code'
            @sap.quickinfo: 'Unique code assigned to the vendor sending the ASN'
            Lifnr           : String;

            @sap.label    : 'Vendor Name'
            @sap.quickinfo: 'Full name of the vendor or supplier'
            name1           : String;

            @sap.label    : 'Street'
            @sap.quickinfo: 'Street address of the vendor or plant'
            stras           : String;

            @sap.label    : 'City'
            @sap.quickinfo: 'City where the vendor or plant is located'
            ort01           : String;

            @sap.label    : 'Postal Code'
            @sap.quickinfo: 'Postal or ZIP code of the vendor or plant address'
            pstlz           : String;

            @sap.label    : 'Plant Code'
            @sap.quickinfo: 'Identifier of the plant related to the ASN'
            werks           : String;

            @sap.label    : 'Plant Name'
            @sap.quickinfo: 'Name of the plant related to the ASN'
            Plantname       : String;

            @sap.label    : 'Shipping Point 1'
            @sap.quickinfo: 'First shipping point for dispatching goods'
            Ship1           : String;

            @sap.label    : 'Ship From'
            @sap.quickinfo: 'Origin location from where the goods are shipped'
            Shipfrom        : String;

            @sap.label    : 'Shipping Point 2'
            @sap.quickinfo: 'Second shipping point for dispatching goods'
            Ship2           : String;

            @sap.label    : 'Shipping Point 3'
            @sap.quickinfo: 'Third shipping point for dispatching goods'
            Ship3           : String;

            @sap.label    : 'Ship To'
            @sap.quickinfo: 'Destination location where the goods are shipped to'
            Shipto          : String;

            @sap.label    : 'Purchase Organization'
            @sap.quickinfo: 'Organization responsible for procurement'
            Ekorg           : String;

            @sap.label    : 'Purchasing Group'
            @sap.quickinfo: 'Purchasing group handling the ASN/PO'
            Ekgrp           : String;

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Currency used in the ASN transaction (e.g., INR, USD, EUR)'
            Waers           : String;

            @sap.label    : 'ASN Date'
            @sap.quickinfo: 'Date when the ASN was created'
            Bedat           : Date;

            @sap.label    : 'ASN Status'
            @sap.quickinfo: 'Current processing status of the ASN (e.g., Pending, In Process)'
            Status          : String;
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
            @sap.quickinfo: 'List of shipment-related information associated with the ASN'
            ShipmentDetails  : array of ShipmentData;

            @sap.label    : 'Transport Details'
            @sap.quickinfo: 'List of transport-related information associated with the ASN'
            TransportDetails : array of transportData;

            @sap.label    : 'Created At'
            @sap.quickinfo: 'Date and time when the ASN shipment and transport data record was created'
            createdAt        : Date;

            @sap.label    : 'Updated At'
            @sap.quickinfo: 'Date and time when the ASN shipment and transport data record was last updated'
            updatedAt        : Date;
    }

    //ASN Creation Action
    // action createASN(asnItems: many ASNItem, DeliveryDate: Date) returns array of String;
    action createASN(asnHead: array of ASNHead, asnItems: many ASNItem, DeliveryDate: Date) returns array of String;
}
