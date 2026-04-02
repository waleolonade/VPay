const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'vpay',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
};

async function resetPass() {
  const conn = await mysql.createConnection(config);
  try {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('VPayAdmin123!', salt);
    
    await conn.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, 'admin@vpay.com']);
    console.log('Password updated for admin@vpay.com');
  } finally {
    await conn.end();
  }
}

resetPass();
