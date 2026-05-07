const { Op }         = require('sequelize');
const BaseRepository = require('./base.repository');
const { PurchaseOrder, POItem, Supplier, Product, Warehouse, Employee } = require('../models');

class PurchaseOrderRepository extends BaseRepository {
  constructor() { super(PurchaseOrder); }

  async findAllPaginated(query = {}) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.status)      where.status      = query.status;
    if (query.supplier_id) where.supplier_id = query.supplier_id;
    if (query.from && query.to) {
      where.order_date = { [Op.between]: [new Date(query.from), new Date(query.to)] };
    }
    const { rows, count } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['supplier_id','company_name'] },
        { model: Employee, as: 'createdBy', attributes: ['emp_id','name'] },
      ],
      order: [['order_date', 'DESC']],
      limit, offset, distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  async findByIdFull(id) {
    return PurchaseOrder.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Employee, as: 'createdBy', attributes: ['emp_id','name','email'] },
        {
          model: POItem, as: 'items',
          include: [
            { model: Product,   as: 'product',   attributes: ['product_id','name','sku'] },
            { model: Warehouse, as: 'warehouse', attributes: ['warehouse_id','warehouse_name'] },
          ],
        },
      ],
    });
  }

  async createWithItems(poData, items) {
    const { sequelize } = require('../config/database');
    return sequelize.transaction(async (t) => {
      const po = await PurchaseOrder.create(poData, { transaction: t });
      const poItems = items.map(item => ({ ...item, po_id: po.po_id }));
      await POItem.bulkCreate(poItems, { transaction: t });

      // Calculate total
      const total = items.reduce((sum, i) => sum + i.unit_cost * i.qty_ordered, 0);
      await po.update({ total_amount: total }, { transaction: t });

      return po;
    });
  }

  async updateStatus(id, status) {
    return PurchaseOrder.update({ status }, { where: { po_id: id } });
  }
}

module.exports = new PurchaseOrderRepository();
