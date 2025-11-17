
//cds for automatic draft enablement through odata.
// using {Procurement} from '../db/schema';
// @odata.draft.enabled
// service Notification {
//     entity Notification as projection on Procurement.Notifications;
    
// }

//cds for manual draft enablement with button
using {Procurement} from '../db/schema';

service Notification {
    entity Notification as projection on Procurement.Notifications;
    
}