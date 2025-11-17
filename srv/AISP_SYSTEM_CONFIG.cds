service admin {


    entity VIM_FORM_CONFIG {
            @sap.label    : 'Configuration ID'
            @sap.quickinfo: 'Unique identifier for the form configuration entry'
        key ID               : UUID;

            @sap.label    : 'Application Name'
            @sap.quickinfo: 'Name of the application where this configuration is applied'
            APPLICATION_NAME : String(50);

            @sap.label    : 'Section'
            @sap.quickinfo: 'Section of the form where this field is placed'
            SECTION          : String(40);

            @sap.label    : 'Technical Field'
            @sap.quickinfo: 'Underlying SAP technical field name mapped from backend'
            TECH_FIELD       : String(40); // SAP field name

            @sap.label    : 'Field Name'
            @sap.quickinfo: 'User-friendly field name used in the CAPM UI form'
            FIELD_NAME       : String(40); // CAPM field name (UI field)

            @sap.label    : 'Visible'
            @sap.quickinfo: 'Indicates whether the field is visible in the UI'
            VISIBLE          : Boolean default true;

            @sap.label    : 'Mandatory'
            @sap.quickinfo: 'Indicates whether the field is mandatory in the form'
            MANDATORY        : Boolean default false;

            @sap.label    : 'Editable'
            @sap.quickinfo: 'Indicates whether the field is editable in the UI'
            EDITABLE         : Boolean default true;
    }


    entity VENDOR_ACCOUNT_GROUP {
            @sap.label    : 'Vendor Account Group Code'
            @sap.quickinfo: 'Unique code representing the vendor account group (e.g., ZV01)'
        key CODE           : String(10); // Vendor Account Group Code (e.g., ZV01)

            @sap.label    : 'Description'
            @sap.quickinfo: 'Description or business meaning of the vendor account group'
            DESCRIPTION    : String(100); // Description of the Vendor Account Group

            @sap.label    : 'Associated Questionnaires'
            @sap.quickinfo: 'Association to questionnaires configured for this vendor account group'
            questionnaires : Association to many RFQ_QUESTION_CONFIG_ENTITY
                                 on questionnaires.ACCOUNT_GROUP = CODE; // Questions associated with Vendor Account Group

            @sap.label    : 'Associated Attachments'
            @sap.quickinfo: 'Association to attachments related to this vendor account group'
            attachments    : Association to many VENDOR_ACCOUNT_GROUP_ATTACHMENT
                                 on attachments.ACCOUNT_GROUP = CODE; // Attachments associated with Vendor Account Group
    }


    entity RFQ_QUESTION_CONFIG_ENTITY {
            @sap.label    : 'Question ID'
            @sap.quickinfo: 'Unique identifier for the RFQ question'
        key QUESTION_ID     : String; // Unique ID for the question

            @sap.label    : 'Account Group'
            @sap.quickinfo: 'Vendor Account Group code (e.g., ZV01) to which this question belongs'
            ACCOUNT_GROUP   : String; // Vendor Account Group code (e.g., ZV01)

            @sap.label    : 'Question Text'
            @sap.quickinfo: 'The text of the RFQ question displayed to the user'
            QUESTION_TEXT   : String; // The question text

            @sap.label    : 'Question Type'
            @sap.quickinfo: 'Type of the question (e.g., Text, Dropdown, Checkbox, Radio Button)'
            QUESTION_TYPE   : String; // Type of question (Text, Dropdown, etc.)

            @sap.label    : 'Mandatory'
            @sap.quickinfo: 'Indicates whether the question is mandatory for the vendor to answer'
            IS_MANDATORY    : Boolean; // Is the question mandatory?

            @sap.label    : 'Dropdown Values'
            @sap.quickinfo: 'Possible values for the dropdown question type, separated by delimiters'
            DROPDOWN_VALUES : String; // Dropdown values if the question type is Dropdown

            @sap.label    : 'Section'
            @sap.quickinfo: 'Logical section where the question is placed (e.g., General Info, Banking Info)'
            SECTION         : String; // Section of the question (e.g., General Info)

            @sap.label    : 'Order'
            @sap.quickinfo: 'Display order of the question within the section'
            ORDER           : Integer; // Order of the question in the list

            @sap.label    : 'Active'
            @sap.quickinfo: 'Indicates whether the question is active and visible to users'
            IS_ACTIVE       : Boolean; // Is the question active?
    }


    entity VENDOR_ACCOUNT_GROUP_ATTACHMENT {
            @sap.label    : 'Document ID'
            @sap.quickinfo: 'Unique identifier of the vendor account group document'
        key DOCUMENT_ID   : String;

            @sap.label    : 'Attachment ID'
            @sap.quickinfo: 'System-generated unique identifier for the attachment (UUID)'
        key ID            : UUID; // Unique ID for the attachment

            @sap.label    : 'Account Group'
            @sap.quickinfo: 'Vendor Account Group code (e.g., ZV01) associated with this attachment'
            ACCOUNT_GROUP : String(10); // Vendor Account Group code (e.g., ZV01)

            @sap.label    : 'File Name'
            @sap.quickinfo: 'Original name of the uploaded document file'
            FILE_NAME     : String(255); // Name of the uploaded document

            @sap.label    : 'File URL'
            @sap.quickinfo: 'URL or storage location where the document is stored'
            FILE_URL      : String(255); // URL to the document (e.g., in Blob Storage)

            @sap.label    : 'Upload Date'
            @sap.quickinfo: 'Date and time when the document was uploaded'
            UPLOAD_DATE   : DateTime; // Timestamp of the upload

            @sap.label    : 'Description'
            @sap.quickinfo: 'Description or additional details about the attachment'
            DESCRIPTION   : String(255); // Description of the attachment
    }


}
