const { pool } = require('./config/database');

async function getTestAdmins() {
  try {
    const [admins] = await pool.query(
      "SELECT id, email, first_name, first_name as name FROM users WHERE role IN ('admin', 'superadmin') ORDER BY created_at DESC"
    );
    
    console.log('\n📋 Available Admin Accounts:\n');
    admins.forEach((admin, i) => {
      console.log(`${i + 1}. Email: ${admin.email}`);
      console.log(`   Name: ${admin.first_name}`);
      console.log(`   ID: ${admin.id}`);
      console.log('');
    });
    
    console.log('📧 Login Instructions:');
    console.log('1. Go to http://localhost:5173/login');
    console.log('2. Enter email and password');
    console.log('3. Enter the OTP code sent to your email');
    console.log('4. Access granted to admin dashboard\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getTestAdmins();
