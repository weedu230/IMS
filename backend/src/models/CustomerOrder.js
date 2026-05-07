const { DataTypes }  = require('sequelize');
const { sequelize }  = require('../config/database');
const { ORDER_STATUS } = require('../utils/constants');

const CustomerOrder = sequelize.define('CustomerOrder', {
  order_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  customer_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  order_date: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type:         DataTypes.ENUM(...Object.values(ORDER_STATUS)),
    allowNull:    false,
    defaultValue: ORDER_STATUS.PENDING,
  },
  shipping_address: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  total_amount: {
    type:         DataTypes.DECIMAL(12, 2),
    allowNull:    false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Total amount cannot be negative' },
    },
  },
  notes: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  updated_at: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'customer_order',
  timestamps: false,
});

module.exports = CustomerOrder;
