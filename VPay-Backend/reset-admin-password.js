const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

/**
 * SETUP TOOL: Reset Admin Password
 * Creates a known password for testing
 */

async function resetAdminPassword() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║      🔑 ADMIN PASSWORD RESET TOOL 🔑             ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    // Get all admin users
    const [adminUsers] = await pool.query(
      "SELECT id, email, first_name FROM users WHERE role IN ('admin', 'superadmin') ORDER BY created_at DESC"
    );

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found\n');
      process.exit(1);
    }

    console.log('📋 Available Admin Accounts:\n');
    adminUsers.forEach((admin, i) => {
      console.log(`   ${i + 1}. ${admin.email} (${admin.first_name})`);
    });

    const admin = adminUsers[0];
    const newPassword = 'Test@123456'; // Default test password

    console.log(`\n✓ Using: ${admin.email}\n`);
    console.log('Creating new password hash...');

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, admin.id]
    );

    console.log('✓ Password updated\n');

    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║         ✅ PASSWORD RESET COMPLETE ✅            ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log('📧 Email Account:', admin.email);
    console.log('🔑 New Password: ' + newPassword);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📱 NEXT STEPS:\n');
    console.log('1. Run: node generate-test-otp.js');
    console.log('2. Go to: http://localhost:5173/login');
    console.log(`3. Email:    ${admin.email}`);
    console.log(`4. Password: ${newPassword}`);
    console.log('5. Enter the OTP from step 1');
    console.log('6. Click "Verify & Enter Dashboard"\n');

    console.log('╚═══════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
