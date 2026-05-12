const stockRepo    = require('../repositories/stock.repository');
const productRepo  = require('../repositories/product.repository');
const warehouseRepo = require('../repositories/warehouse.repository');
const { AppError } = require('../middleware/errorHandler');
const { TXN_TYPE } = require('../utils/constants');
const { AdjustStockCommand, TransferStockCommand } = require('../commands/inventory.commands');
const { domainEvents, DOMAIN_EVENTS } = require('../utils/domainEvents');

class StockService {
  constructor() {
    const deps = {
      productRepo,
      warehouseRepo,
      stockRepo,
      AppError,
      TXN_TYPE,
      domainEvents,
      DOMAIN_EVENTS,
    };
    this.adjustCommand = new AdjustStockCommand(deps);
    this.transferCommand = new TransferStockCommand(deps);
  }

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
    return this.adjustCommand.execute({ product_id, warehouse_id, txn_type, quantity, notes }, empId);
  }

  /**
   * POST /stock/transfer
   * Move qty from one warehouse to another — two movements in sequence.
   * The stored procedure guards each leg so neither can go negative.
   */
  async transfer({ product_id, from_warehouse_id, to_warehouse_id, quantity, notes }, empId) {
    return this.transferCommand.execute({ product_id, from_warehouse_id, to_warehouse_id, quantity, notes }, empId);
  }
}

module.exports = new StockService();
