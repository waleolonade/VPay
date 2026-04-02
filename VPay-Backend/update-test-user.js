const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function updateTestUser() {
  try {
    const email = 'testuser@vpay.com';
    const newPassword = 'Test@123456';
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    console.log('Updating test user...');
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, email]
    );
    
    console.log('✅ Test user updated successfully');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('\nYou can now login with these credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateTestUser();
