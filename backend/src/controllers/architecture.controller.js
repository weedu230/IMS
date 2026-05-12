const architectureService = require('../services/architecture.service');
const { sendSuccess } = require('../utils/response');

const getUml = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      await architectureService.getUml(req.query.type),
      'Architecture UML generated successfully'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getUml };