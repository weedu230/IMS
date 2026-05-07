const supplierRepo = require('../repositories/supplier.repository');
const { AppError } = require('../middleware/errorHandler');

class SupplierService {
  async getAll(query)   { return supplierRepo.findAllPaginated(query); }

  async getById(id) {
    const s = await supplierRepo.findByIdWithProducts(id);
    if (!s) throw new AppError('Supplier not found', 404);
    return s;
  }

  async create(data, empId) {
    const sup = await supplierRepo.create(data);
    await supplierRepo.audit({ table_name:'supplier', record_id: sup.supplier_id,
      action:'INSERT', new_values: sup.toJSON(), changed_by: empId });
    return sup;
  }

  async update(id, data, empId) {
    const existing = await supplierRepo.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404);
    const old = existing.toJSON();
    await supplierRepo.update(id, data);
    const updated = await supplierRepo.findById(id);
    await supplierRepo.audit({ table_name:'supplier', record_id: id,
      action:'UPDATE', old_values: old, new_values: updated.toJSON(), changed_by: empId });
    return updated;
  }

  async deactivate(id, empId) {
    const existing = await supplierRepo.findById(id);
    if (!existing) throw new AppError('Supplier not found', 404);
    await supplierRepo.update(id, { is_active: false });
    await supplierRepo.audit({ table_name:'supplier', record_id: id,
      action:'UPDATE', old_values: { is_active: true }, new_values: { is_active: false },
      changed_by: empId });
    return { message: 'Supplier deactivated' };
  }
}
module.exports = new SupplierService();
