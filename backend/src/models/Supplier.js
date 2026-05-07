const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  supplier_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  company_name: {
    type:      DataTypes.STRING(200),
    allowNull: false,
    validate:  { notEmpty: { msg: 'Company name is required' } },
  },
  contact_person: {
    type:      DataTypes.STRING(150),
    allowNull: true,
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
  lead_time_days: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 7,
    validate: {
      min: { args: [0], msg: 'Lead time cannot be negative' },
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
  tableName:  'supplier',
  timestamps: false,
});

module.exports = Supplier;
