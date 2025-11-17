// using ZP_AISP_NPOVIM_HEAD_BND from './external/ZP_AISP_NPOVIM_HEAD_BND.cds';

using {VIM.MasterTable} from '../db/MasterTable';

service NON_PO_VIM_OCR_CUSTOMER_SIDE {
    entity NPoVimHead                 as projection on MasterTable.NPoVimHead;
    entity CODERHEAD                  as projection on MasterTable.NPoVimHead;
    entity RejectedTabForIU           as projection on MasterTable.NPoVimHead;
    entity ApprovedTabForFinalIU      as projection on MasterTable.NPoVimHead;
    entity PendingTabForInternalUsers as projection on MasterTable.NPoVimHead;
    entity NPoVimItem                 as projection on MasterTable.NPoVimItem;
    entity VIM_NPO_APPROVAL_LOGS      as projection on MasterTable.VIM_NPO_APPROVAL_LOGS;
    entity NPoVimAttachments          as projection on MasterTable.NPoVimAttachments;

    entity SourceType {
        key SOURCE_TYPE : String;
    }

    action PostNPOVimData(action: String,
                          REQUEST_NO: Integer,
                          NPoVimhead: many NPoVimHead,
                          NPoVimitem: many NPoVimItem,
                          Attachment: many NPoVimAttachments) returns String;


}
