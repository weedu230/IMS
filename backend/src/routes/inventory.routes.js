const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth');

router.get('/overview', authenticate, inventoryController.getOverview);

module.exports = router;