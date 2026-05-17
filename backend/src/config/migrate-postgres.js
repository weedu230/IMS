require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const logger = require('../utils/logger');

const SCHEMA_FILE = path.join(__dirname, 'schema-postgres.sql');

const parseSQLFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  const statements = [];
  let current = '';
  let inDollar = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;

    // Toggle $$ blocks (function bodies)
    if (trimmed.includes('$$')) {
      inDollar = !inDollar;
      current += line + '\n';
      if (!inDollar) {
        // closing $$ — treat as end of statement only if line ends with ';'
        if (trimmed.endsWith(';')) {
          statements.push(current.trim());
          current = '';
        }
      }
      continue;
    }

    if (inDollar) {
      current += line + '\n';
      continue;
    }

    current += line + '\n';
    if (trimmed.endsWith(';')) {
      statements.push(current.replace(/;\s*$/, '').trim());
      current = '';
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
};

const run = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    logger.info('Connected to Postgres DB');

    const stmts = parseSQLFile(SCHEMA_FILE);
    logger.info(`Running ${stmts.length} statements from schema-postgres.sql`);
    for (const s of stmts) {
      await client.query(s);
    }
    logger.info('✅  Postgres schema applied');
    process.exit(0);
  } catch (err) {
    logger.error('❌  Migration failed: ' + (err.message || err));
    process.exit(1);
  } finally {
    try { await client.end(); } catch (e) {}
  }
};

run();
