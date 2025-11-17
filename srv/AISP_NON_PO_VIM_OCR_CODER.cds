// using ZP_AISP_NPOVIM_HEAD_BND from './external/ZP_AISP_NPOVIM_HEAD_BND.cds';

using {VIM.MasterTable} from '../db/MasterTable';

service NON_PO_VIM_OCR_CODER_SIDE {
    entity NPoVimAttachments as projection on MasterTable.NPoVimAttachments;
    entity CostObjectTypes   as projection on MasterTable.CostObjectTypes;
    entity CostObjects       as projection on MasterTable.CostObjects;
    entity GL_ACCOUNT        as projection on MasterTable.GLAccounts;
    entity NPoVimHead        as projection on MasterTable.NPoVimHead;
    entity CODERHEAD         as projection on MasterTable.NPoVimHead;
    entity RejectedTabForIU  as projection on MasterTable.NPoVimHead;
    entity NPoVimItem        as projection on MasterTable.NPoVimItem;


    entity SupplierNo {
        key SUPPLIER_NUMBER : String;
    }

    entity SourceType {
        key SOURCE_TYPE : String;
    }

    action PostNPOVimData(action: String,
                          REQUEST_NO: Integer,
                          NPoVimhead: many NPoVimHead,
                          NPoVimitem: many NPoVimItem,
                          Attachment: many NPoVimAttachments) returns String;


    type InvoiceItem {
        description : String;
        totalPrice  : String;
        quantity    : String;
    }

    action triggerOCR(fileUrl: String)                        returns {
        totalInvoiceAmount : String;
        items              : array of InvoiceItem;
        status             : String;
        rawJson            : LargeString;
        cgst               : String;
        sgst               : String;
        other              : String;
        igst                : String
    }

}
