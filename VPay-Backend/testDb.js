require('dotenv').config();
const { pool } = require('./config/database');

async function testQuery() {
    try {
        const [rows] = await pool.query('SELECT id, first_name, email, phone FROM users LIMIT 10');
        console.log('Users in DB:', rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

testQuery();
