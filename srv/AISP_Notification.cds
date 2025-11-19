//cds for manual draft enablement with button
using {Procurement} from '../db/schema';
using {Procurement.SUPPLIER_PROFILE} from '../db/schema';
service Notification {
    entity Notification as projection on Procurement.Notifications;
    
}

service SupplierDetails {
    entity SupplierDetails as projection on SUPPLIER_PROFILE {
        SUPPLIER_CODE,
        SupplierName,
        Email,
        // VendorType as SupplierGroup,
        Address[0].Country           
    };
    

}
