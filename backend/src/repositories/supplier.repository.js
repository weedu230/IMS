const { Op }         = require('sequelize');
const BaseRepository = require('./base.repository');
const { Supplier, Product, ProductSupplier } = require('../models');

class SupplierRepository extends BaseRepository {
  constructor() { super(Supplier); }

  async findAllPaginated(query) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.search) where[Op.or] = [
      { company_name:   { [Op.like]: `%${query.search}%` } },
      { contact_person: { [Op.like]: `%${query.search}%` } },
      { email:          { [Op.like]: `%${query.search}%` } },
    ];
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

    const { rows, count } = await Supplier.findAndCountAll({
      where, limit, offset, distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  async findByIdWithProducts(id) {
    return Supplier.findByPk(id, {
      include: [{
        model: ProductSupplier, as: 'productSuppliers',
        include: [{ model: Product, as: 'product', attributes: ['product_id','name','sku'] }],
      }],
    });
  }
}

module.exports = new SupplierRepository();
