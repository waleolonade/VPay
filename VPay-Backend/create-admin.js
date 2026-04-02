require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'vpay',
    port: process.env.MYSQL_PORT || 3306
  });

  try {
    // Check if admin exists
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@vpay.com']
    );

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists!');
      console.log('Email: admin@vpay.com');
      return;
    }

    // Create admin user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    await connection.execute(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        phone, role, kyc_level, is_email_verified, is_phone_verified,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        'admin@vpay.com',
        hashedPassword,
        'Admin',
        'VPay',
        '+2348012345678',
        'admin',
        3,
        1,
        1,
        1
      ]
    );

    // Create admin wallet
    const walletId = uuidv4();
    const accountNumber = '45' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    await connection.execute(
      `INSERT INTO wallets (
        id, user_id, wallet_type, balance, currency, account_number,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [walletId, userId, 'personal', 0.00, 'NGN', accountNumber, 1]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@vpay.com');
    console.log('Password: Admin@123');
    console.log('Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    await connection.end();
  }
}

createAdmin();
