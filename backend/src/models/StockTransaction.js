const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { TXN_TYPE }  = require('../utils/constants');

const StockTransaction = sequelize.define('StockTransaction', {
  txn_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  product_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  warehouse_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  txn_type: {
    type:      DataTypes.ENUM(...Object.values(TXN_TYPE)),
    allowNull: false,
  },
  quantity: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Transaction quantity must be at least 1' },
    },
  },
  txn_date: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ref_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  notes: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName:  'stock_transaction',
  timestamps: false,
});

module.exports = StockTransaction;
