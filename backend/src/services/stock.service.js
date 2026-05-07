const stockRepo    = require('../repositories/stock.repository');
const productRepo  = require('../repositories/product.repository');
const warehouseRepo = require('../repositories/warehouse.repository');
const { AppError } = require('../middleware/errorHandler');
const { TXN_TYPE } = require('../utils/constants');

class StockService {

  /** GET /stock/product/:productId */
  async getByProduct(productId) {
    const product = await productRepo.findById(productId);
    if (!product) throw new AppError('Product not found', 404);
    const levels = await stockRepo.findByProduct(productId);
    return { product, levels };
  }

  /** GET /stock/warehouse/:warehouseId */
  async getByWarehouse(warehouseId, query) {
    const warehouse = await warehouseRepo.findById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    return stockRepo.findByWarehouse(warehouseId, query);
  }

  /** GET /stock  — aggregated total per product */
  async getAllStockLevels(query) {
    return stockRepo.findTotalStockPerProduct(query);
  }

  /** GET /stock/alerts/low-stock */
  async getLowStock() {
    return stockRepo.findLowStock();
  }

  /** GET /stock/transactions */
  async getTransactions(query) {
    return stockRepo.findTransactions(query);
  }

  /**
   * POST /stock/adjust
   * Manual stock adjustment — calls the ACID stored procedure.
   * Supports IN | OUT | ADJUSTMENT | RETURN | WRITE_OFF
   */
  async adjust({ product_id, warehouse_id, txn_type, quantity, notes }, empId) {
    // Validate product & warehouse exist
    const product   = await productRepo.findById(product_id);
    if (!product)   throw new AppError('Product not found', 404);
    const warehouse = await warehouseRepo.findById(warehouse_id);
    if (!warehouse) throw new AppError('Warehouse not found', 404);

    const allowed = [
      TXN_TYPE.IN, TXN_TYPE.OUT, TXN_TYPE.ADJUSTMENT,
      TXN_TYPE.RETURN, TXN_TYPE.WRITE_OFF,
    ];
    if (!allowed.includes(txn_type)) {
      throw new AppError(`txn_type must be one of: ${allowed.join(', ')}`, 400);
    }

    // Delegate to stored procedure (handles locking + negative-stock guard)
    await stockRepo.callStockMovement({
      product_id, warehouse_id, txn_type, quantity,
      ref_id: null, notes, created_by: empId,
    });

    // Return updated stock row
    const updated = await stockRepo.findByProduct(product_id);
    return { message: 'Stock adjusted successfully', levels: updated };
  }

  /**
   * POST /stock/transfer
   * Move qty from one warehouse to another — two movements in sequence.
   * The stored procedure guards each leg so neither can go negative.
   */
  async transfer({ product_id, from_warehouse_id, to_warehouse_id, quantity, notes }, empId) {
    if (from_warehouse_id === to_warehouse_id) {
      throw new AppError('Source and destination warehouses must be different', 400);
    }

    const product = await productRepo.findById(product_id);
    if (!product) throw new AppError('Product not found', 404);

    // Leg 1 — OUT from source
    await stockRepo.callStockMovement({
      product_id, warehouse_id: from_warehouse_id,
      txn_type: TXN_TYPE.TRANSFER_OUT, quantity,
      ref_id: null, notes: notes || `Transfer to warehouse ${to_warehouse_id}`,
      created_by: empId,
    });

    // Leg 2 — IN to destination
    await stockRepo.callStockMovement({
      product_id, warehouse_id: to_warehouse_id,
      txn_type: TXN_TYPE.TRANSFER_IN, quantity,
      ref_id: null, notes: notes || `Transfer from warehouse ${from_warehouse_id}`,
      created_by: empId,
    });

    const levels = await stockRepo.findByProduct(product_id);
    return { message: 'Transfer completed successfully', levels };
  }
}

module.exports = new StockService();
