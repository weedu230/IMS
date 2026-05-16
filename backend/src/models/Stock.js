const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Stock = sequelize.define('Stock', {
  stock_id: {
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
  bin_location: {
    type:         DataTypes.STRING(100),
    allowNull:    false,
    defaultValue: 'MAIN',
  },
  qty_on_hand: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Stock quantity cannot be negative' },
    },
  },
  last_updated: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'stock',
  timestamps: false,
});

module.exports = Stock;
