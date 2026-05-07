const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
require('dotenv').config();

const LOG_DIR  = process.env.LOG_DIR  || 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ─── Custom log format ─────────────────────────────────────────────────────────
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`
      : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// ─── Transports ────────────────────────────────────────────────────────────────
const transports = [
  // Always log to console
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
  }),
];

// In non-test environments, also rotate log files
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new DailyRotateFile({
      dirname:       path.join(process.cwd(), LOG_DIR),
      filename:      'ims-%DATE%-combined.log',
      datePattern:   'YYYY-MM-DD',
      maxSize:       '20m',
      maxFiles:      '14d',
      format:        logFormat,
    }),
    new DailyRotateFile({
      dirname:       path.join(process.cwd(), LOG_DIR),
      filename:      'ims-%DATE%-error.log',
      datePattern:   'YYYY-MM-DD',
      level:         'error',
      maxSize:       '20m',
      maxFiles:      '30d',
      format:        logFormat,
    })
  );
}

const logger = winston.createLogger({
  level:      LOG_LEVEL,
  transports,
});

module.exports = logger;
