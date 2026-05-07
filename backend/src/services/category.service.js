const categoryRepo = require('../repositories/category.repository');
const { AppError } = require('../middleware/errorHandler');

class CategoryService {

  async getAll(query)   { return categoryRepo.findAllPaginated(query); }

  async getById(id) {
    const cat = await categoryRepo.findByIdWithChildren(id);
    if (!cat) throw new AppError('Category not found', 404);
    return cat;
  }

  async create(data, empId) {
    if (data.parent_id) {
      const parent = await categoryRepo.findById(data.parent_id);
      if (!parent) throw new AppError('Parent category not found', 404);
    }
    const cat = await categoryRepo.create(data);
    await categoryRepo.audit({ table_name:'category', record_id: cat.category_id,
      action:'INSERT', new_values: cat.toJSON(), changed_by: empId });
    return cat;
  }

  async update(id, data, empId) {
    const existing = await categoryRepo.findById(id);
    if (!existing) throw new AppError('Category not found', 404);
    if (data.parent_id === id) throw new AppError('A category cannot be its own parent', 400);
    const old = existing.toJSON();
    await categoryRepo.update(id, data);
    const updated = await categoryRepo.findById(id);
    await categoryRepo.audit({ table_name:'category', record_id: id,
      action:'UPDATE', old_values: old, new_values: updated.toJSON(), changed_by: empId });
    return updated;
  }

  async remove(id, empId) {
    const existing = await categoryRepo.findById(id);
    if (!existing) throw new AppError('Category not found', 404);
    await categoryRepo.audit({ table_name:'category', record_id: id,
      action:'DELETE', old_values: existing.toJSON(), changed_by: empId });
    // Soft delete — set is_active=false via base.delete() won't work (no is_active on category)
    // So we just return a message; categories can only be removed if no products reference them
    const { Product } = require('../models');
    const productCount = await Product.count({ where: { category_id: id } });
    if (productCount > 0) throw new AppError(`Cannot delete: ${productCount} products reference this category`, 409);
    await categoryRepo.model.destroy({ where: { category_id: id } });
    return { message: 'Category deleted' };
  }
}

module.exports = new CategoryService();
