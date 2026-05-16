const jwt = require('jsonwebtoken');
const { sendUnauthorized, sendForbidden } = require('../utils/response');
require('dotenv').config();

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const authenticateWithToken = (token, req, res, next) => {
  if (!token) {
    return sendUnauthorized(res, 'No token provided. Authorization header must be: Bearer <token>');
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * authenticate — verifies the Bearer JWT in the Authorization header.
 * On success, attaches `req.user = { emp_id, email, role }` and calls next().
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No token provided. Authorization header must be: Bearer <token>');
  }

  const token = authHeader.split(' ')[1];
  return authenticateWithToken(token, req, res, next);
};

const authenticateStream = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.query.token;

  if (!token) {
    return sendUnauthorized(res, 'No token provided.');
  }

  return authenticateWithToken(token, req, res, next);
};

/**
 * authorize(...roles) — RBAC guard factory.
 * Use AFTER authenticate.
 *
 * @example
 *   router.delete('/products/:id',
 *     authenticate,
 *     authorize('admin', 'manager'),
 *     ProductController.delete
 *   );
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Not authenticated');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(
        res,
        `Role '${req.user.role}' is not permitted to perform this action`
      );
    }
    next();
  };
};

module.exports = { authenticate, authenticateStream, authorize };
