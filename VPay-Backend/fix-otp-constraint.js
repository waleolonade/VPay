const { pool } = require('./config/database');

(async () => {
  try {
    // Drop the old constraint
    await pool.query('ALTER TABLE `otps` DROP CONSTRAINT `chk_otp_type`');
    console.log('✅ Dropped old chk_otp_type constraint');

    // Add the updated constraint including admin_login
    await pool.query(
      "ALTER TABLE `otps` ADD CONSTRAINT `chk_otp_type` CHECK (`type` IN ('phone_verification','email_verification','password_reset','transaction','login','admin_login'))"
    );
    console.log('✅ Added new chk_otp_type constraint (includes admin_login)');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
})();
