/**
 * Migration: add 'channel' column to transactions table
 * Run once: node scripts/add-qr-channel.js
 *
 * channel values: 'app' (default) | 'qr' | 'api' | 'webhook'
 */
require('dotenv').config();
const { pool } = require('../config/database');

async function run() {
  console.log('▶ Running QR channel migration...');

  try {
    await pool.query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS channel VARCHAR(30) NOT NULL DEFAULT 'app' AFTER type
    `);
    console.log('✅ channel column added (or already exists).');
  } catch (err) {
    // MySQL < 8: IF NOT EXISTS not supported on ALTER TABLE
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  channel column already exists — skipping.');
    } else {
      console.error('❌ Migration failed:', err.message);
      throw err;
    }
  }

  // Also add channel to schema.sql comment (informational)
  console.log('✅ QR channel migration complete.');
  process.exit(0);
}

run().catch(() => process.exit(1));
