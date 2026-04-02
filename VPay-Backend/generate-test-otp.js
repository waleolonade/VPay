const { pool } = require('./config/database');
const { generateOTP, generateOTPExpiry } = require('./utils/generateOTP');
const { v4: uuidv4 } = require('uuid');

/**
 * SETUP TOOL: Generate Test OTP for Admin Login
 * Allows testing the OTP flow without waiting for emails
 */

async function generateTestOtp() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║       🔐 ADMIN TEST OTP GENERATOR 🔐              ║');
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
      console.log(`   ${i + 1}. ${admin.email}`);
    });

    const admin = adminUsers[0];
    console.log(`\n✓ Using: ${admin.email}\n`);

    // Generate OTP
    const otp = generateOTP(6);
    const otpId = uuidv4();
    const expiresAt = generateOTPExpiry(10); // 10 minutes

    console.log('Creating OTP record...');
    
    // Delete old OTPs for this admin
    await pool.query(
      "DELETE FROM otps WHERE user_id = ? AND type = 'admin_login'",
      [admin.id]
    );

    // Insert new OTP
    const OTP = require('./models/OTP');
    await OTP.create({
      user_id: admin.id,
      otp: otp,
      type: 'admin_login',
      expiresAt: expiresAt
    });

    console.log('✓ OTP record created\n');

    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║          ✅ TEST OTP GENERATED ✅                ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    
    console.log('📧 Email Account:', admin.email);
    console.log('🔑 OTP Code:      ' + otp.split('').join(' '));
    console.log('⏱️  Valid For:     10 minutes');
    console.log(`⏰ Expires:       ${expiresAt.toLocaleString()}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📱 LOGIN STEPS:\n');
    console.log('1. Go to: http://localhost:5173/login');
    console.log(`2. Email:    ${admin.email}`);
    console.log('3. Password: (enter the admin password)');
    console.log(`4. OTP:      ${otp}`);
    console.log('5. Click "Verify & Enter Dashboard"\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Don\'t know the password? Run this:\n');
    console.log('   node reset-admin-password.js\n');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

generateTestOtp();
