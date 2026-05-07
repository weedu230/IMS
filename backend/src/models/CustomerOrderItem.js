const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerOrderItem = sequelize.define('CustomerOrderItem', {
  item_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  order_id: {
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
  qty_reserved: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Reserved quantity cannot be negative' },
    },
  },
  qty_shipped: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Shipped quantity cannot be negative' },
    },
  },
  unit_price: {
    type:      DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Unit price cannot be negative' },
    },
  },
}, {
  tableName:  'customer_order_item',
  timestamps: false,
});

module.exports = CustomerOrderItem;
