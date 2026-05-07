const express                     = require('express');
const { body }                    = require('express-validator');
const router                      = express.Router();
const AuthController              = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/validate');
const { ROLES }                   = require('../utils/constants');

// POST /api/v1/auth/register  — admin / manager only
router.post('/register',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Must contain a number'),
    body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role'),
    body('warehouse_id').optional().isInt({ min: 1 }),
  ],
  validate,
  AuthController.register.bind(AuthController)
);

// POST /api/v1/auth/login  — public
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  AuthController.login.bind(AuthController)
);

// GET /api/v1/auth/me
router.get('/me', authenticate, AuthController.getMe.bind(AuthController));

// PATCH /api/v1/auth/change-password
router.patch('/change-password',
  authenticate,
  [
    body('current_password').notEmpty().withMessage('Current password required'),
    body('new_password')
      .isLength({ min: 8 }).withMessage('Min 8 characters')
      .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Must contain a number'),
  ],
  validate,
  AuthController.changePassword.bind(AuthController)
);

module.exports = router;
