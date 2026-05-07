const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { PO_STATUS } = require('../utils/constants');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  po_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  supplier_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  order_date: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  expected_date: {
    type:      DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type:         DataTypes.ENUM(...Object.values(PO_STATUS)),
    allowNull:    false,
    defaultValue: PO_STATUS.DRAFT,
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
  tableName:  'purchase_order',
  timestamps: false,
});

module.exports = PurchaseOrder;
