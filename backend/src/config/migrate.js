/**
 * db:migrate — Creates the database (if needed) and runs schema.sql
 * db:seed    — Runs seed.sql to populate initial data
 *
 * Usage:
 *   node src/config/migrate.js          → run schema only
 *   node src/config/migrate.js --seed   → run schema + seed
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
const logger = require('../utils/logger');

const SCHEMA_FILE = path.join(__dirname, 'schema.sql');
const SEED_FILE   = path.join(__dirname, 'seed.sql');

/**
 * Split a SQL file into individual statements, stripping
 * DELIMITER directives and handling stored procedures.
 */
const parseSQLFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const statements = [];

  let current    = '';
  let delimiter  = ';';
  const lines    = raw.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip pure comment lines and empty lines
    if (!trimmed || trimmed.startsWith('--')) continue;

    // Handle DELIMITER changes (used for stored procedures)
    if (trimmed.toUpperCase().startsWith('DELIMITER')) {
      const parts = trimmed.split(/\s+/);
      delimiter = parts[1] || ';';
      continue;
    }

    current += line + '\n';

    // Statement ends when the current delimiter appears at end of trimmed line
    if (trimmed.endsWith(delimiter)) {
      // Strip the delimiter suffix and push
      const stmt = current
        .replace(new RegExp(delimiter.replace(/\$/g, '\\$') + '\\s*$'), '')
        .trim();
      if (stmt) statements.push(stmt);
      current = '';
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
};

const run = async () => {
  const withSeed = process.argv.includes('--seed');

  // Connect WITHOUT specifying a database first (so we can CREATE it)
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    // 1. Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    logger.info(`✅  Database '${process.env.DB_NAME}' ready`);

    // 2. Switch to it
    await connection.query(`USE \`${process.env.DB_NAME}\``);

    // 3. Run schema
    logger.info('⏳  Running schema.sql …');
    const schemaStatements = parseSQLFile(SCHEMA_FILE);
    for (const stmt of schemaStatements) {
      await connection.query(stmt);
    }
    logger.info(`✅  Schema applied (${schemaStatements.length} statements)`);

    // 4. Optional seed
    if (withSeed) {
      logger.info('⏳  Running seed.sql …');
      const seedStatements = parseSQLFile(SEED_FILE);
      for (const stmt of seedStatements) {
        await connection.query(stmt);
      }
      logger.info(`✅  Seed data inserted (${seedStatements.length} statements)`);
    }

    logger.info('🎉  Migration complete!');
  } catch (err) {
    logger.error(`❌  Migration failed: ${err?.message || 'Unknown error'}`);
    if (err?.sqlMessage) logger.error(`SQL: ${err.sqlMessage}`);
    if (err?.sql) logger.error(`Statement: ${err.sql}`);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

run();
