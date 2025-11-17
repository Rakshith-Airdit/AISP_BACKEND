using ZP_AISP_PAYMNTMON_HEAD_BND from './external/ZP_AISP_PAYMNTMON_HEAD_BND.cds';

service ZP_AISP_PAYMNTMON_HEAD_BNDSampleService {
    @readonly
    entity ZP_AISP_PAYMENTMON_HEAD as
        projection on ZP_AISP_PAYMNTMON_HEAD_BND.ZP_AISP_PAYMENTMON_HEAD {
            key Belnr,
                //this is unique always   //Ref invoice no
            key Ebeln,
                //this maybe mutiple
                Gjahr,
                Bukrs,
                Bkpfbelnr,
                Bstyp,
                Bsart,
                Bsakz,
                Xblnr,
                Budat,
                Invoiceamt,
                Loekz,
                Statu,
                augdt,
                augbl,
                Paymentstatus,
                Downpymntstatus,
                Aedat,
                Ernam,
                Lastchangedatetime,
                Invy,
                Pincr,
                Dpamt,
                Wrbtr,
                Lponr,
                Invoicepayee,
                Lifnr,
                name1,
                Email,
                Paymentrecpnt,
                Spras,
                POtype,
                Waers
        };


    //CAPM GET ENTITY
    // entity PaymentGet {
    //     key RefinvoiceNumber        : String;
    //         invoiceNumber           : String;
    //     key purchaseOrder           : String;
    //         companyCode             : String;
    //         currency                : String;
    //         downPaymentAmount       : String;
    //         invoiceDate             : String;
    //         downPaymentStatus       : String;
    //         invoiceAmount           : String;
    //         invoicePayee            : String;
    //         localAmount             : String;
    //         paymentDate             : String;
    //         paymentRecipientAddress : String;
    //         paymentRecipientEmail   : String;
    //         paymentRecipientName    : String;
    //         paymentReferenceNumber  : String;
    //         paymentStatus           : String;
    //         purchaseOrderType       : String;
    //         supplierCode            : String;
    //         SupplierOrgName         : String;
    //         supplierEmail           : String;
    // }
    entity PaymentGet {
            @sap.label    : 'Reference Invoice Number'
            @sap.quickinfo: 'Unique reference number of the invoice in the payment process'
        key RefinvoiceNumber        : String;

            @sap.label    : 'Invoice Number'
            @sap.quickinfo: 'Identifier of the invoice document'
            invoiceNumber           : String;

            @sap.label    : 'Purchase Order Number'
            @sap.quickinfo: 'Unique identifier of the purchase order related to this payment'
        key purchaseOrder           : String;

            @sap.label    : 'Company Code'
            @sap.quickinfo: 'Company code responsible for the payment transaction'
            companyCode             : String;

            @sap.label    : 'Currency'
            @sap.quickinfo: 'Transaction currency code (e.g., INR, USD, EUR)'
            currency                : String;

            @sap.label    : 'Down Payment Amount'
            @sap.quickinfo: 'Amount recorded as a down payment against the invoice'
            downPaymentAmount       : String;

            @sap.label    : 'Invoice Date'
            @sap.quickinfo: 'Date on which the invoice was issued'
            invoiceDate             : Date;

            @sap.label    : 'Down Payment Status'
            @sap.quickinfo: 'Current status of the down payment (e.g., Open, Cleared)'
            downPaymentStatus       : String;

            @sap.label    : 'Invoice Amount'
            @sap.quickinfo: 'Total amount specified in the invoice'
            invoiceAmount           : Integer;

            @sap.label    : 'Invoice Payee'
            @sap.quickinfo: 'Party or vendor to whom the invoice is payable'
            invoicePayee            : String;

            @sap.label    : 'Local Amount'
            @sap.quickinfo: 'Invoice amount converted into local currency'
            localAmount             : Integer;

            @sap.label    : 'Payment Date'
            @sap.quickinfo: 'Date when the payment was executed or scheduled'
            paymentDate             : Date;

            @sap.label    : 'Payment Recipient Address'
            @sap.quickinfo: 'Address of the party receiving the payment'
            paymentRecipientAddress : String;

            @sap.label    : 'Payment Recipient Email'
            @sap.quickinfo: 'Email address of the payment recipient'
            paymentRecipientEmail   : String;

            @sap.label    : 'Payment Recipient Name'
            @sap.quickinfo: 'Full name of the person or entity receiving the payment'
            paymentRecipientName    : String;

            @sap.label    : 'Payment Reference Number'
            @sap.quickinfo: 'Reference number for the payment transaction'
            paymentReferenceNumber  : String;

            @sap.label    : 'Payment Status'
            @sap.quickinfo: 'Current status of the payment (e.g., Pending, Completed, Failed)'
            paymentStatus           : String;

            @sap.label    : 'Purchase Order Type'
            @sap.quickinfo: 'Type/category of the purchase order linked to the payment'
            purchaseOrderType       : String;

            @sap.label    : 'Supplier Code'
            @sap.quickinfo: 'Unique identifier of the supplier receiving payment'
            supplierCode            : String;

            @sap.label    : 'Supplier Organization Name'
            @sap.quickinfo: 'Name of the supplier organization'
            SupplierOrgName         : String;

            @sap.label    : 'Supplier Email'
            @sap.quickinfo: 'Email address of the supplier for communication'
            supplierEmail           : String;
    };


    // entity PaymentStatusEntity {
    //     key PAYMENT_STATUS : String;
    // }
    entity PaymentStatusEntity {
            @sap.label    : 'Payment Status'
            @sap.quickinfo: 'Represents the current status of a payment (e.g., Pending, Completed, Failed)'
        key PAYMENT_STATUS : String;
    };


}
