const { pool } = require('./config/database');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Check current database
    const [dbRows] = await pool.query('SELECT DATABASE() as db');
    console.log('📊 Current database:', dbRows[0].db);
    
    // List all tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('\n📋 Existing tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

checkDatabase();
