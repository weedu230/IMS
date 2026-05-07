const { Op }         = require('sequelize');
const BaseRepository = require('./base.repository');
const { CustomerOrder, CustomerOrderItem, Customer, Product, Warehouse, Employee } = require('../models');

class CustomerOrderRepository extends BaseRepository {
  constructor() { super(CustomerOrder); }

  async findAllPaginated(query = {}) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.status)      where.status      = query.status;
    if (query.customer_id) where.customer_id = query.customer_id;
    if (query.from && query.to) {
      where.order_date = { [Op.between]: [new Date(query.from), new Date(query.to)] };
    }
    const { rows, count } = await CustomerOrder.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['customer_id','name','email'] },
        { model: Employee, as: 'createdBy', attributes: ['emp_id','name'] },
      ],
      order: [['order_date','DESC']],
      limit, offset, distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  async findByIdFull(id) {
    return CustomerOrder.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Employee, as: 'createdBy', attributes: ['emp_id','name'] },
        {
          model: CustomerOrderItem, as: 'items',
          include: [
            { model: Product,   as: 'product',   attributes: ['product_id','name','sku'] },
            { model: Warehouse, as: 'warehouse', attributes: ['warehouse_id','warehouse_name'] },
          ],
        },
      ],
    });
  }

  async createWithItems(orderData, items, t) {
    const order = await CustomerOrder.create(orderData, { transaction: t });
    const orderItems = items.map(item => ({ ...item, order_id: order.order_id }));
    await CustomerOrderItem.bulkCreate(orderItems, { transaction: t });
    return order;
  }

  async updateStatus(id, status, t = null) {
    return CustomerOrder.update({ status }, { where: { order_id: id }, ...(t && { transaction: t }) });
  }
}

module.exports = new CustomerOrderRepository();
