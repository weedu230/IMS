const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductSupplier = sequelize.define('ProductSupplier', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  product_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  supplier_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  supplier_sku: {
    type:      DataTypes.STRING(100),
    allowNull: true,
  },
  unit_cost: {
    type:         DataTypes.DECIMAL(10, 2),
    allowNull:    false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Unit cost cannot be negative' },
    },
  },
  is_preferred: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },
  created_at: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'product_supplier',
  timestamps: false,
});

module.exports = ProductSupplier;
