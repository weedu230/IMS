const inventoryFacade = require('../services/inventory.facade');
const { sendSuccess } = require('../utils/response');

const getOverview = async (req, res, next) => {
  try {
    return sendSuccess(res, await inventoryFacade.getOverview(req.query), 'Inventory overview generated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview };