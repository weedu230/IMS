require('dotenv').config();

const app                    = require('./app');
const { connectDB }          = require('./config/database');
const { startScheduler }     = require('./utils/scheduler');
const logger                 = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  try {
    // 1. Verify database connection before accepting traffic
    await connectDB();

    // 2. Start the reorder scheduler (nightly cron)
    startScheduler();

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀  IMS Backend running on http://localhost:${PORT}`);
      logger.info(`📋  Environment : ${process.env.NODE_ENV}`);
      logger.info(`🩺  Health check: http://localhost:${PORT}/health`);
      logger.info(`📡  API base    : http://localhost:${PORT}/api/v1`);
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.info(`\n${signal} received — shutting down gracefully…`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

  } catch (err) {
    logger.error('❌  Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
