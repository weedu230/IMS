const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Reuse global Sequelize instance across serverless function invocations
 * This prevents connection pool exhaustion in serverless environments
 */
const getSequelize = () => {
  if (global.__sequelize) {
    return global.__sequelize;
  }

  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host:    process.env.DB_HOST,
      port:    parseInt(process.env.DB_PORT, 10),
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development'
        ? (msg) => require('../utils/logger').debug(msg)
        : false,
      pool: {
        max:     parseInt(process.env.DB_POOL_MAX,     10) || 3,
        min:     parseInt(process.env.DB_POOL_MIN,     10) || 0,
        acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
        idle:    parseInt(process.env.DB_POOL_IDLE,    10) || 10000,
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

  global.__sequelize = sequelize;
  return sequelize;
};

const sequelize = getSequelize();

/**
 * Test the database connection.
 * Called once at application startup.
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    require('../utils/logger').info('✅  PostgreSQL connected successfully');
  } catch (error) {
    require('../utils/logger').error('❌ Database connection failed:', error.message);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
