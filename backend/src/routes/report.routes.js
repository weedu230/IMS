const express       = require('express');
const router        = express.Router();
const reportService = require('../services/report.service');
const pdfService    = require('../services/pdf.service');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const { ROLES }     = require('../utils/constants');

const wrap = (fn) => async (req, res, next) => {
  try { return sendSuccess(res, await fn(req.query)); }
  catch (err) { next(err); }
};

router.get('/dashboard',       authenticate, wrap(() => reportService.getDashboard()));
router.get('/stock-valuation', authenticate, wrap(() => reportService.getStockValuation()));
router.get('/low-stock',       authenticate, wrap(() => reportService.getLowStockReport()));
router.get('/stock-movement',  authenticate, wrap((q) => reportService.getStockMovement(q)));
router.get('/purchase-orders', authenticate, wrap((q) => reportService.getPurchaseOrderSummary(q)));
router.get('/sales-summary',   authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  wrap((q) => reportService.getSalesSummary(q))
);

// PDF download endpoints
router.get('/stock-valuation/pdf', authenticate, async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-valuation.pdf');
    await pdfService.generateStockValuationPDF(res);
  } catch (err) { next(err); }
});

router.get('/low-stock/pdf', authenticate, async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=low-stock.pdf');
    await pdfService.generateLowStockPDF(res);
  } catch (err) { next(err); }
});

router.get('/stock-movement/pdf', authenticate, async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-movement.pdf');
    await pdfService.generateStockMovementPDF(res, req.query);
  } catch (err) { next(err); }
});

router.get('/purchase-orders/pdf', authenticate, async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=po-summary.pdf');
    await pdfService.generatePOSummaryPDF(res, req.query);
  } catch (err) { next(err); }
});

router.get('/sales-summary/pdf', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-summary.pdf');
    await pdfService.generateSalesSummaryPDF(res, req.query);
  } catch (err) { next(err); }
});

module.exports = router;
