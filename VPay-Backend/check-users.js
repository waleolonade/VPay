const { pool } = require('./config/database');

async function checkUsersTable() {
  try {
    // Get columns
    const [cols] = await pool.query('DESCRIBE users');
    console.log('\n📋 Users table columns:');
    console.log(cols.map(c => c.Field).join(', '));
    console.log('');
    
    // Get admin users
    const [adminUsers] = await pool.query(
      "SELECT id, email, first_name, last_name FROM users WHERE role IN ('admin', 'superadmin')"
    );
    
    console.log(`Found ${adminUsers.length} admin/superadmin user(s):`);
    console.log(adminUsers);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsersTable();
