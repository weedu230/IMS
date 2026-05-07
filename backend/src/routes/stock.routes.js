const express      = require('express');
const { body }     = require('express-validator');
const router       = express.Router();
const StockController = require('../controllers/stock.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ROLES, TXN_TYPE } = require('../utils/constants');

const RW = [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF];

// GET /api/v1/stock                         — all products with totals
router.get('/', authenticate, StockController.getAllLevels.bind(StockController));

// GET /api/v1/stock/alerts/low-stock        — items below reorder level
router.get('/alerts/low-stock', authenticate, StockController.getLowStock.bind(StockController));

// GET /api/v1/stock/transactions            — full transaction ledger
router.get('/transactions', authenticate, StockController.getTransactions.bind(StockController));

// GET /api/v1/stock/product/:productId
router.get('/product/:productId', authenticate, StockController.getByProduct.bind(StockController));

// GET /api/v1/stock/warehouse/:warehouseId
router.get('/warehouse/:warehouseId', authenticate, StockController.getByWarehouse.bind(StockController));

// POST /api/v1/stock/adjust
router.post('/adjust',
  authenticate,
  authorize(...RW),
  [
    body('product_id').isInt({ min: 1 }).withMessage('Valid product_id required'),
    body('warehouse_id').isInt({ min: 1 }).withMessage('Valid warehouse_id required'),
    body('txn_type').isIn(Object.values(TXN_TYPE)).withMessage('Invalid transaction type'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('notes').optional().isString(),
  ],
  validate,
  StockController.adjust.bind(StockController)
);

// POST /api/v1/stock/transfer
router.post('/transfer',
  authenticate,
  authorize(...RW),
  [
    body('product_id').isInt({ min: 1 }),
    body('from_warehouse_id').isInt({ min: 1 }),
    body('to_warehouse_id').isInt({ min: 1 }),
    body('quantity').isInt({ min: 1 }),
    body('notes').optional().isString(),
  ],
  validate,
  StockController.transfer.bind(StockController)
);

module.exports = router;

// POST /api/v1/stock/trigger-reorder  — admin manually triggers the reorder check
router.post('/trigger-reorder',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      const { runReorderCheck } = require('../utils/scheduler');
      const summary = await runReorderCheck();
      const { sendSuccess } = require('../utils/response');
      return sendSuccess(res, summary, `Reorder check complete: ${summary.generated} PO(s) generated`);
    } catch (err) { next(err); }
  }
);
