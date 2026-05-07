const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const { makeCrudController } = require('../controllers/crud.controller');
const productService         = require('../services/product.service');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ROLES }    = require('../utils/constants');
const { sendSuccess } = require('../utils/response');

const ctrl = makeCrudController(productService);
const RW   = [ROLES.ADMIN, ROLES.MANAGER];

router.get('/',    authenticate, ctrl.getAll);
router.get('/sku/:sku', authenticate, async (req, res, next) => {
  try {
    const product = await productService.getBySku(req.params.sku);
    return sendSuccess(res, product);
  } catch (err) { next(err); }
});
router.get('/:id', authenticate, ctrl.getById);
router.post('/',   authenticate, authorize(...RW),
  [
    body('name').trim().notEmpty().withMessage('Product name required'),
    body('sku').trim().notEmpty().withMessage('SKU required'),
    body('unit_price').isFloat({ min: 0 }).withMessage('Valid unit price required'),
    body('category_id').optional().isInt({ min: 1 }),
    body('reorder_level').optional().isInt({ min: 0 }),
    body('reorder_qty').optional().isInt({ min: 0 }),
    body('suppliers').optional().isArray(),
  ],
  validate, ctrl.create);
router.put('/:id', authenticate, authorize(...RW),
  [
    body('unit_price').optional().isFloat({ min: 0 }),
    body('reorder_level').optional().isInt({ min: 0 }),
    body('reorder_qty').optional().isInt({ min: 0 }),
  ],
  validate, ctrl.update);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), ctrl.deactivate);

module.exports = router;
