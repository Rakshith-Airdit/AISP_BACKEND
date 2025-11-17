using {Procurement.SUPPLIER_PROFILE} from '../db/schema';
using {Procurement.SUPPLIER_PROFILE_ATTACHMENT} from '../db/schema';
using {Procurement.SUPPLIER_PROFILE_ADDRESS} from '../db/schema';
using {Procurement.SUPPLIER_PROFILE_BANK} from '../db/schema';
using {Procurement.SUPPLIER_PROFILE_PODUCTS} from '../db/schema';
using {Procurement.SUPPLIER_PROFILE_OPERATIONAL_CAPACITY} from '../db/schema';
using {Procurement.SUPPLIER_PROFILE_DYNAMIC_FIELD} from '../db/schema';

service SupplierProfile {

   
    entity profileDetails as projection on SUPPLIER_PROFILE {
        *,
        Address,              
        Bank,                 
        Products,             
        OperationalCapacity,  
        Attachments           
    };
    
    entity supplierProfileAttatchment       as projection on SUPPLIER_PROFILE_ATTACHMENT { * };
    entity supplierProfileAddress           as projection on SUPPLIER_PROFILE_ADDRESS { * };
    entity supplierProfileBank              as projection on SUPPLIER_PROFILE_BANK { * };
    entity supplierProfileProducts          as projection on SUPPLIER_PROFILE_PODUCTS { * };
    entity supplierProfileOperationalCapacitiy as projection on SUPPLIER_PROFILE_OPERATIONAL_CAPACITY { * };
    entity supplierDynamicFields as projection on SUPPLIER_PROFILE_DYNAMIC_FIELD{*}
}