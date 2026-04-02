/**
 * VPay — Database Initialisation Runner (MySQL)
 * ──────────────────────────────────────────────
 * Creates the MySQL database and runs scripts/init-db.sql via mysql2.
 *
 * Usage:
 *   node scripts/init-db.js            # uses .env values
 *
 * Required env vars (see .env):
 *   MYSQL_HOST     — default: localhost
 *   MYSQL_PORT     — default: 3306
 *   MYSQL_USER     — default: root
 *   MYSQL_PASSWORD — default: (empty, XAMPP default)
 *   MYSQL_DATABASE — default: vpay
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const SQL_FILE = path.join(__dirname, 'init-db.sql');
const DB_NAME  = process.env.MYSQL_DATABASE || 'vpay';

const BASE_CONFIG = {
  host:     process.env.MYSQL_HOST     || 'localhost',
  port:     parseInt(process.env.MYSQL_PORT || '3306', 10),
  user:     process.env.MYSQL_USER     || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  multipleStatements: true,
  connectTimeout: 30000,
};

async function ensureDatabaseExists() {
  const conn = await mysql.createConnection(BASE_CONFIG);
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`  Database \`${DB_NAME}\` ready.`);
  } finally {
    await conn.end();
  }
}

async function runInitScript() {
  const conn = await mysql.createConnection({ ...BASE_CONFIG, database: DB_NAME });
  try {
    const sqlText = fs.readFileSync(SQL_FILE, 'utf8');
    const [results] = await conn.query(sqlText);

    // mysql2 multipleStatements returns an array of result sets
    const count = Array.isArray(results) ? results.length : 1;
    console.log(`  Executed ${count} statement(s) successfully.`);
  } finally {
    await conn.end();
  }
}

async function main() {
  console.log('\nVPay — MySQL Database Init');
  console.log(`  Host     : ${BASE_CONFIG.host}:${BASE_CONFIG.port}`);
  console.log(`  Database : ${DB_NAME}`);
  console.log(`  User     : ${BASE_CONFIG.user}\n`);

  try {
    console.log('Step 1/2  Ensuring database exists...');
    await ensureDatabaseExists();

    console.log('Step 2/2  Running schema script...');
    await runInitScript();

    console.log('\n  VPay database initialised successfully.\n');
  } catch (err) {
    console.error(`\n  Init-DB failed: ${err.message}`);
    if (err.code)  console.error(`  MySQL error code : ${err.code}`);
    if (err.errno) console.error(`  errno            : ${err.errno}`);
    process.exit(1);
  }
}

main();
