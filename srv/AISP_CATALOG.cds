using {Procurement} from '../db/schema';

service CatalogService {
    entity ProductCatalogItems          as projection on Procurement.ProductCatalogItems;
    entity ProductCatalogCommodityCodes as projection on Procurement.CommodityCodes;

    entity Currencies {
            @sap.Label    : 'Currency Code'
            @sap.QuickInfo: 'Unique identifier for the currency (ISO 4217 or custom code)'
        key WAERS : String;

            @sap.Label    : 'Long Description'
            @sap.QuickInfo: 'Complete descriptive name of the currency with additional context'
            LTEXT : String;

            @sap.Label    : 'Short Description'
            @sap.QuickInfo: 'Abbreviated name or symbol representation of the currency'
            KTEXT : String;
    }

    entity UnitsOfMeasure {
            @sap.label    : 'Internal UoM'
            @sap.QuickInfo: 'unit-of-measure'
        key UnitCode : String not null;

            // @sap.label: 'ISO code'
            // ISOCode       : String not null;

            // @sap.label: 'Commercial'
            // ExternalCode  : String not null;

            @sap.label: 'Measurement Unit Txt'
            Text     : String(30) not null;

    // @sap.label: 'Decimal Places'
    // DecimalPlaces : Integer;
    };

    function generateProductCatalogTemplate() returns {
        success     : Boolean;
        message     : String;
        downloadUrl : String;
        fileName    : String;
    };

    action   processProductCatalogUpload(fileBuffer: LargeBinary @Core.MediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )                                         returns {
        success : Boolean;
        message : String;
        records : many {
            rowNumber   : Integer;
            productName : String;
            imageUrl    : String;
            specPdfUrl  : String;
            errors      : many String;
        };
    };

    entity ProductCatalogDrafts {
        key ID                   : UUID;

            // Add batch grouping field
            BatchID              : UUID
            @(
                sap.label    : 'Batch ID',
                sap.quickinfo: 'Group identifier for batch submission'
            );

            // Product Information
            ProductName          : String(100)
            @(
                sap.label    : 'Product Name',
                sap.quickinfo: 'Name of the product'
            );

            CommodityCode        : Integer
            @(
                sap.label    : 'Commodity Code',
                sap.quickinfo: 'UNSPSC Commodity Code'
            );

            Category             : String(100)
            @(
                sap.label    : 'Category',
                sap.quickinfo: 'Product category'
            );

            SearchTerm           : array of String
            @(
                sap.label    : 'Search Terms',
                sap.quickinfo: 'Comma separated search keywords'
            );

            // Pricing Information
            UnitPrice            : Decimal(10, 2)
            @(
                sap.label    : 'Unit Price',
                sap.quickinfo: 'Price per unit'
            );

            CurrencyCode         : String(5)
            @(
                sap.label    : 'Currency',
                sap.quickinfo: 'Currency code'
            );

            UnitOfMeasure        : String(10)
            @(
                sap.label    : 'Unit of Measure',
                sap.quickinfo: 'Measurement unit'
            );

            // Product Details
            LeadTimeDays         : Integer
            @(
                sap.label    : 'Lead Time (Days)',
                sap.quickinfo: 'Delivery lead time in days'
            );

            PartNumber           : String(50)
            @(
                sap.label    : 'Part Number',
                sap.quickinfo: 'Manufacturer part number'
            );

            AdditionalLink       : String(500)
            @(
                sap.label    : 'Additional Link',
                sap.quickinfo: 'Product URL or reference link'
            );

            ProductDescription   : String(1000)
            @(
                sap.label    : 'Product Description',
                sap.quickinfo: 'Detailed product description'
            );

            // File Attachments
            ProductImage         : LargeString
            @(
                sap.label    : 'Product Image',
                sap.quickinfo: 'Base64 encoded product image'
            );

            ProductSpecification : LargeString
            @(
                sap.label    : 'Product Specification',
                sap.quickinfo: 'Base64 encoded PDF specification'
            );

            // Status
            DraftStatus          : String(20)
            @(
                sap.label    : 'Draft Status',
                sap.quickinfo: 'Status of the draft item'
            );

            // Timestamps
            CreatedAt            : Timestamp;
            UpdatedAt            : Timestamp;
    }

    // Add this action to your existing service
    action   submitBatch(BatchID: String)     returns {
        total      : Integer;
        successful : Integer;
        failed     : Integer;
        details    : {
            successful : many {
                productName : String;
                productId   : String;
            };
            failed     : many {
                productName : String;
                errors      : array of String;
            };
        };
    };
}
