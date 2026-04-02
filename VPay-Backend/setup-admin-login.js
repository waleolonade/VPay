#!/usr/bin/env node

/**
 * COMPLETE ADMIN LOGIN SETUP
 * 
 * This script sets up everything needed to test admin login with OTP:
 * 1. Resets admin password to known value
 * 2. Generates test OTP
 * 3. Provides login instructions
 */

require('dotenv').config({ path: '.env' });
const { pool } = require('./config/database');
const OTP = require('./models/OTP');
const bcrypt = require('bcryptjs');
const { generateOTP, generateOTPExpiry } = require('./utils/generateOTP');

async function setupAdminLogin() {
  try {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║    🚀 COMPLETE ADMIN LOGIN SETUP 🚀              ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Get admin users
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
    const newPassword = 'Test@123456';
    const otp = generateOTP(6);
    const expiresAt = generateOTPExpiry(10);

    console.log(`\n✓ Using: ${admin.email}\n`);

    // Step 1: Reset password
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 1: Resetting password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, admin.id]
    );
    console.log('✓ Password reset successfully\n');

    // Step 2: Generate OTP
    console.log('Step 2: Generating OTP...');
    await pool.query(
      "DELETE FROM otps WHERE user_id = ? AND type = 'admin_login'",
      [admin.id]
    );
    await OTP.create({
      user_id: admin.id,
      email: admin.email,
      otp: otp,
      type: 'admin_login',
      expiresAt: expiresAt
    });
    console.log('✓ OTP generated successfully\n');

    // Display results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║         ✅ SETUP COMPLETE ✅                      ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('📧 LOGIN CREDENTIALS:\n');
    console.log(`   Email:       ${admin.email}`);
    console.log(`   Password:    ${newPassword}`);
    console.log(`   OTP Code:    ${otp.split('').join(' ')}`);
    console.log(`   Valid Until: ${expiresAt.toLocaleString()}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📱 HOW TO LOGIN:\n');
    console.log('1. Open browser: http://localhost:5173/login');
    console.log(`2. Email:       ${admin.email}`);
    console.log(`3. Password:    ${newPassword}`);
    console.log(`4. OTP Code:    ${otp}`);
    console.log('5. Click "Authenticate" → Enter OTP → "Verify & Enter"\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏱️  IMPORTANT:\n');
    console.log(`    The OTP is valid for 10 minutes (until ${expiresAt.toLocaleString()})`);
    console.log('    Each OTP can only be used once\n');
    console.log('—————————————————————————————————————————————————————————\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

setupAdminLogin();
