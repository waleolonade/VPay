const { pool } = require('./config/database');

async function test() {
  try {
    const [rows] = await pool.query('DESCRIBE bank_accounts');
    console.log('Table bank_accounts exists. Columns:');
    console.table(rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

test();
