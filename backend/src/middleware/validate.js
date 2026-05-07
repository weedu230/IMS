const { validationResult } = require('express-validator');
const { sendBadRequest } = require('../utils/response');

/**
 * validate — runs after express-validator chains.
 * If any validation errors exist, returns 400 with structured error list.
 * Otherwise calls next().
 *
 * Usage:
 *   router.post('/products', [...validationChains], validate, ProductController.create);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
      value:   e.value,
    }));
    return sendBadRequest(res, 'Validation failed', formatted);
  }
  next();
};

module.exports = { validate };
