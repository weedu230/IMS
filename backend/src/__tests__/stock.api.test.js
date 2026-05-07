/**
 * Integration Tests — Stock API (Supertest, no real DB)
 */

jest.mock('../config/database', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    query:        jest.fn().mockResolvedValue([[]]),
    transaction:  jest.fn((cb) => cb({ LOCK: { UPDATE: 'UPDATE' } })),
  },
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../models', () => ({
  Category: {}, Warehouse: {}, Employee: {}, Supplier: {},
  Product: {}, ProductSupplier: {}, Stock: {}, StockTransaction: {},
  Customer: {}, CustomerOrder: {}, CustomerOrderItem: {},
  PurchaseOrder: {}, POItem: {}, AuditLog: {},
}));

jest.mock('../repositories/auth.repository');
jest.mock('../repositories/stock.repository');
jest.mock('../repositories/product.repository');
jest.mock('../repositories/warehouse.repository');

const request       = require('supertest');
const bcrypt        = require('bcryptjs');
const app           = require('../app');
const authRepo      = require('../repositories/auth.repository');
const stockRepo     = require('../repositories/stock.repository');
const productRepo   = require('../repositories/product.repository');
const warehouseRepo = require('../repositories/warehouse.repository');

const HASH = bcrypt.hashSync('Password123!', 4);
const mockEmp = {
  emp_id: 1, name: 'Admin', email: 'admin@ims.local',
  role: 'admin', is_active: true, password_hash: HASH,
  toJSON: () => ({ emp_id: 1, name: 'Admin', email: 'admin@ims.local', role: 'admin' }),
};

let token;

beforeAll(async () => {
  authRepo.findByEmail.mockResolvedValue(mockEmp);
  authRepo.touchLogin.mockResolvedValue([1]);
  const r = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@ims.local', password: 'Password123!' });
  token = r.body.data?.token;
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/stock/alerts/low-stock', () => {

  test('200 with low-stock items array', async () => {
    stockRepo.findLowStock.mockResolvedValue([
      { product_id: 1, sku: 'W-001', name: 'Widget', total_stock: 2, reorder_level: 10, shortage: 8 },
    ]);
    const res = await request(app)
      .get('/api/v1/stock/alerts/low-stock')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].shortage).toBe(8);
  });

  test('401 without token', async () => {
    const res = await request(app).get('/api/v1/stock/alerts/low-stock');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/stock/product/:productId', () => {

  test('200 with stock levels for existing product', async () => {
    productRepo.findById.mockResolvedValue({ product_id: 1, name: 'Widget', sku: 'W-001' });
    stockRepo.findByProduct.mockResolvedValue([{ warehouse_id: 1, qty_on_hand: 50 }]);
    const res = await request(app)
      .get('/api/v1/stock/product/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('product');
    expect(res.body.data).toHaveProperty('levels');
  });

  test('404 for non-existent product', async () => {
    productRepo.findById.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/v1/stock/product/9999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/stock/adjust', () => {

  const validBody = { product_id: 1, warehouse_id: 1, txn_type: 'IN', quantity: 10, notes: 'test' };

  test('200 on valid adjustment', async () => {
    productRepo.findById.mockResolvedValue({ product_id: 1, name: 'Widget' });
    warehouseRepo.findById.mockResolvedValue({ warehouse_id: 1, warehouse_name: 'Main' });
    stockRepo.callStockMovement.mockResolvedValue(undefined);
    stockRepo.findByProduct.mockResolvedValue([{ warehouse_id: 1, qty_on_hand: 60 }]);
    const res = await request(app)
      .post('/api/v1/stock/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 on missing product_id', async () => {
    const { product_id, ...body } = validBody;
    const res = await request(app)
      .post('/api/v1/stock/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('400 on quantity = 0', async () => {
    const res = await request(app)
      .post('/api/v1/stock/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBody, quantity: 0 });
    expect(res.status).toBe(400);
  });

  test('400 on invalid txn_type', async () => {
    const res = await request(app)
      .post('/api/v1/stock/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBody, txn_type: 'BOGUS' });
    expect(res.status).toBe(400);
  });

  test('401 without token', async () => {
    const res = await request(app).post('/api/v1/stock/adjust').send(validBody);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/stock/transfer', () => {

  test('400 when source equals destination warehouse', async () => {
    productRepo.findById.mockResolvedValue({ product_id: 1 });
    const res = await request(app)
      .post('/api/v1/stock/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: 1, from_warehouse_id: 1, to_warehouse_id: 1, quantity: 5 });
    expect(res.status).toBe(400);
  });

  test('400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/stock/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: 1 });
    expect(res.status).toBe(400);
  });
});
