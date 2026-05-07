const employeeRepo = require('../repositories/employee.repository');
const { AppError } = require('../middleware/errorHandler');
const bcrypt       = require('bcryptjs');

class EmployeeService {
  async getAll(query)   { return employeeRepo.findAllPaginated(query); }

  async getById(id) {
    const e = await employeeRepo.findById(id);
    if (!e) throw new AppError('Employee not found', 404);
    return e;
  }

  async update(id, data, empId) {
    const existing = await employeeRepo.findById(id);
    if (!existing) throw new AppError('Employee not found', 404);
    // Don't allow role escalation unless admin
    const old = existing.toJSON();
    await employeeRepo.update(id, data);
    const updated = await employeeRepo.findById(id);
    await employeeRepo.audit({ table_name:'employee', record_id: id,
      action:'UPDATE', old_values: old, new_values: updated.toJSON(), changed_by: empId });
    return updated;
  }

  async deactivate(id, empId) {
    if (id === empId) throw new AppError('You cannot deactivate your own account', 400);
    const existing = await employeeRepo.findById(id);
    if (!existing) throw new AppError('Employee not found', 404);
    await employeeRepo.update(id, { is_active: false });
    return { message: 'Employee deactivated' };
  }

  async resetPassword(empId, newPassword, adminId) {
    const existing = await employeeRepo.findById(empId);
    if (!existing) throw new AppError('Employee not found', 404);
    if (empId === adminId) throw new AppError('You cannot reset your own password via this endpoint', 400);

    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, rounds);
    
    await employeeRepo.updatePassword(empId, hashedPassword);
    
    // Audit the password reset
    await employeeRepo.audit({
      table_name: 'employee',
      record_id: empId,
      action: 'UPDATE',
      old_values: { password_hash: '***' },
      new_values: { password_hash: '***' },
      changed_by: adminId,
    });

    return { message: 'Employee password has been reset' };
  }
}
module.exports = new EmployeeService();
