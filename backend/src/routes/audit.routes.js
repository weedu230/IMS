const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.get('/', authenticate, authorize(ROLES.ADMIN), auditController.getLogs);

module.exports = router;
