/**
 * models/index.js
 *
 * Single import point for all Sequelize models.
 * Defines every association so foreign-key joins work with `include: []`.
 *
 * Usage anywhere in the app:
 *   const { Product, Category, Stock } = require('./models');
 */

const Category         = require('./Category');
const Warehouse        = require('./Warehouse');
const Employee         = require('./Employee');
const Supplier         = require('./Supplier');
const Product          = require('./Product');
const ProductSupplier  = require('./ProductSupplier');
const Stock            = require('./Stock');
const StockTransaction = require('./StockTransaction');
const Customer         = require('./Customer');
const CustomerOrder    = require('./CustomerOrder');
const CustomerOrderItem = require('./CustomerOrderItem');
const PurchaseOrder    = require('./PurchaseOrder');
const POItem           = require('./POItem');
const AuditLog         = require('./AuditLog');

// ═══════════════════════════════════════════════════════════════════════════════
// ASSOCIATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Category (self-referencing hierarchy) ─────────────────────────────────────
Category.hasMany(Category,  { foreignKey: 'parent_id', as: 'subCategories' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parentCategory' });

// ── Category ↔ Product ────────────────────────────────────────────────────────
Category.hasMany(Product,   { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ── Product ↔ Supplier  (M:N via product_supplier) ───────────────────────────
Product.belongsToMany(Supplier, {
  through:    ProductSupplier,
  foreignKey: 'product_id',
  otherKey:   'supplier_id',
  as:         'suppliers',
});
Supplier.belongsToMany(Product, {
  through:    ProductSupplier,
  foreignKey: 'supplier_id',
  otherKey:   'product_id',
  as:         'products',
});
// Direct access to the bridge row
Product.hasMany(ProductSupplier,  { foreignKey: 'product_id',  as: 'productSuppliers' });
Supplier.hasMany(ProductSupplier, { foreignKey: 'supplier_id', as: 'productSuppliers' });
ProductSupplier.belongsTo(Product,  { foreignKey: 'product_id',  as: 'product' });
ProductSupplier.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// ── Warehouse ↔ Employee (manager assignment) ─────────────────────────────────
Warehouse.hasMany(Employee, { foreignKey: 'warehouse_id', as: 'employees' });
Employee.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// ── Stock: Product + Warehouse → qty_on_hand ─────────────────────────────────
Product.hasMany(Stock,   { foreignKey: 'product_id',   as: 'stockLevels' });
Warehouse.hasMany(Stock, { foreignKey: 'warehouse_id', as: 'stockLevels' });
Stock.belongsTo(Product,   { foreignKey: 'product_id',   as: 'product' });
Stock.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// ── StockTransaction: Product + Warehouse + Employee ─────────────────────────
Product.hasMany(StockTransaction,   { foreignKey: 'product_id',   as: 'transactions' });
Warehouse.hasMany(StockTransaction, { foreignKey: 'warehouse_id', as: 'transactions' });
Employee.hasMany(StockTransaction,  { foreignKey: 'created_by',   as: 'transactions' });
StockTransaction.belongsTo(Product,   { foreignKey: 'product_id',   as: 'product' });
StockTransaction.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
StockTransaction.belongsTo(Employee,  { foreignKey: 'created_by',   as: 'createdBy' });

// ── PurchaseOrder: Supplier + Employee ───────────────────────────────────────
Supplier.hasMany(PurchaseOrder,      { foreignKey: 'supplier_id', as: 'purchaseOrders' });
Employee.hasMany(PurchaseOrder,      { foreignKey: 'created_by',  as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Supplier,    { foreignKey: 'supplier_id', as: 'supplier' });
PurchaseOrder.belongsTo(Employee,    { foreignKey: 'created_by',  as: 'createdBy' });

// ── POItem: PurchaseOrder + Product + Warehouse ───────────────────────────────
PurchaseOrder.hasMany(POItem, { foreignKey: 'po_id', as: 'items' });
POItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id',         as: 'purchaseOrder' });
POItem.belongsTo(Product,       { foreignKey: 'product_id',    as: 'product' });
POItem.belongsTo(Warehouse,     { foreignKey: 'warehouse_id',  as: 'warehouse' });

// ── CustomerOrder: Customer + Employee ───────────────────────────────────────
Customer.hasMany(CustomerOrder,      { foreignKey: 'customer_id', as: 'orders' });
Employee.hasMany(CustomerOrder,      { foreignKey: 'created_by',  as: 'customerOrders' });
CustomerOrder.belongsTo(Customer,    { foreignKey: 'customer_id', as: 'customer' });
CustomerOrder.belongsTo(Employee,    { foreignKey: 'created_by',  as: 'createdBy' });

// ── CustomerOrderItem: CustomerOrder + Product + Warehouse ───────────────────
CustomerOrder.hasMany(CustomerOrderItem, { foreignKey: 'order_id', as: 'items' });
CustomerOrderItem.belongsTo(CustomerOrder, { foreignKey: 'order_id',    as: 'order' });
CustomerOrderItem.belongsTo(Product,       { foreignKey: 'product_id',  as: 'product' });
CustomerOrderItem.belongsTo(Warehouse,     { foreignKey: 'warehouse_id',as: 'warehouse' });

// ── AuditLog: Employee ────────────────────────────────────────────────────────
Employee.hasMany(AuditLog, { foreignKey: 'changed_by', as: 'auditLogs' });
AuditLog.belongsTo(Employee, { foreignKey: 'changed_by', as: 'changedBy' });

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
  Category,
  Warehouse,
  Employee,
  Supplier,
  Product,
  ProductSupplier,
  Stock,
  StockTransaction,
  Customer,
  CustomerOrder,
  CustomerOrderItem,
  PurchaseOrder,
  POItem,
  AuditLog,
};
