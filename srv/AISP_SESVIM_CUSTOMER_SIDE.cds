using {Procurement} from '../db/schema';

service SESVIM_CUSTOMER_SIDE {

    entity STATUS_FOR_VIM        as projection on Procurement.STATUS_FOR_VIM;
    entity VENDOE_CODE           as projection on Procurement.VENDOE_CODE;
    entity COMPANY_CODE          as projection on Procurement.COMPANY_CODE;
    entity SESVimHead            as projection on Procurement.SESVimHead;
    entity SESVimItem            as projection on Procurement.SESVimItem;
    entity SESDetails            as projection on Procurement.SESDetails;
    entity SESVimAttachments     as projection on Procurement.SESVimAttachments;
    entity SES_VIM_APPROVAL_LOGS as projection on Procurement.SES_VIM_APPROVAL_LOGS;
    entity REJECTED_TAB          as projection on Procurement.SESVimHead;
    entity PENDING_TAB           as projection on Procurement.SESVimHead;
    entity APPROVED_TAB          as projection on Procurement.SESVimHead;


    action PostSESData(action: String,
                       REQUEST_NO: Integer,
                       SESHead: many SESVimHead,
                       SESItems: many SESVimItem,
                       SESDetails: many SESDetails,
                       SESAttachments: many SESVimAttachments) returns String;


}
