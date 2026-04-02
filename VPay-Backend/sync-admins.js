const { pool } = require('./config/database');

async function syncAdmins() {
  try {
    console.log('\n📋 Syncing administrators...\n');
    
    // Get all admin/superadmin users
    const [adminUsers] = await pool.query(
      "SELECT id, email, first_name, last_name, password FROM users WHERE role IN ('admin', 'superadmin')"
    );
    
    console.log(`Found ${adminUsers.length} admin/superadmin user(s) in users table`);
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found.');
      process.exit(0);
    }
    
    // Create admin records for each admin user
    for (const user of adminUsers) {
      try {
        // Check if admin already exists
        const [existing] = await pool.query('SELECT id FROM admins WHERE id = ?', [user.id]);
        
        if (existing.length > 0) {
          console.log(`  ✓ Admin ${user.id} already exists`);
        } else {
          // Create admin record
          await pool.query(
            'INSERT INTO admins (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [user.id, user.email, user.password, `${user.first_name || ''} ${user.last_name || ''}`.trim(), 'admin']
          );
          console.log(`  ✓ Created admin record for user ${user.id} (${user.email})`);
        }
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ✓ Admin ${user.id} already exists`);
        } else {
          console.log(`  ❌ Error creating admin ${user.id}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Admin sync completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncAdmins();
