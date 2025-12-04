using ZP_MM_ASNPOHEAD_BNDSampleService as service from '../../srv/AISP_ASN_CREATION';
using from '../../srv/SUPPLIER_SELECTION';
using from '../../srv/external/ZAPI_BUSINESS_PARTNER';

annotate SupplierSelectionService.BusinessPartner with @(
    UI.SelectionFields : [
        Supplier,
        to_Supplier.SupplierName,
        to_Supplier.SupplierAccountGroup,
        to_BusinessPartnerAddress.Country,
        to_BusinessPartnerAddress.CityName,
        CreationDate,
        to_BusinessPartnerAddress.PostalCode
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : Supplier,
        },
        {
            $Type : 'UI.DataField',
            Value : to_Supplier.SupplierName,
        },
        {
            $Type : 'UI.DataField',
            Value : to_BusinessPartnerAddress.Country,
        },
        {
            $Type : 'UI.DataField',
            Value : to_Supplier.to_SupplierPurchasingOrg.PurchasingOrganization,
            Label : 'Purchasing Org',
        },
        {
            $Type : 'UI.DataField',
            Value : to_Supplier.to_SupplierCompany.CompanyCode,
            Label : 'Company Code',
        },
        {
            $Type : 'UI.DataField',
            Value : to_BusinessPartnerAddress.to_EmailAddress.EmailAddress,
            Label : 'EmailAddress',
        },
    ],
    UI.SelectionPresentationVariant #tableView : {
        $Type : 'UI.SelectionPresentationVariantType',
        PresentationVariant : {
            $Type : 'UI.PresentationVariantType',
            Visualizations : [
                '@UI.LineItem',
            ],
        },
        SelectionVariant : {
            $Type : 'UI.SelectionVariantType',
            SelectOptions : [
            ],
        },
        Text : 'Table View',
    },
    UI.LineItem #tableView : [
    ],
);

annotate SupplierSelectionService.BusinessPartner with {
    Supplier @Common.Label : 'Supplier Number'
};

annotate SupplierSelectionService.Supplier with {
    SupplierName @Common.Label : 'Supplier Name'
};

annotate SupplierSelectionService.Supplier with {
    SupplierAccountGroup @Common.Label : 'Account Group'
};

annotate SupplierSelectionService.BusinessPartnerAddress with {
    Country @Common.Label : 'Country'
};

annotate SupplierSelectionService.BusinessPartnerAddress with {
    CityName @Common.Label : 'City'
};

annotate SupplierSelectionService.BusinessPartnerAddress with {
    CountyCode @Common.Label : 'to_BusinessPartnerAddress/CountyCode'
};

annotate SupplierSelectionService.BusinessPartner with {
    BusinessPartnerIsBlocked @Common.Label : 'BusinessPartnerIsBlocked'
};

annotate SupplierSelectionService.BusinessPartner with {
    CreationDate @Common.Label : 'Created On'
};

annotate SupplierSelectionService.BusinessPartner with {
    CreationTime @Common.Label : 'CreationTime'
};

annotate SupplierSelectionService.BusinessPartner with {
    Language @Common.Label : 'Language'
};

annotate SupplierSelectionService.BusinessPartner with {
    SearchTerm1 @Common.Label : 'SearchTerm1'
};

annotate SupplierSelectionService.BusinessPartner with {
    SearchTerm2 @Common.Label : 'SearchTerm2'
};

annotate SupplierSelectionService.BusinessPartnerAddress with {
    CityCode @Common.Label : 'to_BusinessPartnerAddress/CityCode'
};

annotate SupplierSelectionService.BusinessPartnerAddress with {
    Region @Common.Label : 'to_BusinessPartnerAddress/Region'
};

annotate SupplierSelectionService.BusinessPartnerAddress with {
    PostalCode @Common.Label : 'Postal Code'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    BankAccountName @Common.Label : 'to_BusinessPartnerBank/BankAccountName'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    BankAccount @Common.Label : 'to_BusinessPartnerBank/BankAccount'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    BankAccountHolderName @Common.Label : 'to_BusinessPartnerBank/BankAccountHolderName'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    BankControlKey @Common.Label : 'to_BusinessPartnerBank/BankControlKey'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    BankCountryKey @Common.Label : 'to_BusinessPartnerBank/BankCountryKey'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    BankName @Common.Label : 'to_BusinessPartnerBank/BankName'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    BankNumber @Common.Label : 'to_BusinessPartnerBank/BankNumber'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    IBAN @Common.Label : 'to_BusinessPartnerBank/IBAN'
};

annotate SupplierSelectionService.BusinessPartnerBank with {
    SWIFTCode @Common.Label : 'to_BusinessPartnerBank/SWIFTCode'
};

annotate SupplierSelectionService.Supplier with {
    PurchasingIsBlocked @Common.Label : 'to_Supplier/PurchasingIsBlocked'
};

annotate SupplierSelectionService.Supplier with {
    PostingIsBlocked @Common.Label : 'to_Supplier/PostingIsBlocked'
};

annotate SupplierSelectionService.Supplier with {
    PaymentIsBlockedForSupplier @Common.Label : 'to_Supplier/PaymentIsBlockedForSupplier'
};

annotate SupplierSelectionService.Supplier with {
    SupplierFullName @Common.Label : 'to_Supplier/SupplierFullName'
};

annotate SupplierSelectionService.Supplier with {
    TaxNumber1 @Common.Label : 'to_Supplier/TaxNumber1'
};

annotate SupplierSelectionService.Supplier with {
    TaxNumber2 @Common.Label : 'to_Supplier/TaxNumber2'
};

annotate SupplierSelectionService.Supplier with {
    VATRegistration @Common.Label : 'to_Supplier/VATRegistration'
};

annotate SupplierSelectionService.Supplier with {
    TaxNumber4 @Common.Label : 'to_Supplier/TaxNumber4'
};

annotate SupplierSelectionService.Supplier with {
    TaxNumber3 @Common.Label : 'to_Supplier/TaxNumber3'
};

