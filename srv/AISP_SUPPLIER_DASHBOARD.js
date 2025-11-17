const cds = require('@sap/cds');

module.exports = async (srv) => 
{        
    // Using CDS API      
    const ZC_AISP_BUSI_DASH_BND = await cds.connect.to("ZC_AISP_BUSI_DASH_BND"); 
      srv.on('READ', 'ZC_AISP_BD_MY_BUSINESS', req => ZC_AISP_BUSI_DASH_BND.run(req.query)); 
      srv.on('READ', 'ZC_AISP_BD_MY_BUSINESSSet', req => ZC_AISP_BUSI_DASH_BND.run(req.query)); 
      srv.on('READ', 'ZC_AISP_BD_MY_COMMITMENTS', req => ZC_AISP_BUSI_DASH_BND.run(req.query)); 
      srv.on('READ', 'ZC_AISP_BD_MY_COMMITMENTSSet', req => ZC_AISP_BUSI_DASH_BND.run(req.query)); 
      srv.on('READ', 'ZC_AISP_BD_TOP5_OPEN_PO', req => ZC_AISP_BUSI_DASH_BND.run(req.query)); 
      srv.on('READ', 'SAP__Currencies', req => ZC_AISP_BUSI_DASH_BND.run(req.query)); 
      srv.on('READ', 'SAP__UnitsOfMeasure', req => ZC_AISP_BUSI_DASH_BND.run(req.query)); 
}