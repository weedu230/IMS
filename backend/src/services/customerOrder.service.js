const { sequelize }   = require('../config/database');
const orderRepo       = require('../repositories/customerOrder.repository');
const customerRepo    = require('../repositories/customer.repository');
const stockRepo       = require('../repositories/stock.repository');
const { AppError }    = require('../middleware/errorHandler');
const { ORDER_STATUS, TXN_TYPE } = require('../utils/constants');
const { Stock, CustomerOrderItem } = require('../models');

class CustomerOrderService {

  async getAll(query)  { return orderRepo.findAllPaginated(query); }

  async getById(id) {
    const order = await orderRepo.findByIdFull(id);
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  /**
   * POST /orders
   * Place a new customer order.
   * Sequence (from report section 4.4.2):
   *   1. Validate customer credit limit
   *   2. Check stock availability per line item
   *   3. Reserve stock (decrement available qty)
   *   4. Save order as CONFIRMED
   */
  async create(data, empId) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('Order must have at least one item', 400);
    }

    const customer = await customerRepo.findById(data.customer_id);
    if (!customer || !customer.is_active) {
      throw new AppError('Customer not found or inactive', 404);
    }

    // Calculate order total
    const total = data.items.reduce((sum, i) => sum + i.unit_price * i.qty_ordered, 0);

    // Credit limit check
    if (total > parseFloat(customer.credit_limit)) {
      throw new AppError(
        `Order total (${total}) exceeds customer credit limit (${customer.credit_limit})`, 400
      );
    }

    let createdOrder;

    await sequelize.transaction(async (t) => {
      // Stock availability check + reservation
      for (const item of data.items) {
        const stockRow = await Stock.findOne({
          where: { product_id: item.product_id, warehouse_id: item.warehouse_id },
          transaction: t,
          lock: t.LOCK.UPDATE,   // row-level lock for concurrency
        });

        if (!stockRow || stockRow.qty_on_hand < item.qty_ordered) {
          throw new AppError(
            `Insufficient stock for product ${item.product_id} in warehouse ${item.warehouse_id}. ` +
            `Available: ${stockRow ? stockRow.qty_on_hand : 0}, Requested: ${item.qty_ordered}`, 400
          );
        }

        // Reserve: decrement stock
        await Stock.update(
          { qty_on_hand: stockRow.qty_on_hand - item.qty_ordered },
          { where: { stock_id: stockRow.stock_id }, transaction: t }
        );
      }

      // Create order + items
      createdOrder = await orderRepo.createWithItems(
        {
          customer_id:      data.customer_id,
          shipping_address: data.shipping_address || null,
          notes:            data.notes || null,
          total_amount:     total,
          status:           ORDER_STATUS.CONFIRMED,
          created_by:       empId,
        },
        data.items.map(i => ({
          product_id:   i.product_id,
          warehouse_id: i.warehouse_id,
          qty_ordered:  i.qty_ordered,
          qty_reserved: i.qty_ordered,
          unit_price:   i.unit_price,
        })),
        t
      );
    });

    return orderRepo.findByIdFull(createdOrder.order_id);
  }

  /**
   * PUT /orders/:id/fulfill
   * Commits the reserved stock: records OUT transactions and marks order FULFILLED.
   * This corresponds to "Warehouse staff picks items" in the sequence diagram.
   */
  async fulfill(id, empId) {
    const order = await orderRepo.findByIdFull(id);
    if (!order) throw new AppError('Order not found', 404);

    const fulfillable = [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PICKING, ORDER_STATUS.PACKED];
    if (!fulfillable.includes(order.status)) {
      throw new AppError(`Cannot fulfill order with status: ${order.status}`, 400);
    }

    await sequelize.transaction(async (t) => {
      for (const item of order.items) {
        // Record permanent OUT transaction (stock was already reserved at order time)
        await stockRepo.callStockMovement({
          product_id:   item.product_id,
          warehouse_id: item.warehouse_id,
          txn_type:     TXN_TYPE.OUT,
          quantity:     item.qty_ordered,
          ref_id:       order.order_id,
          notes:        `Fulfilled from order #${order.order_id}`,
          created_by:   empId,
        });

        // Mark item as shipped
        await CustomerOrderItem.update(
          { qty_shipped: item.qty_ordered },
          { where: { item_id: item.item_id }, transaction: t }
        );
      }

      await orderRepo.updateStatus(id, ORDER_STATUS.FULFILLED, t);
    });

    return orderRepo.findByIdFull(id);
  }

  /** PUT /orders/:id/cancel — returns reserved stock back */
  async cancel(id, empId) {
    const order = await orderRepo.findByIdFull(id);
    if (!order) throw new AppError('Order not found', 404);

    const cancellable = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
    if (!cancellable.includes(order.status)) {
      throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
    }

    await sequelize.transaction(async (t) => {
      // Return reserved stock
      for (const item of order.items) {
        if (item.qty_reserved > 0) {
          await Stock.increment(
            { qty_on_hand: item.qty_reserved },
            { where: { product_id: item.product_id, warehouse_id: item.warehouse_id }, transaction: t }
          );
        }
      }
      await orderRepo.updateStatus(id, ORDER_STATUS.CANCELLED, t);
    });

    return orderRepo.findByIdFull(id);
  }

  /** PUT /orders/:id/status — generic status update for workflow progression */
  async updateStatus(id, status, empId) {
    const order = await orderRepo.findByIdFull(id);
    if (!order) throw new AppError('Order not found', 404);
    await orderRepo.updateStatus(id, status);
    return orderRepo.findByIdFull(id);
  }

  // ── Customer CRUD ─────────────────────────────────────────────────────────
  async getAllCustomers(query) { return customerRepo.findAllPaginated(query); }

  async getCustomerById(id) {
    const c = await customerRepo.findById(id);
    if (!c) throw new AppError('Customer not found', 404);
    return c;
  }

  async createCustomer(data, empId) {
    const c = await customerRepo.create(data);
    await customerRepo.audit({ table_name:'customer', record_id: c.customer_id,
      action:'INSERT', new_values: c.toJSON(), changed_by: empId });
    return c;
  }

  async updateCustomer(id, data, empId) {
    const existing = await customerRepo.findById(id);
    if (!existing) throw new AppError('Customer not found', 404);
    const old = existing.toJSON();
    await customerRepo.update(id, data);
    const updated = await customerRepo.findById(id);
    await customerRepo.audit({ table_name:'customer', record_id: id,
      action:'UPDATE', old_values: old, new_values: updated.toJSON(), changed_by: empId });
    return updated;
  }
}

module.exports = new CustomerOrderService();
