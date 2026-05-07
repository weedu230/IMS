const { Op }         = require('sequelize');
const BaseRepository = require('./base.repository');
const { Product, Category, Supplier, ProductSupplier, Stock, Warehouse } = require('../models');

class ProductRepository extends BaseRepository {
  constructor() { super(Product); }

  async findAllPaginated(query) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.search)      where[Op.or] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { sku:  { [Op.like]: `%${query.search}%` } },
    ];
    if (query.category_id) where.category_id = query.category_id;
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

    const { rows, count } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['category_id','category_name'] },
        { model: ProductSupplier, as: 'productSuppliers',
          include: [{ model: Supplier, as: 'supplier', attributes: ['supplier_id','company_name'] }] },
      ],
      limit, offset, distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  async findByIdFull(id) {
    return Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductSupplier, as: 'productSuppliers',
          include: [{ model: Supplier, as: 'supplier' }] },
        { model: Stock, as: 'stockLevels',
          include: [{ model: Warehouse, as: 'warehouse', attributes: ['warehouse_id','warehouse_name','location'] }] },
      ],
    });
  }

  async findBySku(sku) {
    return Product.findOne({ where: { sku } });
  }
}

module.exports = new ProductRepository();
