const authService = require('../services/auth.service');
const { sendSuccess, sendCreated } = require('../utils/response');

class AuthController {

  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return sendCreated(res, result, 'Account created successfully');
    } catch (err) { next(err); }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, result, 'Login successful');
    } catch (err) { next(err); }
  }

  async getMe(req, res, next) {
    try {
      const employee = await authService.getMe(req.user.emp_id);
      return sendSuccess(res, employee);
    } catch (err) { next(err); }
  }

  async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.body;
      const result = await authService.changePassword(
        req.user.emp_id, current_password, new_password
      );
      return sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

module.exports = new AuthController();
