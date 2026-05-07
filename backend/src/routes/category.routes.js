const express    = require('express');
const { body }   = require('express-validator');
const router     = express.Router();
const { makeCrudController } = require('../controllers/crud.controller');
const categoryService        = require('../services/category.service');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }           = require('../middleware/validate');
const { ROLES }              = require('../utils/constants');

const ctrl = makeCrudController(categoryService);
const RW   = [ROLES.ADMIN, ROLES.MANAGER];
const auth = authenticate;

router.get('/',    auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/',   auth, authorize(...RW),
  [body('category_name').trim().notEmpty().withMessage('Category name required')],
  validate, ctrl.create);
router.put('/:id', auth, authorize(...RW),
  [body('category_name').optional().trim().notEmpty()],
  validate, ctrl.update);
router.delete('/:id', auth, authorize(ROLES.ADMIN), ctrl.deactivate);

module.exports = router;
