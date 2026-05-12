const poRepo       = require('../repositories/purchaseOrder.repository');
const stockRepo    = require('../repositories/stock.repository');
const { AppError } = require('../middleware/errorHandler');
const { PO_STATUS, TXN_TYPE } = require('../utils/constants');
const { POItem }   = require('../models');
const { sequelize } = require('../config/database');
const { domainEvents, DOMAIN_EVENTS } = require('../utils/domainEvents');

class PurchaseOrderService {

  async getAll(query)  { return poRepo.findAllPaginated(query); }

  async getById(id) {
    const po = await poRepo.findByIdFull(id);
    if (!po) throw new AppError('Purchase order not found', 404);
    return po;
  }

  /** POST /purchase-orders  — create draft PO with line items */
  async create(data, empId) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('Purchase order must have at least one item', 400);
    }

    const poData = {
      supplier_id:   data.supplier_id,
      expected_date: data.expected_date || null,
      notes:         data.notes || null,
      status:        PO_STATUS.DRAFT,
      created_by:    empId,
    };

    const po = await poRepo.createWithItems(poData, data.items);
    await poRepo.audit({ table_name: 'purchase_order', record_id: po.po_id,
      action: 'INSERT', new_values: po.toJSON(), changed_by: empId });
    domainEvents.emit(DOMAIN_EVENTS.PURCHASE_ORDER_CREATED, {
      po_id: po.po_id,
      supplier_id: po.supplier_id,
      created_by: empId,
    });
    return poRepo.findByIdFull(po.po_id);
  }

  /** PUT /purchase-orders/:id/submit  — draft → pending_approval */
  async submit(id, empId) {
    const po = await poRepo.findByIdFull(id);
    if (!po) throw new AppError('Purchase order not found', 404);
    if (po.status !== PO_STATUS.DRAFT) {
      throw new AppError(`Only DRAFT orders can be submitted. Current: ${po.status}`, 400);
    }
    await poRepo.updateStatus(id, PO_STATUS.PENDING_APPROVAL);
    return poRepo.findByIdFull(id);
  }

  /** PUT /purchase-orders/:id/approve  — pending_approval → approved */
  async approve(id, empId) {
    const po = await poRepo.findByIdFull(id);
    if (!po) throw new AppError('Purchase order not found', 404);
    if (po.status !== PO_STATUS.PENDING_APPROVAL) {
      throw new AppError(`Only PENDING_APPROVAL orders can be approved. Current: ${po.status}`, 400);
    }
    await poRepo.updateStatus(id, PO_STATUS.APPROVED);
    await poRepo.audit({ table_name: 'purchase_order', record_id: id,
      action: 'UPDATE', old_values: { status: po.status },
      new_values: { status: PO_STATUS.APPROVED }, changed_by: empId });
    domainEvents.emit(DOMAIN_EVENTS.PURCHASE_ORDER_STATUS_CHANGED, {
      po_id: id,
      status: PO_STATUS.APPROVED,
      changed_by: empId,
    });
    return poRepo.findByIdFull(id);
  }

  /** PUT /purchase-orders/:id/cancel */
  async cancel(id, empId) {
    const po = await poRepo.findByIdFull(id);
    if (!po) throw new AppError('Purchase order not found', 404);
    const cancellable = [PO_STATUS.DRAFT, PO_STATUS.PENDING_APPROVAL, PO_STATUS.APPROVED];
    if (!cancellable.includes(po.status)) {
      throw new AppError(`Cannot cancel a PO with status: ${po.status}`, 400);
    }
    await poRepo.updateStatus(id, PO_STATUS.CANCELLED);
    domainEvents.emit(DOMAIN_EVENTS.PURCHASE_ORDER_STATUS_CHANGED, {
      po_id: id,
      status: PO_STATUS.CANCELLED,
      changed_by: empId,
    });
    return poRepo.findByIdFull(id);
  }

  /**
   * PUT /purchase-orders/:id/receive
   * Process goods receipt — the heart of the procurement workflow.
   * Supports partial receipts. Calls stored procedure per item received.
   *
   * Body: { items: [{ po_item_id, qty_received }] }
   */
  async receiveGoods(id, { items }, empId) {
    const po = await poRepo.findByIdFull(id);
    if (!po) throw new AppError('Purchase order not found', 404);

    const receivable = [PO_STATUS.APPROVED, PO_STATUS.PARTIALLY_RECEIVED];
    if (!receivable.includes(po.status)) {
      throw new AppError(`Cannot receive goods for PO with status: ${po.status}`, 400);
    }
    if (!items || items.length === 0) {
      throw new AppError('No items provided for receipt', 400);
    }

    await sequelize.transaction(async (t) => {
      for (const receipt of items) {
        const poItem = po.items.find(i => i.po_item_id === receipt.po_item_id);
        if (!poItem) throw new AppError(`PO item ${receipt.po_item_id} not found in this PO`, 404);

        const remaining = poItem.qty_ordered - poItem.qty_received;
        if (receipt.qty_received > remaining) {
          throw new AppError(
            `Cannot receive ${receipt.qty_received} for item ${poItem.po_item_id}. ` +
            `Max remaining: ${remaining}`, 400
          );
        }

        // Update po_item.qty_received
        await POItem.update(
          { qty_received: poItem.qty_received + receipt.qty_received },
          { where: { po_item_id: receipt.po_item_id }, transaction: t }
        );

        // Record stock IN via stored procedure
        await stockRepo.callStockMovement({
          product_id:   poItem.product_id,
          warehouse_id: poItem.warehouse_id,
          txn_type:     TXN_TYPE.IN,
          quantity:     receipt.qty_received,
          ref_id:       po.po_id,
          notes:        `Goods receipt for PO #${po.po_id}`,
          created_by:   empId,
        });
      }

      // Re-fetch to check if all items fully received
      const refreshedItems = await POItem.findAll({ where: { po_id: id }, transaction: t });
      const allReceived = refreshedItems.every(i => i.qty_received >= i.qty_ordered);
      const anyReceived = refreshedItems.some(i => i.qty_received > 0);

      const newStatus = allReceived
        ? PO_STATUS.RECEIVED
        : anyReceived
          ? PO_STATUS.PARTIALLY_RECEIVED
          : po.status;

      await PurchaseOrder.update({ status: newStatus }, { where: { po_id: id }, transaction: t });
    });

    return poRepo.findByIdFull(id);
  }
}

// Circular dep fix
const { PurchaseOrder } = require('../models');
module.exports = new PurchaseOrderService();
