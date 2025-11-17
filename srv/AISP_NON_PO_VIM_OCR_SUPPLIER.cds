// using ZP_AISP_NPOVIM_HEAD_BND from './external/ZP_AISP_NPOVIM_HEAD_BND.cds';

using {VIM.MasterTable} from '../db/MasterTable';

//Supplier will upload invoice and send for Approval.

service NON_PO_VIM_OCR_SUPPLIER_SIDE {
    entity NPoVimHead        as projection on MasterTable.NPoVimHead;
    entity NPoVimHeadList    as projection on MasterTable.NPoVimHead;
    entity NPoVimItem        as projection on MasterTable.NPoVimItem;
    entity NPoVimAttachments as projection on MasterTable.NPoVimAttachments;

    entity VENDOR_STATUS_F4HELP {
        key VENDOR_STATUS :String;
    }


    action PostNPOVimData(action : String,
                          REQUEST_NO : Integer,
                          NPoVimhead : many NPoVimHead,
                          NPoVimitem : many NPoVimItem,
                          Attachment : many NPoVimAttachments) returns String;





}
