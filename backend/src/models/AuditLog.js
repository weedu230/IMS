const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  log_id: {
    type:          DataTypes.BIGINT,
    primaryKey:    true,
    autoIncrement: true,
  },
  table_name: {
    type:      DataTypes.STRING(50),
    allowNull: false,
  },
  record_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type:      DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'),
    allowNull: false,
  },
  old_values: {
    type:      DataTypes.JSON,
    allowNull: true,
  },
  new_values: {
    type:      DataTypes.JSON,
    allowNull: true,
  },
  changed_by: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  changed_at: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'audit_log',
  timestamps: false,
});

module.exports = AuditLog;
