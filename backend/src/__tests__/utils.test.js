/**
 * Unit Tests — Utils
 * Tests response helpers and constants (no DB needed)
 */

const { sendSuccess, sendCreated, sendError, sendNotFound,
        sendUnauthorized, sendForbidden, sendBadRequest } = require('../utils/response');
const { ROLES, PO_STATUS, ORDER_STATUS, TXN_TYPE, PAGINATION } = require('../utils/constants');

// ── Mock Express res object ───────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// ─────────────────────────────────────────────────────────────────────────────
describe('Response Helpers', () => {

  test('sendSuccess returns 200 with success:true and data', () => {
    const res = mockRes();
    sendSuccess(res, { id: 1 }, 'OK');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'OK',
      data:    { id: 1 },
    }));
  });

  test('sendCreated returns 201', () => {
    const res = mockRes();
    sendCreated(res, { id: 5 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('sendError returns correct status and success:false', () => {
    const res = mockRes();
    sendError(res, 'Something went wrong', 500);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Something went wrong',
    }));
  });

  test('sendNotFound returns 404', () => {
    const res = mockRes();
    sendNotFound(res, 'Product not found');
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('sendUnauthorized returns 401', () => {
    const res = mockRes();
    sendUnauthorized(res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('sendForbidden returns 403', () => {
    const res = mockRes();
    sendForbidden(res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('sendBadRequest returns 400 with errors array', () => {
    const res  = mockRes();
    const errs = [{ field: 'email', message: 'Invalid email' }];
    sendBadRequest(res, 'Validation failed', errs);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: errs,
    }));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Constants', () => {

  test('ROLES has exactly 4 values', () => {
    expect(Object.values(ROLES)).toHaveLength(4);
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.VIEWER).toBe('viewer');
  });

  test('PO_STATUS covers complete lifecycle', () => {
    const statuses = Object.values(PO_STATUS);
    expect(statuses).toContain('draft');
    expect(statuses).toContain('approved');
    expect(statuses).toContain('received');
    expect(statuses).toContain('cancelled');
  });

  test('ORDER_STATUS covers complete order lifecycle', () => {
    const statuses = Object.values(ORDER_STATUS);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('confirmed');
    expect(statuses).toContain('fulfilled');
    expect(statuses).toContain('cancelled');
  });

  test('TXN_TYPE includes all required movement types', () => {
    const types = Object.values(TXN_TYPE);
    expect(types).toContain('IN');
    expect(types).toContain('OUT');
    expect(types).toContain('TRANSFER_IN');
    expect(types).toContain('TRANSFER_OUT');
    expect(types).toContain('ADJUSTMENT');
  });

  test('PAGINATION defaults are reasonable', () => {
    expect(PAGINATION.DEFAULT_PAGE).toBe(1);
    expect(PAGINATION.DEFAULT_LIMIT).toBe(20);
    expect(PAGINATION.MAX_LIMIT).toBeGreaterThan(PAGINATION.DEFAULT_LIMIT);
  });

  test('constants are frozen (immutable)', () => {
    const before = ROLES.ADMIN; ROLES.ADMIN = 'hacked'; expect(ROLES.ADMIN).toBe(before); // frozen — mutation silently ignored
    const beforePO = PO_STATUS.DRAFT; PO_STATUS.DRAFT = 'hacked'; expect(PO_STATUS.DRAFT).toBe(beforePO);
  });
});
