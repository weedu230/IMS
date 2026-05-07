const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
  warehouse_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  warehouse_name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate:  { notEmpty: { msg: 'Warehouse name cannot be empty' } },
  },
  location: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    validate:  { notEmpty: { msg: 'Location is required' } },
  },
  capacity: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Capacity cannot be negative' },
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
}, {
  tableName:  'warehouse',
  timestamps: false,
});

module.exports = Warehouse;
