const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'vpay',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info(`MySQL Connected: ${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'vpay'}`);
    connection.release();
  } catch (error) {
    logger.error(`MySQL connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
