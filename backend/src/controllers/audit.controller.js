const auditService = require('../services/audit.service');
const { sendSuccess } = require('../utils/response');

const getLogs = async (req, res, next) => {
  try {
    return sendSuccess(res, await auditService.getLogs(req.query));
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs };
