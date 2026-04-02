const { pool } = require('./config/database');

async function checkTransactionsTable() {
  try {
    const [cols] = await pool.query('DESCRIBE transactions');
    console.log('Transactions table structure:');
    console.log('Column | Type | Key | Null | Default');
    console.log('-------|------|-----|------|--------');
    cols.forEach(col => {
      console.log(`${col.Field} | ${col.Type} | ${col.Key} | ${col.Null} | ${col.Default}`);
    });
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

checkTransactionsTable();
