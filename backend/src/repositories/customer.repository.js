const { Op }         = require('sequelize');
const BaseRepository = require('./base.repository');
const { Customer }   = require('../models');

class CustomerRepository extends BaseRepository {
  constructor() { super(Customer); }

  async findAllPaginated(query = {}) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.search) where[Op.or] = [
      { name:  { [Op.like]: `%${query.search}%` } },
      { email: { [Op.like]: `%${query.search}%` } },
    ];
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    const { rows, count } = await Customer.findAndCountAll({ where, limit, offset, distinct: true });
    return this._paginated(rows, count, page, limit);
  }
}
module.exports = new CustomerRepository();
