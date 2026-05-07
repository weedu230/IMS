const express       = require('express');
const router        = express.Router();
const reportService = require('../services/report.service');
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

module.exports = router;
