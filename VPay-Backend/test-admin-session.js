const { pool } = require('./config/database');

async function testAdminSession() {
  try {
    console.log('\n🧪 Testing admin session creation...\n');
    
    // Get an admin user
    const [admins] = await pool.query(
      "SELECT id, email, first_name FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1"
    );
    
    if (admins.length === 0) {
      console.log('❌ No admin users found');
      process.exit(1);
    }
    
    const admin = admins[0];
    console.log(`✓ Found admin: ${admin.email} (${admin.id})\n`);
    
    // Test creating a session
    console.log('Creating test session...');
    const sessionId = require('crypto').randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    await pool.query(`
      INSERT INTO admin_sessions (id, admin_id, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `, [sessionId, admin.id, '127.0.0.1', 'TestAgent/1.0', expiresAt]);
    
    console.log(`✅ Session created successfully!`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Admin ID: ${admin.id}`);
    console.log(`   Expires at: ${expiresAt.toISOString()}`);
    
    // Verify the session
    const [sessions] = await pool.query(
      'SELECT * FROM admin_sessions WHERE id = ?',
      [sessionId]
    );
    
    if (sessions.length > 0) {
      console.log(`\n✅ Session verified in database!`);
    } else {
      console.log(`\n❌ Session not found in database`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.code === 'ER_NO_REFERENCED_ROW') {
      console.log('\n⚠️  Foreign key constraint still failing. Admin user may not exist or ID type mismatch.');
    }
    process.exit(1);
  }
}

testAdminSession();
