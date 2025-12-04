using {ZAPI_BUSINESS_PARTNER as BusinessPartnerAPI} from './external/ZAPI_BUSINESS_PARTNER';

service SupplierSelectionService {
    entity Supplier                  as projection on BusinessPartnerAPI.A_Supplier;
    entity SupplierCompany           as projection on BusinessPartnerAPI.A_SupplierCompany;
    entity SupplierCompanyText       as projection on BusinessPartnerAPI.A_SupplierCompanyText;
    entity SupplierDunning           as projection on BusinessPartnerAPI.A_SupplierDunning;
    entity SupplierPartnerFunc       as projection on BusinessPartnerAPI.A_SupplierPartnerFunc;
    entity SupplierPurchasingOrg     as projection on BusinessPartnerAPI.A_SupplierPurchasingOrg;
    entity SupplierPurchasingOrgText as projection on BusinessPartnerAPI.A_SupplierPurchasingOrgText;
    entity SupplierText              as projection on BusinessPartnerAPI.A_SupplierText;
    entity SupplierWithHoldingTax    as projection on BusinessPartnerAPI.A_SupplierWithHoldingTax;

    entity BusinessPartner           as projection on BusinessPartnerAPI.A_BusinessPartner;
    entity BusinessPartnerAddress    as projection on BusinessPartnerAPI.A_BusinessPartnerAddress;
    entity BusinessPartnerBank       as projection on BusinessPartnerAPI.A_BusinessPartnerBank;
    entity BusinessPartnerContact    as projection on BusinessPartnerAPI.A_BusinessPartnerContact;
    entity BusinessPartnerRole       as projection on BusinessPartnerAPI.A_BusinessPartnerRole;
    entity BusinessPartnerTaxNumber  as projection on BusinessPartnerAPI.A_BusinessPartnerTaxNumber;

    entity EmailAddresses            as projection on BusinessPartnerAPI.A_AddressEmailAddress;
}
