using { Procurement } from '../db/schema';
 
service GlobalMailService {
  entity GlobalMailConfig as projection on Procurement.GlobalMailConfig;
}