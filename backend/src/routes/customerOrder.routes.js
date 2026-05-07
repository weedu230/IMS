const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const OrderController = require('../controllers/customerOrder.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ROLES, ORDER_STATUS } = require('../utils/constants');

const MGR = [ROLES.ADMIN, ROLES.MANAGER];
const STF = [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF];

// ── Customer routes ──────────────────────────────────────────────────────────
router.get('/customers',     authenticate, OrderController.getAllCustomers.bind(OrderController));
router.get('/customers/:id', authenticate, OrderController.getCustomerById.bind(OrderController));
router.post('/customers',    authenticate, authorize(...MGR),
  [
    body('name').trim().notEmpty(),
    body('email').optional().isEmail(),
    body('credit_limit').optional().isFloat({ min: 0 }),
  ],
  validate, OrderController.createCustomer.bind(OrderController)
);
router.put('/customers/:id', authenticate, authorize(...MGR),
  [body('email').optional().isEmail()],
  validate, OrderController.updateCustomer.bind(OrderController)
);

// ── Order routes ─────────────────────────────────────────────────────────────
router.get('/',    authenticate, OrderController.getAll.bind(OrderController));
router.get('/:id', authenticate, OrderController.getById.bind(OrderController));

router.post('/', authenticate, authorize(...STF),
  [
    body('customer_id').isInt({ min: 1 }),
    body('items').isArray({ min: 1 }),
    body('items.*.product_id').isInt({ min: 1 }),
    body('items.*.warehouse_id').isInt({ min: 1 }),
    body('items.*.qty_ordered').isInt({ min: 1 }),
    body('items.*.unit_price').isFloat({ min: 0 }),
  ],
  validate, OrderController.create.bind(OrderController)
);

router.put('/:id/fulfill', authenticate, authorize(...STF), OrderController.fulfill.bind(OrderController));
router.put('/:id/cancel',  authenticate, authorize(...MGR), OrderController.cancel.bind(OrderController));
router.put('/:id/status',  authenticate, authorize(...MGR),
  [body('status').isIn(Object.values(ORDER_STATUS))],
  validate, OrderController.updateStatus.bind(OrderController)
);

module.exports = router;
