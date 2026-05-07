/**
 * Unit Tests — Error Handler Middleware
 */

const { errorHandler, AppError } = require('../middleware/errorHandler');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = { method: 'GET', originalUrl: '/api/v1/test' };

// ─────────────────────────────────────────────────────────────────────────────
describe('AppError', () => {

  test('creates error with correct statusCode and isOperational flag', () => {
    const err = new AppError('Product not found', 404);
    expect(err.message).toBe('Product not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  test('defaults to 400 status code', () => {
    const err = new AppError('Bad input');
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('errorHandler middleware', () => {

  test('handles AppError with its statusCode', () => {
    const res  = mockRes();
    const next = jest.fn();
    const err  = new AppError('Not found', 404);

    errorHandler(err, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Not found',
    }));
  });

  test('handles JsonWebTokenError as 401', () => {
    const res  = mockRes();
    const err  = new Error('jwt malformed');
    err.name   = 'JsonWebTokenError';

    errorHandler(err, mockReq, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('handles TokenExpiredError as 401', () => {
    const res  = mockRes();
    const err  = new Error('jwt expired');
    err.name   = 'TokenExpiredError';

    errorHandler(err, mockReq, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('handles Sequelize validation error as 422', () => {
    const res = mockRes();
    const err = {
      name:   'SequelizeValidationError',
      errors: [{ path: 'email', message: 'Invalid email' }],
    };

    errorHandler(err, mockReq, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.any(Array) })
    );
  });

  test('handles Sequelize unique constraint error as 422', () => {
    const res = mockRes();
    const err = {
      name:   'SequelizeUniqueConstraintError',
      errors: [{ path: 'sku', message: 'SKU must be unique' }],
    };

    errorHandler(err, mockReq, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('returns 500 for unknown errors', () => {
    const res = mockRes();
    const err = new Error('Something exploded');

    errorHandler(err, mockReq, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
