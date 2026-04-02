const nodemailer = require('nodemailer');

/**
 * CHECK EMAIL CONFIGURATION
 * Verifies that email service is properly configured
 */

async function checkEmailConfig() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║      📧 EMAIL SERVICE CONFIGURATION CHECK      📧 ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM || 'noreply@vpay.com';

    console.log('SMTP Configuration:\n');
    console.log(`  Host:     ${smtpHost}`);
    console.log(`  Port:     ${smtpPort}`);
    console.log(`  User:     ${smtpUser ? '✓ Configured' : '❌ Missing'}`);
    console.log(`  Password: ${smtpPass ? '✓ Configured' : '❌ Missing'}`);
    console.log(`  From:     ${emailFrom}\n`);

    // Check if credentials are placeholder values
    const isConfigured = smtpUser && smtpPass && 
                        !smtpUser.includes('your_') && 
                        !smtpPass.includes('your_');

    if (!isConfigured) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('⚠️  EMAIL SERVICE NOT CONFIGURED\n');
      console.log('The email service is not properly configured.');
      console.log('OTP codes will NOT be sent to email addresses.\n');
      console.log('To enable email:');
      console.log('1. Update .env file with SMTP credentials:');
      console.log('   SMTP_USER=your-email@gmail.com');
      console.log('   SMTP_PASS=your-app-password');
      console.log('2. Restart the backend server\n');
      process.exit(0);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🧪 Testing SMTP Connection...\n');

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log('✅ SMTP Connection Successful!\n');
      console.log('╔═══════════════════════════════════════════════════╗');
      console.log('║      ✅ EMAIL SERVICE READY ✅                  ║');
      console.log('╚═══════════════════════════════════════════════════╝\n');
      console.log('Status: Email service is properly configured');
      console.log('OTP codes will be sent to admin email addresses\n');
      console.log('📱 To login with OTP:\n');
      console.log('1. Run: node generate-test-otp.js');
      console.log('2. Run: node reset-admin-password.js');
      console.log('3. Go to: http://localhost:5173/login');
      console.log('4. Enter credentials and OTP\n');
      console.log('╚═══════════════════════════════════════════════════╝\n');
    } catch (error) {
      console.log('❌ SMTP Connection Failed!\n');
      console.log(`Error: ${error.message}\n`);
      console.log('Possible causes:');
      console.log('  - Incorrect SMTP credentials');
      console.log('  - Invalid app password (use app-specific password, not account password)');
      console.log('  - Gmail: Enable "Less secure app access" or use App Passwords');
      console.log('  - Network/firewall blocking SMTP port\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkEmailConfig();
