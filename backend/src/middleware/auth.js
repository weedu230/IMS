const jwt = require('jsonwebtoken');
const { sendUnauthorized, sendForbidden } = require('../utils/response');
require('dotenv').config();

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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { emp_id, email, role, iat, exp }
    next();
  } catch (err) {
    // Let the global error handler deal with JWT-specific errors
    next(err);
  }
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

module.exports = { authenticate, authorize };
