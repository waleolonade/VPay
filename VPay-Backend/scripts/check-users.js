const { pool } = require('../config/database');

async function checkUsers() {
    try {
        const [rows] = await pool.query('SELECT id, email, phone, last_login FROM users');
        console.log('Registered Users:', rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkUsers();
