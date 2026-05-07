const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  category_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  category_name: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
    validate:  { notEmpty: { msg: 'Category name cannot be empty' } },
  },
  description: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  parent_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName:  'category',
  timestamps: false,
});

module.exports = Category;
