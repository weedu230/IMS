const { Op, fn, col, literal } = require('sequelize');
const { sequelize }    = require('../config/database');
const BaseRepository   = require('./base.repository');
const { Stock, StockTransaction, Product, Warehouse, Category } = require('../models');

class StockRepository extends BaseRepository {
  constructor() { super(Stock); }

  /** Current stock for one product across all warehouses */
  async findByProduct(productId) {
    return Stock.findAll({
      where: { product_id: productId },
      include: [{ model: Warehouse, as: 'warehouse',
        attributes: ['warehouse_id','warehouse_name','location'] }],
    });
  }

  /** Current stock for one warehouse across all products */
  async findByWarehouse(warehouseId, query = {}) {
    const { limit, offset, page } = this._paginate(query);
    const { rows, count } = await Stock.findAndCountAll({
      where: { warehouse_id: warehouseId },
      include: [{ model: Product, as: 'product',
        attributes: ['product_id','name','sku','reorder_level','reorder_qty','unit_price'] }],
      limit, offset, distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  /** Aggregated stock level per product across all warehouses */
  async findTotalStockPerProduct(query = {}) {
    const { limit, offset, page } = this._paginate(query);
    const { rows, count } = await Product.findAndCountAll({
      attributes: {
        include: [
          [fn('COALESCE', fn('SUM', col('stockLevels.qty_on_hand')), 0), 'total_stock'],
        ],
      },
      include: [
        { model: Stock, as: 'stockLevels', attributes: [] },
        { model: Category, as: 'category', attributes: ['category_id','category_name'] },
      ],
      where: { is_active: true },
      group: ['Product.product_id'],
      limit, offset, distinct: true,
      subQuery: false,
    });
    return this._paginated(rows, count, page, limit);
  }

  /** Products below reorder level — uses raw query for clarity */
  async findLowStock() {
    const [results] = await sequelize.query(`
      SELECT p.product_id, p.sku, p.name,
             c.category_name,
             COALESCE(SUM(s.qty_on_hand),0) AS total_stock,
             p.reorder_level,
             p.reorder_qty,
             (p.reorder_level - COALESCE(SUM(s.qty_on_hand),0)) AS shortage
      FROM   product p
      LEFT   JOIN category c ON p.category_id = c.category_id
      LEFT   JOIN stock    s ON p.product_id  = s.product_id
      WHERE  p.is_active = 1
      GROUP  BY p.product_id, p.sku, p.name, c.category_name, p.reorder_level, p.reorder_qty
      HAVING total_stock <= p.reorder_level
      ORDER  BY shortage DESC
    `);
    return results;
  }

  /** Transaction history with pagination */
  async findTransactions(query = {}) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.product_id)   where.product_id   = query.product_id;
    if (query.warehouse_id) where.warehouse_id  = query.warehouse_id;
    if (query.txn_type)     where.txn_type      = query.txn_type;
    if (query.from && query.to) {
      where.txn_date = { [Op.between]: [new Date(query.from), new Date(query.to)] };
    }
    const { rows, count } = await StockTransaction.findAndCountAll({
      where,
      include: [
        { model: Product,   as: 'product',   attributes: ['product_id','name','sku'] },
        { model: Warehouse, as: 'warehouse', attributes: ['warehouse_id','warehouse_name'] },
      ],
      order: [['txn_date','DESC']],
      limit, offset, distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  /** Call MySQL stored procedure for ACID stock movement */
  async callStockMovement({ product_id, warehouse_id, txn_type, quantity, ref_id, notes, created_by, bin_location, batch_no, serial_no }) {
    await sequelize.query(
      'CALL RecordStockMovement(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      { replacements: [
        product_id,
        warehouse_id,
        txn_type,
        quantity,
        ref_id || null,
        notes || null,
        created_by || null,
        bin_location || null,
        batch_no || null,
        serial_no || null,
      ] }
    );
  }
}

module.exports = new StockRepository();
