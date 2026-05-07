/**
 * Unit Tests — Stock Service
 * All DB calls are mocked — tests pure business logic.
 */

jest.mock('../repositories/stock.repository');
jest.mock('../repositories/product.repository');
jest.mock('../repositories/warehouse.repository');

const stockRepo    = require('../repositories/stock.repository');
const productRepo  = require('../repositories/product.repository');
const warehouseRepo = require('../repositories/warehouse.repository');
const stockService = require('../services/stock.service');
const { TXN_TYPE } = require('../utils/constants');

const mockProduct   = { product_id: 1, name: 'Test Product', sku: 'TEST-001', is_active: true };
const mockWarehouse = { warehouse_id: 1, warehouse_name: 'Main', is_active: true };
const mockLevels    = [{ warehouse_id: 1, qty_on_hand: 50 }];

// ─────────────────────────────────────────────────────────────────────────────
describe('StockService.adjust', () => {

  beforeEach(() => {
    productRepo.findById.mockResolvedValue(mockProduct);
    warehouseRepo.findById.mockResolvedValue(mockWarehouse);
    stockRepo.callStockMovement.mockResolvedValue(undefined);
    stockRepo.findByProduct.mockResolvedValue(mockLevels);
  });

  test('succeeds with valid IN adjustment', async () => {
    const result = await stockService.adjust(
      { product_id: 1, warehouse_id: 1, txn_type: 'IN', quantity: 10, notes: 'Restock' },
      1
    );
    expect(stockRepo.callStockMovement).toHaveBeenCalledWith(
      expect.objectContaining({ txn_type: 'IN', quantity: 10 })
    );
    expect(result.levels).toEqual(mockLevels);
  });

  test('succeeds with OUT adjustment', async () => {
    await stockService.adjust(
      { product_id: 1, warehouse_id: 1, txn_type: 'OUT', quantity: 5, notes: 'Sale' },
      1
    );
    expect(stockRepo.callStockMovement).toHaveBeenCalledWith(
      expect.objectContaining({ txn_type: 'OUT' })
    );
  });

  test('throws 404 when product not found', async () => {
    productRepo.findById.mockResolvedValue(null);
    await expect(
      stockService.adjust({ product_id: 999, warehouse_id: 1, txn_type: 'IN', quantity: 5 }, 1)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 404 when warehouse not found', async () => {
    warehouseRepo.findById.mockResolvedValue(null);
    await expect(
      stockService.adjust({ product_id: 1, warehouse_id: 999, txn_type: 'IN', quantity: 5 }, 1)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 400 for invalid txn_type', async () => {
    await expect(
      stockService.adjust({ product_id: 1, warehouse_id: 1, txn_type: 'INVALID', quantity: 5 }, 1)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('propagates stored procedure error (negative stock)', async () => {
    const spError = new Error('Insufficient stock: transaction would result in negative quantity');
    stockRepo.callStockMovement.mockRejectedValue(spError);
    await expect(
      stockService.adjust({ product_id: 1, warehouse_id: 1, txn_type: 'OUT', quantity: 1000 }, 1)
    ).rejects.toThrow('Insufficient stock');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('StockService.transfer', () => {

  beforeEach(() => {
    productRepo.findById.mockResolvedValue(mockProduct);
    stockRepo.callStockMovement.mockResolvedValue(undefined);
    stockRepo.findByProduct.mockResolvedValue(mockLevels);
  });

  test('throws 400 when source equals destination warehouse', async () => {
    await expect(
      stockService.transfer({ product_id: 1, from_warehouse_id: 1, to_warehouse_id: 1, quantity: 10 }, 1)
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('different') });
  });

  test('calls TRANSFER_OUT then TRANSFER_IN on valid transfer', async () => {
    await stockService.transfer(
      { product_id: 1, from_warehouse_id: 1, to_warehouse_id: 2, quantity: 15 },
      1
    );
    expect(stockRepo.callStockMovement).toHaveBeenCalledTimes(2);
    const calls = stockRepo.callStockMovement.mock.calls;
    expect(calls[0][0].txn_type).toBe(TXN_TYPE.TRANSFER_OUT);
    expect(calls[1][0].txn_type).toBe(TXN_TYPE.TRANSFER_IN);
    expect(calls[0][0].quantity).toBe(15);
    expect(calls[1][0].quantity).toBe(15);
  });

  test('throws 404 when product not found', async () => {
    productRepo.findById.mockResolvedValue(null);
    await expect(
      stockService.transfer({ product_id: 999, from_warehouse_id: 1, to_warehouse_id: 2, quantity: 5 }, 1)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
