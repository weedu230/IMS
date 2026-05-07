const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  product_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  name: {
    type:      DataTypes.STRING(200),
    allowNull: false,
    validate:  { notEmpty: { msg: 'Product name is required' } },
  },
  sku: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    unique:    true,
    validate: {
      notEmpty:  { msg: 'SKU is required' },
      // SKU format: letters, digits, hyphens only
      is:        { args: /^[A-Za-z0-9\-_]+$/, msg: 'SKU may only contain letters, digits, hyphens, and underscores' },
    },
  },
  category_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  unit_price: {
    type:      DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Unit price cannot be negative' },
    },
  },
  reorder_level: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 10,
    validate: {
      min: { args: [0], msg: 'Reorder level cannot be negative' },
    },
  },
  reorder_qty: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 50,
    validate: {
      min: { args: [0], msg: 'Reorder quantity cannot be negative' },
    },
  },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  created_at: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'product',
  timestamps: false,
});

module.exports = Product;
