const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const { makeCrudController } = require('../controllers/crud.controller');
const warehouseService       = require('../services/warehouse.service');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ROLES }    = require('../utils/constants');

const ctrl = makeCrudController(warehouseService);

router.get('/',    authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/',   authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER),
  [body('warehouse_name').trim().notEmpty(),
   body('location').trim().notEmpty(),
   body('capacity').isInt({ min: 0 })],
  validate, ctrl.create);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER),
  [], validate, ctrl.update);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), ctrl.deactivate);

module.exports = router;
