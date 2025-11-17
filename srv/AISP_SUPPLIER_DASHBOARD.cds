using ZC_AISP_BUSI_DASH_BND from './external/ZC_AISP_BUSI_DASH_BND.cds';

service ZC_AISP_BUSI_DASH_BNDSampleService {
    @readonly
    entity ZC_AISP_BD_MY_BUSINESS as projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_MY_BUSINESS
    {        key p_vendorcode     }    
;
    @readonly
    entity ZC_AISP_BD_MY_BUSINESSSet as projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_MY_BUSINESSSet
    {        key p_vendorcode, key VendorCode, PoValue_Y2D, PoValue_Jan, PoValue_Feb, PoValue_Mar, PoValue_Apr, PoValue_May, PoValue_Jun, PoValue_Jul, PoValue_Aug, PoValue_Sep, PoValue_Oct, PoValue_Nov, PoValue_Dec, TotalAmountCurrency     }    
;
    @readonly
    entity ZC_AISP_BD_MY_COMMITMENTS as projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_MY_COMMITMENTS
    {        key p_vendorcode     }    
;
    @readonly
    entity ZC_AISP_BD_MY_COMMITMENTSSet as projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_MY_COMMITMENTSSet
    {        key p_vendorcode, key VendorCode, PurchaseContract, ValidityStartDate, ValidityEndDate, DaysPendingToExpire, TotalValue, TotalValueCurrency, TotalOrderedQuantity, TotalOrderedQuantityUnit     }    
;
    @readonly
    entity ZC_AISP_BD_TOP5_OPEN_PO as projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_TOP5_OPEN_PO
    {        key p_vendorcode     }    
;
    @readonly
    entity SAP__Currencies as projection on ZC_AISP_BUSI_DASH_BND.SAP__Currencies
    {        key CurrencyCode, ISOCode, Text, DecimalPlaces     }    
;
    @readonly
    entity SAP__UnitsOfMeasure as projection on ZC_AISP_BUSI_DASH_BND.SAP__UnitsOfMeasure
    {        key UnitCode, ISOCode, ExternalCode, Text, DecimalPlaces     }    
;
}