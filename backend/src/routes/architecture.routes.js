const express = require('express');
const router = express.Router();
const architectureController = require('../controllers/architecture.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.get(
  '/uml',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  architectureController.getUml
);

module.exports = router;