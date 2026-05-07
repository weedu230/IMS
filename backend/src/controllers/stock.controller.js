const stockService = require('../services/stock.service');
const { sendSuccess } = require('../utils/response');

class StockController {

  async getAllLevels(req, res, next) {
    try {
      const result = await stockService.getAllStockLevels(req.query);
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getByProduct(req, res, next) {
    try {
      const result = await stockService.getByProduct(req.params.productId);
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getByWarehouse(req, res, next) {
    try {
      const result = await stockService.getByWarehouse(req.params.warehouseId, req.query);
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getLowStock(req, res, next) {
    try {
      const result = await stockService.getLowStock();
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getTransactions(req, res, next) {
    try {
      const result = await stockService.getTransactions(req.query);
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async adjust(req, res, next) {
    try {
      const result = await stockService.adjust(req.body, req.user.emp_id);
      return sendSuccess(res, result, 'Stock adjustment recorded');
    } catch (err) { next(err); }
  }

  async transfer(req, res, next) {
    try {
      const result = await stockService.transfer(req.body, req.user.emp_id);
      return sendSuccess(res, result, 'Stock transfer completed');
    } catch (err) { next(err); }
  }
}

module.exports = new StockController();
