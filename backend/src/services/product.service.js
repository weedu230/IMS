const productRepo        = require('../repositories/product.repository');
const { AppError }       = require('../middleware/errorHandler');
const { ProductSupplier } = require('../models');

class ProductService {

  async getAll(query)   { return productRepo.findAllPaginated(query); }

  async getById(id) {
    const p = await productRepo.findByIdFull(id);
    if (!p) throw new AppError('Product not found', 404);
    return p;
  }

  async getBySku(sku) {
    const p = await productRepo.findBySku(sku);
    if (!p) throw new AppError('Product not found', 404);
    return p;
  }

  async create(data, empId) {
    const dup = await productRepo.findBySku(data.sku);
    if (dup) throw new AppError(`SKU '${data.sku}' already exists`, 409);

    const product = await productRepo.create(data);

    // Link suppliers if provided
    if (data.suppliers && Array.isArray(data.suppliers)) {
      for (const s of data.suppliers) {
        await ProductSupplier.create({
          product_id:   product.product_id,
          supplier_id:  s.supplier_id,
          unit_cost:    s.unit_cost    || 0,
          is_preferred: s.is_preferred || false,
          supplier_sku: s.supplier_sku || null,
        });
      }
    }

    await productRepo.audit({ table_name:'product', record_id: product.product_id,
      action:'INSERT', new_values: product.toJSON(), changed_by: empId });
    return productRepo.findByIdFull(product.product_id);
  }

  async update(id, data, empId) {
    const existing = await productRepo.findByIdFull(id);
    if (!existing) throw new AppError('Product not found', 404);

    if (data.sku && data.sku !== existing.sku) {
      const dup = await productRepo.findBySku(data.sku);
      if (dup) throw new AppError(`SKU '${data.sku}' already in use`, 409);
    }

    const old = existing.toJSON();
    await productRepo.update(id, data);
    const updated = await productRepo.findByIdFull(id);
    await productRepo.audit({ table_name:'product', record_id: id,
      action:'UPDATE', old_values: old, new_values: updated.toJSON(), changed_by: empId });
    return updated;
  }

  async deactivate(id, empId) {
    const existing = await productRepo.findById(id);
    if (!existing) throw new AppError('Product not found', 404);
    await productRepo.update(id, { is_active: false });
    await productRepo.audit({ table_name:'product', record_id: id,
      action:'UPDATE', old_values: { is_active: true }, new_values: { is_active: false },
      changed_by: empId });
    return { message: 'Product deactivated' };
  }
}

module.exports = new ProductService();
