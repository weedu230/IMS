const { Op } = require('sequelize');
const { AuditLog, Employee } = require('../models');
const { PAGINATION } = require('../utils/constants');

class AuditService {
  async getLogs(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;

    const where = {};
    if (query.table_name) where.table_name = query.table_name;
    if (query.action) where.action = query.action.toUpperCase();
    if (query.changed_by) where.changed_by = query.changed_by;
    if (query.from && query.to) {
      where.changed_at = { [Op.between]: [new Date(query.from), new Date(query.to)] };
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'changedBy', attributes: ['emp_id', 'name', 'email', 'role'] }],
      order: [['changed_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }
}

module.exports = new AuditService();
