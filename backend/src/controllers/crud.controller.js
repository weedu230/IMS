const { sendSuccess, sendCreated, sendNotFound } = require('../utils/response');

/**
 * makeCrudController(service)
 *
 * Returns a controller object with standard CRUD methods wired to the given service.
 * Each domain controller can spread these and override individual methods as needed.
 *
 * @param {object} service  — A service instance with getAll / getById / create / update / deactivate
 */
const makeCrudController = (service) => ({

  async getAll(req, res, next) {
    try {
      const result = await service.getAll(req.query);
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const result = await service.getById(req.params.id);
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const result = await service.create(req.body, req.user?.emp_id);
      return sendCreated(res, result);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const result = await service.update(req.params.id, req.body, req.user?.emp_id);
      return sendSuccess(res, result, 'Updated successfully');
    } catch (err) { next(err); }
  },

  async deactivate(req, res, next) {
    try {
      const result = await service.deactivate(req.params.id, req.user?.emp_id);
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  },
});

module.exports = { makeCrudController };
