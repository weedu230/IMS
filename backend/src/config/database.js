const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    parseInt(process.env.DB_PORT, 10),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development'
      ? (msg) => require('../utils/logger').debug(msg)
      : false,
    pool: {
      max:     parseInt(process.env.DB_POOL_MAX,     10),
      min:     parseInt(process.env.DB_POOL_MIN,     10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10),
      idle:    parseInt(process.env.DB_POOL_IDLE,    10),
    },
    dialectOptions: {
      // Enforce TLS in production
      ...(process.env.NODE_ENV === 'production' && {
        ssl: { require: true, rejectUnauthorized: false },
      }),
      // Ensure BIGINT is returned as Number not String
      supportBigNumbers: true,
      bigNumberStrings:  false,
    },
    define: {
      // Use snake_case column names by default
      underscored:   true,
      // Do NOT auto-add createdAt / updatedAt unless model opts in
      timestamps:    false,
      freezeTableName: true,
    },
  }
);

/**
 * Test the database connection.
 * Called once at application startup.
 */
const connectDB = async () => {
  await sequelize.authenticate();
  require('../utils/logger').info('✅  MySQL connected successfully');
};

module.exports = { sequelize, connectDB };
