//cds for manual draft enablement with button
using {Procurement} from '../db/schema';
using {Procurement.SupplierProfileDetails} from '../db/schema';
service Notification {
    entity Notification as projection on Procurement.Notifications;
    
}

service SupplierDetails {
    entity SupplierDetails as projection on SupplierProfileDetails {
        SUPPLIER_CODE,
        SupplierName,
        Email,
        Country
        // VendorType as SupplierGroup,
        //Address[0].Country           
    };
    

}
