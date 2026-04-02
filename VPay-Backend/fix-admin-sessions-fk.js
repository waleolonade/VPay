const { pool } = require('./config/database');

async function fixAdminSessionsFK() {
  try {
    console.log('\n🔧 Fixing admin_sessions foreign key...\n');
    
    // Drop existing foreign key
    console.log('[1/3] Dropping existing foreign key constraint...');
    try {
      await pool.query('ALTER TABLE admin_sessions DROP FOREIGN KEY admin_sessions_ibfk_1');
      console.log('    ✓ Foreign key dropped\n');
    } catch (e) {
      if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('    ℹ Foreign key does not exist, continuing...\n');
      } else {
        throw e;
      }
    }
    
    // Change admin_id column type to VARCHAR(36) to match UUID
    console.log('[2/3] Changing admin_id column type to VARCHAR(36)...');
    await pool.query('ALTER TABLE admin_sessions MODIFY admin_id VARCHAR(36) NOT NULL');
    console.log('    ✓ Column type updated\n');
    
    // Add new foreign key referencing users table
    console.log('[3/3] Adding foreign key to reference users table...');
    await pool.query(`
      ALTER TABLE admin_sessions 
      ADD CONSTRAINT admin_sessions_user_fk 
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('    ✓ New foreign key constraint added\n');
    
    console.log('✅ Foreign key fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminSessionsFK();
