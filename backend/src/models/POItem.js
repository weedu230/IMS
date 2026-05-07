const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const POItem = sequelize.define('POItem', {
  po_item_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  po_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  product_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  warehouse_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  qty_ordered: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Quantity ordered must be at least 1' },
    },
  },
  unit_cost: {
    type:      DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Unit cost cannot be negative' },
    },
  },
  qty_received: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Received quantity cannot be negative' },
    },
  },
}, {
  tableName:  'po_item',
  timestamps: false,
});

module.exports = POItem;
