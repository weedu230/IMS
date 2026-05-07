const { Op }         = require('sequelize');
const BaseRepository = require('./base.repository');
const { Warehouse, Employee, Stock, Product } = require('../models');

class WarehouseRepository extends BaseRepository {
  constructor() { super(Warehouse); }

  async findAllPaginated(query) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.search)     where.warehouse_name = { [Op.like]: `%${query.search}%` };
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

    const { rows, count } = await Warehouse.findAndCountAll({
      where, limit, offset, distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  async findByIdFull(id) {
    return Warehouse.findByPk(id, {
      include: [
        { model: Employee, as: 'employees', attributes: ['emp_id','name','email','role'] },
        { model: Stock,    as: 'stockLevels',
          include: [{ model: Product, as: 'product', attributes: ['product_id','name','sku'] }] },
      ],
    });
  }
}

module.exports = new WarehouseRepository();
