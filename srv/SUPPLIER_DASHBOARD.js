const cds = require('@sap/cds');

module.exports = async (srv) => {
  // Using CDS API      
  const ZC_AISP_BUSI_DASH_BND = await cds.connect.to("ZC_AISP_BUSI_DASH_BND");
  srv.on('READ', 'BusinessValueTrend', req => ZC_AISP_BUSI_DASH_BND.run(req.query));
  srv.on('READ', 'TopOpenPurchaseOrders', req => ZC_AISP_BUSI_DASH_BND.run(req.query));
  srv.on('READ', 'TopProducts', req => ZC_AISP_BUSI_DASH_BND.run(req.query));
  srv.on('READ', 'BusinessCommitments', req => ZC_AISP_BUSI_DASH_BND.run(req.query));
}