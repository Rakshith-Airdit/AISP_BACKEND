// using ZP_AISP_POVIM_HEAD_BND from './external/ZP_AISP_POVIM_HEAD_BND.cds';
using {VIM.MasterTable} from '../db/MasterTable';


service POVIM_CUSTOMER_SIDE{

    entity VIMPOHead         as projection on MasterTable.PovimHeader; 
    entity RejectedTab       as projection on MasterTable.PovimHeader;
    entity ApprovedTab       as projection on MasterTable.PovimHeader;
    entity VIMDATA           as projection on MasterTable.PovimHeader; // when approver click need to send REq no .
    entity VIMPOItem         as projection on MasterTable.PovimItem;
    entity VIMAttachment     as projection on MasterTable.Attachment_CompanyProfile;
    entity VIM_APPROVAL_LOGS as projection on MasterTable.VIM_APPROVAL_LOGS;


    // Actions for Posting
    action PostVimData(action : String,
                       REQUEST_NO : Integer,
                       Vimhead : many VIMPOHead,
                       Vimitem : many VIMPOItem,
                       Attachment : many VIMAttachment) returns String;

}
