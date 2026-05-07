const warehouseRepo = require('../repositories/warehouse.repository');
const { AppError }  = require('../middleware/errorHandler');

class WarehouseService {
  async getAll(query)   { return warehouseRepo.findAllPaginated(query); }

  async getById(id) {
    const w = await warehouseRepo.findByIdFull(id);
    if (!w) throw new AppError('Warehouse not found', 404);
    return w;
  }

  async create(data, empId) {
    const w = await warehouseRepo.create(data);
    await warehouseRepo.audit({ table_name:'warehouse', record_id: w.warehouse_id,
      action:'INSERT', new_values: w.toJSON(), changed_by: empId });
    return w;
  }

  async update(id, data, empId) {
    const existing = await warehouseRepo.findById(id);
    if (!existing) throw new AppError('Warehouse not found', 404);
    const old = existing.toJSON();
    await warehouseRepo.update(id, data);
    const updated = await warehouseRepo.findById(id);
    await warehouseRepo.audit({ table_name:'warehouse', record_id: id,
      action:'UPDATE', old_values: old, new_values: updated.toJSON(), changed_by: empId });
    return updated;
  }

  async deactivate(id, empId) {
    const existing = await warehouseRepo.findById(id);
    if (!existing) throw new AppError('Warehouse not found', 404);
    await warehouseRepo.update(id, { is_active: false });
    return { message: 'Warehouse deactivated' };
  }
}
module.exports = new WarehouseService();
