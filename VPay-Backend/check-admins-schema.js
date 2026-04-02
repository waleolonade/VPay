const { pool } = require('./config/database');

async function checkAdminsSchema() {
  try {
    console.log('\n📋 Checking admins table schema:\n');
    
    // Get columns
    const [cols] = await pool.query('DESCRIBE admins');
    console.log('Columns:');
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `KEY:${col.Key}` : ''}`);
    });
    
    // Get existing admins
    const [admins] = await pool.query('SELECT * FROM admins');
    console.log(`\nExisting admin records: ${admins.length}`);
    if (admins.length > 0) {
      console.log(admins);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAdminsSchema();
