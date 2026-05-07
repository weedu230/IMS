const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  customer_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate:  { notEmpty: { msg: 'Customer name is required' } },
  },
  email: {
    type:      DataTypes.STRING(150),
    allowNull: true,
    unique:    true,
    validate: {
      isEmail: { msg: 'Must be a valid email address' },
    },
  },
  phone: {
    type:      DataTypes.STRING(30),
    allowNull: true,
  },
  address: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  credit_limit: {
    type:         DataTypes.DECIMAL(12, 2),
    allowNull:    false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Credit limit cannot be negative' },
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
  tableName:  'customer',
  timestamps: false,
});

module.exports = Customer;
