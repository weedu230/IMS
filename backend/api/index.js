/**
 * Serverless handler for Vercel
 * Exports the Express app for serverless execution
 */

require('dotenv').config();

const app = require('../src/app');
const { connectDB } = require('../src/config/database');

let dbConnected = false;

/**
 * Initialize database connection once
 */
const initDB = async () => {
  if (dbConnected) return;
  try {
    await connectDB();
    dbConnected = true;
  } catch (err) {
    console.error('❌ DB Connection Failed:', err.message);
    throw err;
  }
};

/**
 * Middleware to ensure DB is connected before processing requests
 */
app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

/**
 * Export for Vercel serverless
 */
module.exports = app;
