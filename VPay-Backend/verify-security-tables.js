const { pool } = require('./config/database');

async function verifyTables() {
  const tables = ['admin_activity_logs', 'admin_ip_whitelist', 'admin_login_attempts', 'notifications'];
  
  console.log('\n📋 Checking security-related tables:\n');
  
  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SHOW TABLES LIKE '${table}'`);
      if (rows.length > 0) {
        console.log(`✅ ${table} - exists`);
      } else {
        console.log(`❌ ${table} - missing`);
      }
    } catch (error) {
      console.log(`❌ ${table} - error: ${error.message}`);
    }
  }
  
  process.exit(0);
}

verifyTables();
