const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const { makeCrudController } = require('../controllers/crud.controller');
const supplierService        = require('../services/supplier.service');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ROLES }    = require('../utils/constants');

const ctrl = makeCrudController(supplierService);
const RW   = [ROLES.ADMIN, ROLES.MANAGER];

router.get('/',    authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/',   authenticate, authorize(...RW),
  [body('company_name').trim().notEmpty().withMessage('Company name required'),
   body('email').optional().isEmail(),
   body('lead_time_days').optional().isInt({ min: 0 })],
  validate, ctrl.create);
router.put('/:id', authenticate, authorize(...RW),
  [body('email').optional().isEmail()],
  validate, ctrl.update);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), ctrl.deactivate);

module.exports = router;
