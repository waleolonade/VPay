const { pool } = require('./config/database');

async function unlockUser(email) {
  try {
    const [result] = await pool.query(
      'UPDATE users SET login_attempts = 0, lock_until = NULL WHERE email = ?',
      [email]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ User ${email} successfully unlocked.`);
    } else {
      console.log(`⚠️ User ${email} not found or already unlocked.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error unlocking user:', error);
    process.exit(1);
  }
}

const targetEmail = process.argv[2] || 'testuser@vpay.com';
unlockUser(targetEmail);
