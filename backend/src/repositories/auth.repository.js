const { Employee, Warehouse } = require('../models');

class AuthRepository {
  /** Find employee by email — includes password_hash via withPassword scope */
  async findByEmail(email) {
    return Employee.scope('withPassword').findOne({
      where:   { email: email.toLowerCase().trim() },
      include: [{ model: Warehouse, as: 'warehouse', attributes: ['warehouse_id','warehouse_name'] }],
    });
  }

  /** Find employee by PK — no password hash in result */
  async findById(emp_id) {
    return Employee.findByPk(emp_id, {
      include: [{ model: Warehouse, as: 'warehouse', attributes: ['warehouse_id','warehouse_name'] }],
    });
  }

  /** Create a new employee — password_hash is plain text, bcrypt hook fires automatically */
  async create(data) {
    return Employee.create(data);
  }

  /** Stamp last_login timestamp */
  async touchLogin(emp_id) {
    return Employee.update({ last_login: new Date() }, { where: { emp_id } });
  }

  /**
   * Update password with an already-bcrypt-hashed value.
   * Caller (auth.service) is responsible for hashing before calling this.
   * individualHooks: false — skips the beforeUpdate bcrypt hook to avoid double-hashing.
   */
  async updatePassword(emp_id, newHashedPassword) {
    return Employee.update(
      { password_hash: newHashedPassword },
      { where: { emp_id }, individualHooks: false }
    );
  }
}

module.exports = new AuthRepository();
