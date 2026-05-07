const jwt            = require('jsonwebtoken');
const bcrypt         = require('bcryptjs');
const authRepo       = require('../repositories/auth.repository');
const { AppError }   = require('../middleware/errorHandler');
require('dotenv').config();

class AuthService {

  /** Sign a JWT with the employee's identity payload */
  _signToken(employee) {
    return jwt.sign(
      {
        emp_id: employee.emp_id,
        email:  employee.email,
        role:   employee.role,
        name:   employee.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
  }

  /** Register a new employee account */
  async register(data) {
    const existing = await authRepo.findByEmail(data.email);
    if (existing) throw new AppError('Email already registered', 409);

    // password_hash field gets hashed by the model's beforeCreate hook
    const employee = await authRepo.create({
      name:          data.name,
      email:         data.email.toLowerCase().trim(),
      password_hash: data.password,   // plain — hook hashes it
      role:          data.role || 'staff',
      warehouse_id:  data.warehouse_id || null,
    });

    const token = this._signToken(employee);
    return { employee: this._safe(employee), token };
  }

  /** Login: verify credentials and return JWT */
  async login(email, password) {
    const employee = await authRepo.findByEmail(email);
    if (!employee || !employee.is_active) {
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    await authRepo.touchLogin(employee.emp_id);
    const token = this._signToken(employee);
    return { employee: this._safe(employee), token };
  }

  /** Return current user profile (from JWT payload) */
  async getMe(emp_id) {
    const employee = await authRepo.findById(emp_id);
    if (!employee) throw new AppError('Account not found', 404);
    return this._safe(employee);
  }

  /** Change password — requires current password for confirmation */
  async changePassword(emp_id, currentPassword, newPassword) {
    const employee = await authRepo.findByEmail(
      (await authRepo.findById(emp_id)).email
    );
    const valid = await bcrypt.compare(currentPassword, employee.password_hash);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    if (currentPassword === newPassword) {
      throw new AppError('New password must differ from current password', 400);
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const newHash = await bcrypt.hash(newPassword, rounds);
    await authRepo.updatePassword(emp_id, newHash);
    return { message: 'Password updated successfully' };
  }

  /** Strip sensitive fields before sending to client */
  _safe(emp) {
    const obj = emp.toJSON ? emp.toJSON() : { ...emp };
    delete obj.password_hash;
    return obj;
  }
}

module.exports = new AuthService();
