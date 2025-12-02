//cds for manual draft enablement with button
using {Procurement} from '../db/schema';
using {Procurement.SupplierProfileDetails} from '../db/schema';

service Notification {
    entity Notification as projection on Procurement.Notifications;
    entity SendEmail {
     Email: String;
     Title : String;
     NotificationType: String;
     SupplierName : String;
     Body : LargeString;

}
    entity SendWhatsapp{
    Whatsapp: Int64;
    Title : String;
    NotificationType: String;
    SupplierName : String;
    Body : LargeString;
    }
 
}

service SupplierDetails {
    entity SupplierDetails as
        projection on SupplierProfileDetails {
            key SUPPLIER_CODE,
                SupplierName,
                Email,
                Country
        // VendorType as SupplierGroup,
        //Address[0].Country           
    };


    

}
