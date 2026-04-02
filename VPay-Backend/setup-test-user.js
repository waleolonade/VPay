const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    console.log('Checking existing users...');
    const [users] = await pool.query('SELECT id, email, phone FROM users LIMIT 5');
    console.log('Users found:', users);
    
    if (users.length === 0) {
      console.log('No users found. Creating test user...');
      const passwordHash = await bcrypt.hash('Test123456', 12);
      const userId = require('uuid').v4();
      
      await pool.query(
        'INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, 'Test', 'User', 'test@vpay.com', '+234 801 234 5678', passwordHash, 'user', 1]
      );
      console.log('✅ Test user created');
      console.log('Email: test@vpay.com');
      console.log('Phone: +234 801 234 5678');
      console.log('Password: Test123456');
    } else {
      console.log('\n✅ Found existing users:');
      users.forEach(u => {
        console.log(`  - Email: ${u.email}, Phone: ${u.phone}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testLogin();
