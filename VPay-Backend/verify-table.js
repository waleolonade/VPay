const { pool } = require('./config/database');

async function verifyTable() {
  try {
    const [rows] = await pool.query('DESCRIBE business_requests');
    console.log('✅ business_requests table columns:');
    rows.forEach(row => {
      console.log(`  - ${row.Field} (${row.Type})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyTable();
