const { pool } = require('./config/database');

async function checkOtpTable() {
  try {
    const [cols] = await pool.query('DESCRIBE otps');
    console.log('\n📋 OTP Table Structure:\n');
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkOtpTable();
