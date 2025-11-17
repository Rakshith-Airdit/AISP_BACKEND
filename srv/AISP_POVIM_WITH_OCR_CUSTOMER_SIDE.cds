using {Procurement} from '../db/schema';

service PO_VIM_WITH_OCR_CUSTOMER_SIDE {
    entity VIM_PO_OCR_HEAD       as projection on Procurement.VIM_PO_OCR_HEAD;
    entity VIM_PO_OCR_ITEM       as projection on Procurement.VIM_PO_OCR_ITEM;
    entity Attachment_PO_VIM_OCR as projection on Procurement.Attachment_PO_VIM_OCR;
    entity PendingTab            as projection on Procurement.VIM_PO_OCR_HEAD;
    entity ApprovedTab           as projection on Procurement.VIM_PO_OCR_HEAD;
    entity RejectedTab           as projection on Procurement.VIM_PO_OCR_HEAD;

    //for ABAP GET API TO STORE DATA IN DB FIRST

    action PostPOVimDatawithOCR(action: String,
                                REQUEST_NO: Integer,
                                PoVimhead: many VIM_PO_OCR_HEAD,
                                PoVimitem: many VIM_PO_OCR_ITEM,
                                Attachment: many Attachment_PO_VIM_OCR) returns String;
}
