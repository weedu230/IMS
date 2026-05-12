const productRepo        = require('../repositories/product.repository');
const { AppError }       = require('../middleware/errorHandler');
const { ProductSupplier } = require('../models');
const { adaptProductImportRows } = require('../utils/productImport.adapter');

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

  async previewImport(rows) {
    const adaptedRows = adaptProductImportRows(rows);
    const validation = adaptedRows.map((row, index) => ({
      row: index + 1,
      valid: !!(row.name && row.sku),
      missing: [
        !row.name ? 'name' : null,
        !row.sku ? 'sku' : null,
      ].filter(Boolean),
    }));

    return { rows: adaptedRows, validation };
  }

  async importRows(rows, empId) {
    const adaptedRows = adaptProductImportRows(rows);
    const results = [];

    for (const row of adaptedRows) {
      if (!row.name || !row.sku) {
        results.push({ sku: row.sku || null, status: 'skipped', reason: 'Missing name or sku' });
        continue;
      }

      const existing = await productRepo.findBySku(row.sku);
      if (existing) {
        results.push({ sku: row.sku, status: 'skipped', reason: 'SKU already exists' });
        continue;
      }

      const created = await this.create({
        name: row.name,
        sku: row.sku,
        unit_price: row.unit_price,
        category_id: row.category_id,
        reorder_level: row.reorder_level,
        reorder_qty: row.reorder_qty,
        is_active: row.is_active,
      }, empId);

      results.push({ sku: row.sku, status: 'created', product_id: created.product_id });
    }

    return { total: adaptedRows.length, results };
  }
}

module.exports = new ProductService();
