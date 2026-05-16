class BaseInventoryCommand {
  constructor(deps) {
    this.deps = deps;
  }

  emitStockEvents({ product_id, warehouse_id, quantity, txn_type, created_by, total_stock, reorder_level }) {
    const { domainEvents, DOMAIN_EVENTS } = this.deps;

    domainEvents.emit(DOMAIN_EVENTS.STOCK_CHANGED, {
      product_id,
      warehouse_id,
      quantity,
      txn_type,
      created_by,
    });

    if (typeof total_stock === 'number' && typeof reorder_level === 'number' && total_stock <= reorder_level) {
      domainEvents.emit(DOMAIN_EVENTS.STOCK_LOW, {
        product_id,
        total_stock,
        reorder_level,
      });
    }
  }
}

class AdjustStockCommand extends BaseInventoryCommand {
  async execute({ product_id, warehouse_id, txn_type, quantity, notes, bin_location, batch_no, serial_no }, empId) {
    const { productRepo, warehouseRepo, stockRepo, AppError, TXN_TYPE } = this.deps;

    const product = await productRepo.findById(product_id);
    if (!product) throw new AppError('Product not found', 404);
    const warehouse = await warehouseRepo.findById(warehouse_id);
    if (!warehouse) throw new AppError('Warehouse not found', 404);

    const allowed = [
      TXN_TYPE.IN, TXN_TYPE.OUT, TXN_TYPE.ADJUSTMENT,
      TXN_TYPE.RETURN, TXN_TYPE.WRITE_OFF,
    ];
    if (!allowed.includes(txn_type)) {
      throw new AppError(`txn_type must be one of: ${allowed.join(', ')}`, 400);
    }

    await stockRepo.callStockMovement({
      product_id, warehouse_id, txn_type, quantity,
      ref_id: null, notes, created_by: empId,
      bin_location, batch_no, serial_no,
    });

    const updated = await stockRepo.findByProduct(product_id);
    const totalStock = updated.reduce((sum, row) => sum + Number(row.qty_on_hand || 0), 0);
    this.emitStockEvents({
      product_id,
      warehouse_id,
      quantity,
      txn_type,
      created_by: empId,
      total_stock: totalStock,
      reorder_level: Number(product.reorder_level || 0),
    });

    return { message: 'Stock adjusted successfully', levels: updated };
  }
}

class TransferStockCommand extends BaseInventoryCommand {
  async execute({ product_id, from_warehouse_id, to_warehouse_id, quantity, notes }, empId) {
    const { productRepo, stockRepo, AppError, TXN_TYPE } = this.deps;

    if (from_warehouse_id === to_warehouse_id) {
      throw new AppError('Source and destination warehouses must be different', 400);
    }

    const product = await productRepo.findById(product_id);
    if (!product) throw new AppError('Product not found', 404);

    await stockRepo.callStockMovement({
      product_id, warehouse_id: from_warehouse_id,
      txn_type: TXN_TYPE.TRANSFER_OUT, quantity,
      ref_id: null, notes: notes || `Transfer to warehouse ${to_warehouse_id}`,
      created_by: empId,
    });

    await stockRepo.callStockMovement({
      product_id, warehouse_id: to_warehouse_id,
      txn_type: TXN_TYPE.TRANSFER_IN, quantity,
      ref_id: null, notes: notes || `Transfer from warehouse ${from_warehouse_id}`,
      created_by: empId,
    });

    const levels = await stockRepo.findByProduct(product_id);
    const totalStock = levels.reduce((sum, row) => sum + Number(row.qty_on_hand || 0), 0);

    this.emitStockEvents({
      product_id,
      warehouse_id: from_warehouse_id,
      quantity,
      txn_type: TXN_TYPE.TRANSFER_OUT,
      created_by: empId,
      total_stock: totalStock,
      reorder_level: Number(product.reorder_level || 0),
    });
    this.emitStockEvents({
      product_id,
      warehouse_id: to_warehouse_id,
      quantity,
      txn_type: TXN_TYPE.TRANSFER_IN,
      created_by: empId,
      total_stock: totalStock,
      reorder_level: Number(product.reorder_level || 0),
    });

    return { message: 'Transfer completed successfully', levels };
  }
}

module.exports = {
  AdjustStockCommand,
  TransferStockCommand,
};