const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pick = (row, keys, fallback = null) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return fallback;
};

const adaptProductImportRow = (row = {}) => ({
  name: pick(row, ['name', 'product_name', 'Product Name', 'ProductName']),
  sku: pick(row, ['sku', 'SKU', 'product_sku', 'Product SKU']),
  unit_price: toNumber(pick(row, ['unit_price', 'Unit Price', 'price', 'Price']), 0),
  category_id: pick(row, ['category_id', 'Category ID', 'categoryId'], null),
  reorder_level: toNumber(pick(row, ['reorder_level', 'Reorder Level', 'min_stock']), 10),
  reorder_qty: toNumber(pick(row, ['reorder_qty', 'Reorder Qty', 'reorder_quantity']), 50),
  is_active: pick(row, ['is_active', 'Active'], true),
  raw: row,
});

const adaptProductImportRows = (rows = []) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(adaptProductImportRow);
};

module.exports = { adaptProductImportRow, adaptProductImportRows };