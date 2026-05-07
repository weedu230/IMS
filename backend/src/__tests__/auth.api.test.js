/**
 * Integration Tests — Auth API (Supertest, no real DB)
 * All DB access is mocked at the repository layer.
 */

// Prevent Sequelize from connecting to MySQL
jest.mock('../config/database', () => ({
  sequelize: {
    authenticate:    jest.fn().mockResolvedValue(true),
    define:          jest.fn().mockReturnValue({}),
    transaction:     jest.fn(),
    query:           jest.fn().mockResolvedValue([[]]),
  },
  connectDB: jest.fn().mockResolvedValue(true),
}));

// Mock all models so they never touch the DB
jest.mock('../models', () => ({
  Category: {}, Warehouse: {}, Employee: {}, Supplier: {},
  Product: {}, ProductSupplier: {}, Stock: {}, StockTransaction: {},
  Customer: {}, CustomerOrder: {}, CustomerOrderItem: {},
  PurchaseOrder: {}, POItem: {}, AuditLog: {},
}));

jest.mock('../repositories/auth.repository');

const request  = require('supertest');
const bcrypt   = require('bcryptjs');
const app      = require('../app');
const authRepo = require('../repositories/auth.repository');

const HASH = bcrypt.hashSync('Password123!', 4);

const makeEmp = (overrides = {}) => ({
  emp_id: 1, name: 'Test Admin', email: 'admin@ims.local',
  role: 'admin', is_active: true, password_hash: HASH,
  toJSON: () => ({ emp_id: 1, name: 'Test Admin', email: 'admin@ims.local', role: 'admin' }),
  ...overrides,
});

const getToken = async () => {
  authRepo.findByEmail.mockResolvedValue(makeEmp());
  authRepo.touchLogin.mockResolvedValue([1]);
  const r = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@ims.local', password: 'Password123!' });
  return r.body.data?.token;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {

  test('200 with token on valid credentials', async () => {
    authRepo.findByEmail.mockResolvedValue(makeEmp());
    authRepo.touchLogin.mockResolvedValue([1]);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ims.local', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.employee.password_hash).toBeUndefined();
  });

  test('401 on wrong password', async () => {
    authRepo.findByEmail.mockResolvedValue(makeEmp());
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ims.local', password: 'WrongPass99' });
    expect(res.status).toBe(401);
  });

  test('401 on unknown email', async () => {
    authRepo.findByEmail.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password123!' });
    expect(res.status).toBe(401);
  });

  test('400 on missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('400 on malformed email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'Password123!' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {

  test('200 with user profile on valid token', async () => {
    authRepo.findById.mockResolvedValue(makeEmp());
    const token = await getToken();
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@ims.local');
  });

  test('401 without Authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });
});

describe('Health & 404', () => {
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('unknown route returns 404', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
  });
});
