const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTestUser() {
  try {
    const email = 'testuser@vpay.com';
    const phone = '+2348000000001';
    const password = 'Password@123';
    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('Test user already exists');
      process.exit(0);
    }

    await pool.query(
      `INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, 'Test', 'User', email, phone, passwordHash, 'admin', 1]
    );

    console.log(`✅ Test user created: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
