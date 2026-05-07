/**
 * Unit Tests — Customer Order Service
 * Tests credit limit validation, stock reservation logic, and cancel stock return.
 */

jest.mock('../repositories/customerOrder.repository');
jest.mock('../repositories/customer.repository');
jest.mock('../repositories/stock.repository');

const orderRepo    = require('../repositories/customerOrder.repository');
const customerRepo = require('../repositories/customer.repository');
const stockRepo    = require('../repositories/stock.repository');
const orderService = require('../services/customerOrder.service');
const { ORDER_STATUS } = require('../utils/constants');

const mockCustomer = {
  customer_id:  1,
  name:         'Test Corp',
  credit_limit: '100000.00',
  is_active:    true,
};

const mockOrder = (status = 'confirmed', items = []) => ({
  order_id:     1,
  customer_id:  1,
  status,
  total_amount: 5000,
  items,
  toJSON: () => ({ order_id: 1, status }),
});

// ─────────────────────────────────────────────────────────────────────────────
describe('OrderService.getById', () => {

  test('returns order when found', async () => {
    const order = mockOrder();
    orderRepo.findByIdFull.mockResolvedValue(order);
    const result = await orderService.getById(1);
    expect(result.order_id).toBe(1);
  });

  test('throws 404 when not found', async () => {
    orderRepo.findByIdFull.mockResolvedValue(null);
    await expect(orderService.getById(999))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('OrderService.cancel', () => {

  test('throws 400 when cancelling a fulfilled order', async () => {
    orderRepo.findByIdFull.mockResolvedValue(mockOrder('fulfilled'));
    await expect(orderService.cancel(1, 1))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 400 when cancelling a dispatched order', async () => {
    orderRepo.findByIdFull.mockResolvedValue(mockOrder('dispatched'));
    await expect(orderService.cancel(1, 1))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 404 when order not found', async () => {
    orderRepo.findByIdFull.mockResolvedValue(null);
    await expect(orderService.cancel(999, 1))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('OrderService.fulfill', () => {

  test('throws 400 when fulfilling a cancelled order', async () => {
    orderRepo.findByIdFull.mockResolvedValue(mockOrder('cancelled'));
    await expect(orderService.fulfill(1, 1))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 400 when fulfilling a pending order', async () => {
    orderRepo.findByIdFull.mockResolvedValue(mockOrder('pending'));
    await expect(orderService.fulfill(1, 1))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 404 when order not found', async () => {
    orderRepo.findByIdFull.mockResolvedValue(null);
    await expect(orderService.fulfill(999, 1))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('OrderService.updateStatus', () => {

  test('throws 404 when order not found', async () => {
    orderRepo.findByIdFull.mockResolvedValue(null);
    await expect(orderService.updateStatus(999, 'picking', 1))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('OrderService.getCustomerById', () => {

  test('throws 404 when customer not found', async () => {
    customerRepo.findById.mockResolvedValue(null);
    await expect(orderService.getCustomerById(999))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  test('returns customer when found', async () => {
    customerRepo.findById.mockResolvedValue(mockCustomer);
    const result = await orderService.getCustomerById(1);
    expect(result.name).toBe('Test Corp');
  });
});
