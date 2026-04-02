const User = require('../models/User');
const Wallet = require('../models/Wallet');
const OTP = require('../models/OTP');
const Notification = require('../models/Notification');
const { pool } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/auth');
const { generateOTP, generateOTPExpiry } = require('../utils/generateOTP');
const { generateAccountNumber, generatePersonalAccountNumber, generateBusinessAccountNumber, generateReferralCode } = require('../utils/helpers');
const { sendOTPSMS } = require('../services/smsService');
const { sendWelcomeEmail, sendOTPEmail, sendLoginEmail } = require('../services/emailService');
const { OTP_EXPIRY_MINUTES, LOGIN_MAX_ATTEMPTS, LOCK_TIME_MINUTES } = require('../utils/constants');
const logger = require('../utils/logger');
const { verify2FA } = require('../middleware/twoFactorAuthMiddleware');
const { checkIPWhitelist } = require('../middleware/ipWhitelistMiddleware');
const { createAdminSession, checkConcurrentSessionLimit } = require('../middleware/sessionManagementMiddleware');

/**
 * Ensure user has BOTH personal and business wallets
 */
const ensureDualWallets = async (userId, firstName, lastName) => {
  try {
    const wallets = await Wallet.find({ user: userId });
    const hasPersonal = wallets.some(w => w.walletType === 'personal');
    const hasBusiness = wallets.some(w => w.walletType === 'business');

    const fullName = `${firstName || ''} ${lastName || ''}`.trim();

    if (!hasPersonal) {
      await Wallet.create({
        user: userId,
        accountNumber: generatePersonalAccountNumber(),
        accountName: fullName,
        walletType: 'personal',
        bankName: 'VPay MFB'
      });
      logger.info(`Created missing personal wallet for user ${userId}`);
    }

    if (!hasBusiness) {
      await Wallet.create({
        user: userId,
        accountNumber: generateBusinessAccountNumber(),
        accountName: fullName + ' Business',
        walletType: 'business',
        bankName: 'VPay MFB',
        dailyLimit: 1000000,
        transactionLimit: 500000
      });
      logger.info(`Created missing business wallet for user ${userId}`);
    }
  } catch (err) {
    logger.error(`Error in ensureDualWallets for user ${userId}: ${err.message}`);
  }
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, referralCode } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email or phone already registered' });
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referral_code: referralCode });
      if (referrer) referredBy = referrer.id;
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      referralCode: generateReferralCode(firstName),
      referredBy,
    });

    // Create both personal & business wallets with DISTINCT account number prefixes
    // Personal: starts with 4xxxxxxxxx  |  Business: starts with 5xxxxxxxxx
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    await Wallet.create({ user: user.id, accountNumber: generatePersonalAccountNumber(), accountName: fullName, walletType: 'personal', bankName: 'VPay MFB' });
    await Wallet.create({ user: user.id, accountNumber: generateBusinessAccountNumber(), accountName: fullName + ' Business', walletType: 'business', bankName: 'VPay MFB', dailyLimit: 1000000, transactionLimit: 500000 });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, firstName).catch((e) => logger.warn(`Welcome email failed: ${e.message}`));

    // Send phone OTP
    const otp = generateOTP(6);
    await OTP.create({
      user: user.id,
      phone,
      otp,
      type: 'phone_verification',
      expiresAt: generateOTPExpiry(OTP_EXPIRY_MINUTES),
    });
    sendOTPSMS(phone, otp).catch((e) => logger.warn(`OTP SMS failed: ${e.message}`));

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await User.update(user.id, { refreshToken });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your phone number.',
      data: { accessToken, refreshToken, user: { id: user.id, firstName, lastName, email, phone } },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (phone + password)
// @route   POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { phone, email, password, totpCode, backupCode } = req.body;
    const identifier = phone || email;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Phone/email and password are required' });
    }

    // Normalize phone: accept 0... and +234... formats
    const normalizePhone = (p) => {
      if (!p) return p;
      const digits = p.replace(/\D/g, '');
      if (digits.startsWith('234') && digits.length === 13) return '+' + digits;
      if (digits.startsWith('0') && digits.length === 11) return '+234' + digits.slice(1);
      if (digits.length === 10) return '+234' + digits;
      return p; // fallback: use as-is
    };

    const normalizedIdentifier = /^\+?[0-9]/.test(identifier) ? normalizePhone(identifier) : identifier;
    const localIdentifier = normalizedIdentifier.startsWith('+234') ? '0' + normalizedIdentifier.slice(4) : normalizedIdentifier;

    logger.debug(`Login attempt: identifier=${identifier}, normalized=${normalizedIdentifier}, local=${localIdentifier}`);

    // Look up by both phone formats and email
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE phone = ? OR phone = ? OR email = ? LIMIT 1',
      [normalizedIdentifier, localIdentifier, identifier]
    );
    const row = rows[0];
    if (!row) {
      logger.warn(`Login failed: User not found for ${identifier}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const bcrypt = require('bcryptjs');
    const now = new Date();
    if (row.lock_until && new Date(row.lock_until) > now) {
      logger.warn(`Login failed: Account locked for ${row.phone}`);
      return res.status(423).json({ success: false, message: 'Account temporarily locked. Try again later.' });
    }

    const isMatch = await bcrypt.compare(password, row.password_hash);
    logger.debug(`Password match result for ${row.phone}: ${isMatch}`);
    if (!isMatch) {
      const attempts = (row.login_attempts || 0) + 1;
      const updates = { login_attempts: attempts };
      if (attempts >= LOGIN_MAX_ATTEMPTS) {
        updates.lock_until = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
        logger.warn(`Account locked: ${row.phone}`);
      }
      const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
      await pool.query(`UPDATE users SET ${setClauses} WHERE id = ?`, [...Object.values(updates), row.id]);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Enhanced admin/superadmin login
    if (row.role === 'admin' || row.role === 'superadmin') {
      // 1. IP Whitelist check (if enabled)
      req.user = { id: row.id, role: row.role };
      await checkIPWhitelist(req, res, async () => {
        // ALWAYS require OTP for admins/superadmins (Mandatory 2FA)
        const otp = generateOTP(6);
        const expiresAt = generateOTPExpiry(10); // 10 minutes

        // Create OTP record for verification
        await OTP.create({
          user_id: row.id,
          otp: otp,
          type: 'admin_login',
          expiresAt: expiresAt
        });

        // Send login notification (security alert)
        try {
          await Notification.create({
            user: row.id,
            title: 'Admin Login Attempt',
            body: `An admin login was initiated for your account. A verification code has been sent to your email.`,
            type: 'security',
            data: {
              userAgent: req.headers['user-agent'],
              ip: req.ip || req.headers['x-forwarded-for'],
              timestamp: new Date()
            }
          });
        } catch (notifErr) {
          logger.warn(`Admin login notification failed: ${notifErr.message}`);
        }

        // Send OTP via email
        sendOTPEmail(row.email, otp, row.first_name).catch(e => 
          logger.warn(`Admin login OTP email failed: ${e.message}`)
        );

        // Inform client that OTP is required
        return res.status(200).json({
          success: true,
          requireOTP: true,
          message: 'A verification code has been sent to your registered email address.',
          data: {
            email: row.email,
            role: row.role
          }
        });
      });
      return; // Prevent further execution
    }

    // Regular user login (non-admin)
    const newRefreshToken = generateRefreshToken({ id: row.id });
    await pool.query('UPDATE users SET login_attempts = 0, lock_until = NULL, last_login = ?, refresh_token = ? WHERE id = ?', [now, newRefreshToken, row.id]);
    await ensureDualWallets(row.id, row.first_name, row.last_name);
    const accessToken = generateAccessToken({ id: row.id, role: row.role || 'user' });

    // Send login notification
    try {
      await Notification.create({
        user: row.id,
        title: 'New Login',
        body: `You just signed in to your account`,
        type: 'info',
        data: {
          ip: req.ip || req.headers['x-forwarded-for'],
          timestamp: new Date()
        }
      });
    } catch (notifErr) {
      logger.warn(`Login notification failed: ${notifErr.message}`);
    }

    // Send login email
    sendLoginEmail(row.email, row.first_name, {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toLocaleString()
    }).catch(e => logger.warn(`Login email failed: ${e.message}`));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          role: row.role || 'user',
          avatar: row.avatar || row.profile_image || null,
          account_number: row.account_number || null,
          kycLevel: row.kyc_level || 0,
        },
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = verifyRefreshToken(token);
    const [rows] = await pool.query('SELECT id, role, refresh_token FROM users WHERE id = ? LIMIT 1', [decoded.id]);
    const row = rows[0];
    if (!row || row.refresh_token !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken({ id: row.id, role: row.role });
    const newRefreshToken = generateRefreshToken({ id: row.id });
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefreshToken, row.id]);

    res.status(200).json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout
// @route   POST /api/v1/auth/logout
const logout = async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify phone OTP
// @route   POST /api/v1/auth/verify-phone
const verifyPhone = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const record = await OTP.findOne({ phone, type: 'phone_verification', is_used: 0, expires_at: { $gt: new Date() } });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const isOtpValid = await OTP.verifyOtp(record.id, otp);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await OTP.markUsed(record.id);
    await User.update(record.user_id, { isPhoneVerified: true });
    res.status(200).json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP
// @route   POST /api/v1/auth/send-otp
const sendOTP = async (req, res, next) => {
  try {
    const { phone, type = 'phone_verification' } = req.body;
    const otp = generateOTP(6);
    await OTP.create({ phone, otp, type, expiresAt: generateOTPExpiry(OTP_EXPIRY_MINUTES) });
    sendOTPSMS(phone, otp).catch((e) => logger.warn(`OTP SMS failed: ${e.message}`));
    res.status(200).json({ success: true, message: 'OTP sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password (phone-based)
// @route   POST /api/v1/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If this phone is registered, a reset OTP has been sent.' });
    }

    const otp = generateOTP(6);
    await OTP.create({ user: user.id, phone, otp, type: 'password_reset', expiresAt: generateOTPExpiry(15) });
    sendOTPSMS(phone, otp).catch((e) => logger.warn(`Reset OTP SMS failed: ${e.message}`));

    res.status(200).json({ success: true, message: 'Password reset OTP sent to your phone.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password (phone + OTP)
// @route   POST /api/v1/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Phone, OTP, and new password are required' });
    }

    const record = await OTP.findOne({ phone, type: 'password_reset', is_used: 0, expires_at: { $gt: new Date() } });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const isOtpValid = await OTP.verifyOtp(record.id, otp);
    if (!isOtpValid) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    await OTP.markUsed(record.id);
    await User.update(record.user_id, { password: newPassword });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Request OTP for Login
// @route   POST /api/v1/auth/login-otp
const loginOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone]);
    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Phone number not registered' });
    }

    const otp = generateOTP(6);
    await OTP.create({ phone, otp, type: 'login', expiresAt: generateOTPExpiry(OTP_EXPIRY_MINUTES) });
    sendOTPSMS(phone, otp).catch((e) => logger.warn(`OTP SMS failed: ${e.message}`));

    res.status(200).json({ success: true, message: 'OTP sent to your phone' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP for Login
// @route   POST /api/v1/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone]);
    const row = rows[0];

    if (!row) return res.status(404).json({ success: false, message: 'User not found' });

    const record = await OTP.findOne({ phone, type: 'login', is_used: 0, expires_at: { $gt: new Date() } });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const isOtpValid = await OTP.verifyOtp(record.id, otp);
    if (!isOtpValid) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    await OTP.markUsed(record.id);

    // Give tokens
    const now = new Date();
    const refreshToken = generateRefreshToken({ id: row.id });
    await pool.query(
      'UPDATE users SET login_attempts = 0, lock_until = NULL, last_login = ?, refresh_token = ? WHERE id = ?',
      [now, refreshToken, row.id]
    );

    // Ensure they have both wallets
    await ensureDualWallets(row.id, row.first_name, row.last_name);

    const accessToken = generateAccessToken({ id: row.id, role: row.role });

    // Send login notification
    try {
      await Notification.create({
        user: row.id,
        title: 'Login Successful',
        body: `You have successfully logged into your VPay account via OTP.`,
        type: 'security',
        data: {
          method: 'otp',
          ip: req.ip,
          timestamp: new Date()
        }
      });
    } catch (notifErr) {
      logger.warn(`OTP login notification failed: ${notifErr.message}`);
    }

    // Send login email
    sendLoginEmail(row.email, row.first_name, {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toLocaleString()
    }).catch(e => logger.warn(`OTP login email failed: ${e.message}`));

    res.status(200).json({
      success: true,
      message: 'OTP Login successful',
      data: {
        accessToken,
        refreshToken,
        user: { id: row.id, firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone, role: row.role, avatar: row.avatar || row.profile_image || null },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
const resendOtp = async (req, res, next) => {
  // It literally does the identical logic as loginOtp for requesting. Let's just call loginOtp inside manually or repeat logic
  try {
    const { phone } = req.body;
    const otp = generateOTP(6);
    await OTP.create({ phone, otp, type: 'login', expiresAt: generateOTPExpiry(OTP_EXPIRY_MINUTES) });
    sendOTPSMS(phone, otp).catch((e) => logger.warn(`OTP SMS failed: ${e.message}`));

    res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public profile (for login personalization)
// @route   GET /api/v1/auth/profile/:phone
const getPublicProfile = async (req, res, next) => {
  try {
    let { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Normalize phone
    const normalizePhone = (p) => {
      const digits = p.replace(/\D/g, '');
      if (digits.startsWith('234') && digits.length === 13) return '+' + digits;
      if (digits.startsWith('0') && digits.length === 11) return '+234' + digits.slice(1);
      if (digits.length === 10) return '+234' + digits;
      return p;
    };

    const normalizedPhone = normalizePhone(phone);
    const localPhone = normalizedPhone.startsWith('+234') ? '0' + normalizedPhone.slice(4) : normalizedPhone;

    const [rows] = await pool.query(
      'SELECT first_name, avatar FROM users WHERE phone = ? OR phone = ? LIMIT 1',
      [normalizedPhone, localPhone]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        firstName: rows[0].first_name,
        avatar: rows[0].avatar || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Admin Login OTP
// @route   POST /api/v1/auth/verify-admin-otp
const verifyAdminOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or unauthorized' });
    }

    // Verify OTP from DB
    const record = await OTP.findOne({ user_id: user.id, type: 'admin_login', is_used: 0, expires_at: { $gt: new Date() } });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please login again.' });
    }

    const isOtpValid = await OTP.verifyOtp(record.id, otp);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    // Mark OTP as used
    await OTP.markUsed(record.id);

    // Issue tokens
    const now = new Date();
    const newRefreshToken = generateRefreshToken({ id: user.id });
    await pool.query(
      'UPDATE users SET login_attempts = 0, lock_until = NULL, last_login = ?, refresh_token = ? WHERE id = ?',
      [now, newRefreshToken, user.id]
    );

    const accessToken = generateAccessToken({ id: user.id, role: user.role });

    logger.info(`Admin login successful: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, loginOtp, verifyOtp, resendOtp, refreshToken, logout, verifyPhone, sendOTP, forgotPassword, resetPassword, getProfile, getPublicProfile, verifyAdminOtp };


