const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function runMigration() {
  try {
    console.log('Running migration: Adding CAC columns to wallets table...');
    await pool.query(`
      ALTER TABLE wallets 
      ADD COLUMN IF NOT EXISTS cac_number VARCHAR(255) NULL, 
      ADD COLUMN IF NOT EXISTS cac_certificate VARCHAR(255) NULL;
    `);
    console.log('Migration successful: CAC columns added.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
