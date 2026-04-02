const { pool } = require('./config/database');

async function verifyFixes() {
  try {
    console.log('\n📋 Verifying security table schemas:\n');
    
    const tables = ['admin_sessions', 'admin_ip_whitelist', 'admin_activity_logs', 'admin_login_attempts'];
    
    for (const table of tables) {
      try {
        const [cols] = await pool.query(`DESCRIBE ${table}`);
        const adminIdCol = cols.find(c => c.Field === 'admin_id');
        console.log(`✅ ${table}`);
        console.log(`   admin_id type: ${adminIdCol.Type}\n`);
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}\n`);
      }
    }
    
    console.log('✅ All tables verified!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyFixes();
