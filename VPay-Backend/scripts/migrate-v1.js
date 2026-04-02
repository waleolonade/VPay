const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'vpay',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
};

async function migrate() {
  const connection = await mysql.createConnection(config);
  console.log('Connecting to database...');

  try {
    console.log('Adding missing columns...');

    // Add is_business to users table if not exists
    try {
      await connection.query('ALTER TABLE users ADD COLUMN is_business TINYINT(1) NOT NULL DEFAULT 0 AFTER refresh_token');
      console.log('  Added is_business to users table');
    } catch (err) {
      if (err.errno === 1060) console.log('  is_business already exists in users table');
      else throw err;
    }

    // Add account_name to wallets table if not exists
    try {
      await connection.query('ALTER TABLE wallets ADD COLUMN account_name VARCHAR(255) NULL AFTER account_number');
      console.log('  Added account_name to wallets table');
    } catch (err) {
      if (err.errno === 1060) console.log('  account_name already exists in wallets table');
      else throw err;
    }

    // Add wallet_type to wallets table if not exists
    try {
      await connection.query("ALTER TABLE wallets ADD COLUMN wallet_type VARCHAR(20) NOT NULL DEFAULT 'personal' AFTER bank_name");
      console.log('  Added wallet_type to wallets table');
    } catch (err) {
      if (err.errno === 1060) console.log('  wallet_type already exists in wallets table');
      else throw err;
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await connection.end();
  }
}

migrate();
