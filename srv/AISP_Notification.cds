//cds for manual draft enablement with button
using {Procurement} from '../db/schema';

service Notification {
    entity Notification as projection on Procurement.Notifications;
}