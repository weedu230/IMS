const poService = require('../services/purchaseOrder.service');
const { sendSuccess, sendCreated } = require('../utils/response');

class PurchaseOrderController {
  async getAll(req, res, next) {
    try { return sendSuccess(res, await poService.getAll(req.query)); }
    catch (err) { next(err); }
  }
  async getById(req, res, next) {
    try { return sendSuccess(res, await poService.getById(req.params.id)); }
    catch (err) { next(err); }
  }
  async create(req, res, next) {
    try { return sendCreated(res, await poService.create(req.body, req.user.emp_id)); }
    catch (err) { next(err); }
  }
  async submit(req, res, next) {
    try { return sendSuccess(res, await poService.submit(req.params.id, req.user.emp_id), 'PO submitted for approval'); }
    catch (err) { next(err); }
  }
  async approve(req, res, next) {
    try { return sendSuccess(res, await poService.approve(req.params.id, req.user.emp_id), 'PO approved'); }
    catch (err) { next(err); }
  }
  async cancel(req, res, next) {
    try { return sendSuccess(res, await poService.cancel(req.params.id, req.user.emp_id), 'PO cancelled'); }
    catch (err) { next(err); }
  }
  async receiveGoods(req, res, next) {
    try { return sendSuccess(res, await poService.receiveGoods(req.params.id, req.body, req.user.emp_id), 'Goods received successfully'); }
    catch (err) { next(err); }
  }
}

module.exports = new PurchaseOrderController();
