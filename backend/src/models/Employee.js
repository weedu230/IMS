const { DataTypes } = require('sequelize');
const bcrypt        = require('bcryptjs');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
  emp_id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  name: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate:  { notEmpty: { msg: 'Name is required' } },
  },
  email: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    unique:    true,
    validate: {
      isEmail:  { msg: 'Must be a valid email address' },
      notEmpty: { msg: 'Email is required' },
    },
  },
  password_hash: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type:         DataTypes.ENUM('admin', 'manager', 'staff', 'viewer'),
    allowNull:    false,
    defaultValue: 'staff',
  },
  warehouse_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  is_active: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
  last_login: {
    type:      DataTypes.DATE,
    allowNull: true,
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
  tableName:  'employee',
  timestamps: false,

  // ── Strip password_hash from every JSON serialisation ──────────────────────
  defaultScope: {
    attributes: { exclude: ['password_hash'] },
  },
  scopes: {
    withPassword: { attributes: {} },  // include everything
  },
});

// ── Instance method: compare a plain-text password against the stored hash ──
Employee.prototype.validatePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password_hash);
};

// ── Before-create hook: hash password automatically ─────────────────────────
Employee.beforeCreate(async (employee) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
  employee.password_hash = await bcrypt.hash(employee.password_hash, rounds);
});

// ── Before-update hook: re-hash only if the field was changed ───────────────
Employee.beforeUpdate(async (employee) => {
  if (employee.changed('password_hash')) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    employee.password_hash = await bcrypt.hash(employee.password_hash, rounds);
  }
});

module.exports = Employee;
