const orderService = require('../services/customerOrder.service');
const { sendSuccess, sendCreated } = require('../utils/response');

class CustomerOrderController {
  async getAll(req, res, next) {
    try { return sendSuccess(res, await orderService.getAll(req.query)); }
    catch (err) { next(err); }
  }
  async getById(req, res, next) {
    try { return sendSuccess(res, await orderService.getById(req.params.id)); }
    catch (err) { next(err); }
  }
  async create(req, res, next) {
    try { return sendCreated(res, await orderService.create(req.body, req.user.emp_id)); }
    catch (err) { next(err); }
  }
  async fulfill(req, res, next) {
    try { return sendSuccess(res, await orderService.fulfill(req.params.id, req.user.emp_id), 'Order fulfilled'); }
    catch (err) { next(err); }
  }
  async cancel(req, res, next) {
    try { return sendSuccess(res, await orderService.cancel(req.params.id, req.user.emp_id), 'Order cancelled'); }
    catch (err) { next(err); }
  }
  async updateStatus(req, res, next) {
    try { return sendSuccess(res, await orderService.updateStatus(req.params.id, req.body.status, req.user.emp_id)); }
    catch (err) { next(err); }
  }
  // Customer endpoints
  async getAllCustomers(req, res, next) {
    try { return sendSuccess(res, await orderService.getAllCustomers(req.query)); }
    catch (err) { next(err); }
  }
  async getCustomerById(req, res, next) {
    try { return sendSuccess(res, await orderService.getCustomerById(req.params.id)); }
    catch (err) { next(err); }
  }
  async createCustomer(req, res, next) {
    try { return sendCreated(res, await orderService.createCustomer(req.body, req.user.emp_id)); }
    catch (err) { next(err); }
  }
  async updateCustomer(req, res, next) {
    try { return sendSuccess(res, await orderService.updateCustomer(req.params.id, req.body, req.user.emp_id)); }
    catch (err) { next(err); }
  }
}

module.exports = new CustomerOrderController();
