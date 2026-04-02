const { pool } = require('./config/database');

async function fixOtherSecurityTablesFKs() {
  try {
    console.log('\n🔧 Fixing other security tables foreign keys...\n');
    
    // Fix admin_ip_whitelist
    console.log('[1/3] Fixing admin_ip_whitelist table...');
    try {
      await pool.query('ALTER TABLE admin_ip_whitelist DROP FOREIGN KEY admin_ip_whitelist_ibfk_1');
      console.log('    ✓ Old FK dropped');
    } catch (e) {
      if (e.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw e;
    }
    await pool.query('ALTER TABLE admin_ip_whitelist MODIFY admin_id VARCHAR(36) NOT NULL');
    console.log('    ✓ Column type updated');
    await pool.query(`
      ALTER TABLE admin_ip_whitelist 
      ADD CONSTRAINT admin_ip_whitelist_user_fk 
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('    ✓ New FK added\n');
    
    // Fix admin_activity_logs
    console.log('[2/3] Fixing admin_activity_logs table...');
    try {
      await pool.query('ALTER TABLE admin_activity_logs DROP FOREIGN KEY admin_activity_logs_ibfk_1');
      console.log('    ✓ Old FK dropped');
    } catch (e) {
      if (e.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw e;
    }
    await pool.query('ALTER TABLE admin_activity_logs MODIFY admin_id VARCHAR(36) NOT NULL');
    console.log('    ✓ Column type updated');
    await pool.query(`
      ALTER TABLE admin_activity_logs 
      ADD CONSTRAINT admin_activity_logs_user_fk 
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('    ✓ New FK added\n');
    
    // Fix admin_login_attempts
    console.log('[3/3] Fixing admin_login_attempts table...');
    try {
      await pool.query('ALTER TABLE admin_login_attempts DROP KEY IF EXISTS UQ constraint');
    } catch (e) {
      // Ignore, might not exist
    }
    // Just make admin_id nullable and allow UUID
    await pool.query('ALTER TABLE admin_login_attempts MODIFY admin_id VARCHAR(36)');
    console.log('    ✓ Column type updated\n');
    
    console.log('✅ All security tables fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixOtherSecurityTablesFKs();
