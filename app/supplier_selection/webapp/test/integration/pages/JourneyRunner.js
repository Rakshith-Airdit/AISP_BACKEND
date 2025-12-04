sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/supplierselection/supplierselection/test/integration/pages/BusinessPartnerList",
	"com/supplierselection/supplierselection/test/integration/pages/BusinessPartnerObjectPage"
], function (JourneyRunner, BusinessPartnerList, BusinessPartnerObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/supplierselection/supplierselection') + '/test/flp.html#app-preview',
        pages: {
			onTheBusinessPartnerList: BusinessPartnerList,
			onTheBusinessPartnerObjectPage: BusinessPartnerObjectPage
        },
        async: true
    });

    return runner;
});

