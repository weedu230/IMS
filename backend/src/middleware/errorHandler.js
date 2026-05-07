const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

/**
 * Global error-handling middleware.
 * Must be registered LAST in Express (after all routes).
 * Express identifies it by its 4-argument signature (err, req, res, next).
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log the full error internally
  logger.error(`${req.method} ${req.originalUrl} → ${err.message}`, err);

  // ─── Sequelize validation error ───────────────────────────────────────────
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return sendError(res, 'Validation failed', 422, errors);
  }

  // ─── Sequelize FK constraint ──────────────────────────────────────────────
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return sendError(res, 'Referenced record does not exist', 422);
  }

  // ─── JWT errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired. Please login again.', 401);
  }

  // ─── Known operational errors (thrown by services with a statusCode) ──────
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode || 400);
  }

  // ─── Unknown / programmer errors — do not leak details in production ──────
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  return sendError(res, message, statusCode);
};

/**
 * Custom operational error class.
 * Throw this in services/controllers to return predictable HTTP errors.
 *
 * @example  throw new AppError('Product not found', 404);
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode  = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
