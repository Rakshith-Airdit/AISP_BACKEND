const cds = require('@sap/cds');

module.exports = async (srv) => {
    // Using CDS API      
    const BusinessPartnerService = await cds.connect.to("ZAPI_BUSINESS_PARTNER");

    srv.on('READ', 'Supplier', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'SupplierCompany', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'SupplierCompanyText', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'SupplierDunning', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'SupplierPartnerFunc', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'SupplierPurchasingOrg', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'SupplierPurchasingOrgText', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'SupplierText', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'SupplierWithHoldingTax', req => BusinessPartnerService.run(req.query));

    srv.on('READ', 'BusinessPartner', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'BusinessPartnerAddress', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'BusinessPartnerBank', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'BusinessPartnerContact', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'BusinessPartnerRole', req => BusinessPartnerService.run(req.query));
    srv.on('READ', 'BusinessPartnerTaxNumber', req => BusinessPartnerService.run(req.query));

    srv.on('READ', 'EmailAddresses', req => BusinessPartnerService.run(req.query));
}