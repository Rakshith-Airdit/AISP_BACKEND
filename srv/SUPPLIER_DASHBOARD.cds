using ZC_AISP_BUSI_DASH_BND from './external/ZC_AISP_BUSI_DASH_BND.cds';

service ZC_AISP_BUSI_DASH_BNDSampleService {
    @readonly
    entity BusinessValueTrend    as
        projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_MY_BUSINESS {
            key VendorCode,
                PoValue_Y2D,
                PoValue_Jan,
                PoValue_Feb,
                PoValue_Mar,
                PoValue_Apr,
                PoValue_May,
                PoValue_Jun,
                PoValue_Jul,
                PoValue_Aug,
                PoValue_Sep,
                PoValue_Oct,
                PoValue_Nov,
                PoValue_Dec,
                TotalAmountCurrency
        };

    @readonly
    entity TopOpenPurchaseOrders as
        projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_TOP5_OPEN_PO {
            key VendorCode,
                PoNo,
                TotalAmount,
                TotalAmountCurrency,
                TotalOrderedQuantity,
                TotalOrderedQuantityUnit
        };

    @readonly
    entity TopProducts           as
        projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_TOP5_PRODUCTS {
            key VendorCode,
                MaterialNo,
                MaterialName,
                TotalOrderedQuantity,
                TotalOrderedQuantityUnit,
                TotalAmount,
                TotalAmountCurrency
        };

    @readonly
    entity BusinessCommitments   as
        projection on ZC_AISP_BUSI_DASH_BND.ZC_AISP_BD_MY_COMMITMENTS {
            key VendorCode,
                PurchaseContract,
                ValidityStartDate,
                ValidityEndDate,
                DaysPendingToExpire,
                TotalValue,
                TotalValueCurrency,
                TotalOrderedQuantity,
                TotalOrderedQuantityUnit
        };
}
