using {Procurement} from '../db/schema';
using {
    cuid,
    managed
} from '@sap/cds/common';


service CatalogBuyerService {

    // Products entity (supplier-owned)
    entity ProductCatalogItems : cuid, managed {
        key ProductId            : String
            @(cds.on.insert: $uuid)
            @sap.Label     : 'Product ID'
            @sap.quickinfo : 'Unique identifier for the product';

            ProductName          : String(100)
            @sap.Label     : 'Product Name'
            @sap.quickinfo : 'Name of the product';

            CommodityCode        : Integer
            @sap.Label     : 'Commodity Code'
            @sap.quickinfo : 'UNSPSC commodity classification code';

            Category             : String(20)
            @sap.Label     : 'Category'
            @sap.quickinfo : 'Product category classification';

            SearchTerm           : array of String
            @sap.Label     : 'Search Terms'
            @sap.quickinfo : 'Keywords for product search';

            UnitPrice            : Decimal(15, 2)
            @sap.Label     : 'Unit Price'
            @sap.quickinfo : 'Price per unit of the product';

            CurrencyCode         : String(3)
            @sap.Label     : 'Currency Code'
            @sap.quickinfo : 'Currency code for pricing (e.g., USD, EUR)';

            UnitOfMeasure        : String(10)
            @sap.Label     : 'Unit of Measure'
            @sap.quickinfo : 'Measurement unit for the product';

            LeadTimeDays         : Integer
            @sap.Label     : 'Lead Time (Days)'
            @sap.quickinfo : 'Delivery lead time in days';

            PartNumber           : String(50)
            @sap.Label     : 'Part Number'
            @sap.quickinfo : 'Manufacturer part number';

            AdditionalLink       : String(500)
            @sap.Label     : 'Additional Link'
            @sap.quickinfo : 'URL for additional product information';

            ProductDescription   : String(500)
            @sap.Label     : 'Product Description'
            @sap.quickinfo : 'Detailed description of the product';

            ProductImage         : String
            @sap.Label     : 'Product Image'
            @sap.quickinfo : 'Product image URL or base64 data';

            ProductSpecification : String
            @sap.Label     : 'Product Specification'
            @sap.quickinfo : 'PDF specification document';

            SupplierId           : String
            @sap.Label     : 'Supplier ID'
            @sap.quickinfo : 'Identifier of the supplier who created this product';

            isFavorite           : Boolean
            @sap.Label     : 'Is Favorite'
            @sap.quickinfo : 'Indicates if the current user has favorited this product'
    }

    // Buyer Favorites entity (buyer-specific preferences)
    entity BuyerFavorites : cuid, managed {
        key FavoriteId   : String
                           @(cds.on.insert: $uuid)
                           @Core.MediaType: 'text/plain'
                           @sap.Label     : 'Favorite ID'
                           @sap.quickinfo : 'Unique identifier for the favorite entry';

            FavProductId : String
                           @sap.Label     : 'Product ID'
                           @sap.quickinfo : 'Reference to the product ID';

            BuyerId      : String
                           @sap.Label     : 'Buyer ID'
                           @sap.quickinfo : 'Identifier of the buyer who favorited the product';

            Product      : Association to one ProductCatalogItems
                               on Product.ProductId = FavProductId
                           @sap.Label     : 'Product'
                           @sap.quickinfo : 'Reference to the favorited product';
    }

    action addToFavorites(productId: String)      returns {
        success    : Boolean;
        message    : String;
        favoriteId : String;
    };

    action removeFromFavorites(productId: String) returns {
        success : Boolean;
        message : String;
    };

    action toggleFavorite(productId: String)      returns {
        success    : Boolean;
        isFavorite : Boolean;
        message    : String;
    };
}
