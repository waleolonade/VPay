const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'vpay',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
};

async function listUsers() {
  const conn = await mysql.createConnection(config);
  try {
    const [rows] = await conn.query('SELECT first_name, last_name, email, phone, role FROM users LIMIT 10');
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await conn.end();
  }
}

listUsers();
