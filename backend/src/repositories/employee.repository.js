const { Op }         = require('sequelize');
const BaseRepository = require('./base.repository');
const { Employee, Warehouse } = require('../models');

class EmployeeRepository extends BaseRepository {
  constructor() { super(Employee); }

  async findAllPaginated(query) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.search) where[Op.or] = [
      { name:  { [Op.like]: `%${query.search}%` } },
      { email: { [Op.like]: `%${query.search}%` } },
    ];
    if (query.role)         where.role         = query.role;
    if (query.warehouse_id) where.warehouse_id = query.warehouse_id;
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

    const { rows, count } = await Employee.findAndCountAll({
      where,
      include: [{ model: Warehouse, as: 'warehouse', attributes: ['warehouse_id','warehouse_name'] }],
      limit, offset, distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  async updatePassword(empId, hashedPassword) {
    await Employee.update({ password_hash: hashedPassword }, { where: { emp_id: empId } });
  }
}

module.exports = new EmployeeRepository();
