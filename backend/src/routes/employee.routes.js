const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const { makeCrudController } = require('../controllers/crud.controller');
const employeeService        = require('../services/employee.service');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ROLES }    = require('../utils/constants');

const ctrl = makeCrudController(employeeService);

router.get('/',    authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER),
  [body('role').optional().isIn(Object.values(ROLES))], validate, ctrl.update);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), ctrl.deactivate);

// POST /api/v1/employees/:id/reset-password — admin only
router.post('/:id/reset-password', authenticate, authorize(ROLES.ADMIN),
  [
    body('new_password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Must contain a number'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await employeeService.resetPassword(parseInt(req.params.id, 10), req.body.new_password, req.user.emp_id);
      res.json({ success: true, message: result.message });
    } catch (err) { next(err); }
  }
);

module.exports = router;
