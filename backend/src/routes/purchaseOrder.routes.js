const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const POController = require('../controllers/purchaseOrder.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ROLES }    = require('../utils/constants');

const MGR = [ROLES.ADMIN, ROLES.MANAGER];
const STF = [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF];

router.get('/',    authenticate, POController.getAll.bind(POController));
router.get('/:id', authenticate, POController.getById.bind(POController));

router.post('/', authenticate, authorize(...MGR),
  [
    body('supplier_id').isInt({ min: 1 }).withMessage('supplier_id required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.product_id').isInt({ min: 1 }),
    body('items.*.warehouse_id').isInt({ min: 1 }),
    body('items.*.qty_ordered').isInt({ min: 1 }),
    body('items.*.unit_cost').isFloat({ min: 0 }),
    body('expected_date').optional().isDate(),
  ],
  validate,
  POController.create.bind(POController)
);

router.put('/:id/submit',  authenticate, authorize(...MGR), POController.submit.bind(POController));
router.put('/:id/approve', authenticate, authorize(...MGR), POController.approve.bind(POController));
router.put('/:id/cancel',  authenticate, authorize(...MGR), POController.cancel.bind(POController));

router.put('/:id/receive', authenticate, authorize(...STF),
  [
    body('items').isArray({ min: 1 }).withMessage('items array required'),
    body('items.*.po_item_id').isInt({ min: 1 }),
    body('items.*.qty_received').isInt({ min: 1 }),
  ],
  validate,
  POController.receiveGoods.bind(POController)
);

module.exports = router;
