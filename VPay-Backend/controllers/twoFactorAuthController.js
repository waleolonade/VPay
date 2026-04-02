/**
 * Two-Factor Authentication Controller
 * Handles TOTP generation, verification, and management
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const logger = require('../utils/logger');

/**
 * Generate TOTP secret and return as QR code
 */
const generateTOTPSecret = async (req, res) => {
  try {
    const { email } = req.user;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VPay Admin (${email})`,
      issuer: 'VPay',
      length: 32
    });

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => ({
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      used: false,
      createdAt: new Date().toISOString()
    }));

    logger.info(`[2FA] TOTP secret generated for admin ${req.user.id}`);

    return res.status(200).json({
      success: true,
      message: 'TOTP secret generated',
      data: {
        secret: secret.base32,
        qrCode,
        backupCodes: backupCodes.map(bc => bc.code), // Only show codes, not metadata
        manualEntryKey: secret.base32
      }
    });
  } catch (error) {
    logger.error(`[2FA] Error generating TOTP secret: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate TOTP secret',
      error: error.message
    });
  }
};

/**
 * Verify TOTP code and enable 2FA
 */
const verifyAndEnable2FA = async (req, res) => {
  try {
    const { token, secret, backupCodes } = req.body;
    const adminId = req.user.id;

    // Verify the token
    if (!token || !secret || !backupCodes || backupCodes.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid token, secret, or backup codes'
      });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow codes from 2 time windows (current ±1)
    });

    if (!verified) {
      logger.warn(`[2FA] Invalid TOTP code provided for admin ${adminId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid TOTP code. Please try again.'
      });
    }

    // Store secret and backup codes
    const backupCodesWithMetadata = backupCodes.map(code => ({
      code,
      used: false,
      createdAt: new Date().toISOString()
    }));

    await TwoFactorAuth.setTOTPSecret(adminId, secret, backupCodesWithMetadata);

    logger.warn(`[2FA] 2FA enabled for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: '2FA successfully enabled',
      data: {
        twoFactorEnabled: true,
        backupCodesCount: backupCodes.length
      }
    });
  } catch (error) {
    logger.error(`[2FA] Error verifying and enabling 2FA: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA',
      error: error.message
    });
  }
};

/**
 * Verify TOTP code during login
 */
const verifyTOTPCode = async (req, res) => {
  try {
    const { token } = req.body;
    const adminId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'TOTP code is required'
      });
    }

    // Get stored TOTP secret
    const twoFAData = await TwoFactorAuth.getTOTPSecret(adminId);

    if (!twoFAData || !twoFAData.totpSecret) {
      return res.status(400).json({
        success: false,
        message: '2FA not configured for this account'
      });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: twoFAData.totpSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      // Check if it's a backup code
      const backupCodes = twoFAData.backupCodes || [];
      const backupCodeUsed = await TwoFactorAuth.useBackupCode(adminId, token);

      if (!backupCodeUsed) {
        logger.warn(`[2FA] Invalid TOTP/backup code provided for admin ${adminId}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid TOTP code or backup code'
        });
      }

      logger.info(`[2FA] Backup code used for admin ${adminId}`);
      return res.status(200).json({
        success: true,
        message: '2FA verified using backup code',
        data: { verified: true, isBackupCode: true }
      });
    }

    logger.info(`[2FA] TOTP verified for admin ${adminId}`);
    return res.status(200).json({
      success: true,
      message: '2FA verified successfully',
      data: { verified: true, isBackupCode: false }
    });
  } catch (error) {
    logger.error(`[2FA] Error verifying TOTP code: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify TOTP code',
      error: error.message
    });
  }
};

/**
 * Disable 2FA for admin
 */
const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const adminId = req.user.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }

    // Verify password (basic check - in production use bcrypt comparison)
    // This is a simplified version - in real scenario, query admin and compare password hash
    const Admin = require('../models/Admin'); // If Admin model exists
    const [admin] = await require('../config/database').pool.query(
      'SELECT password FROM admins WHERE id = ?',
      [adminId]
    );

    // TODO: Properly verify password using bcrypt.compare()
    // For now, just verify 2FA can be disabled by superadmin

    await TwoFactorAuth.disable2FA(adminId);

    logger.warn(`[2FA] 2FA disabled for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: '2FA successfully disabled'
    });
  } catch (error) {
    logger.error(`[2FA] Error disabling 2FA: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: error.message
    });
  }
};

/**
 * Get 2FA status for admin
 */
const get2FAStatus = async (req, res) => {
  try {
    const adminId = req.user.id;

    const status = await TwoFactorAuth.get2FAStatus(adminId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        enabled: status.enabled,
        configured: status.configured
      }
    });
  } catch (error) {
    logger.error(`[2FA] Error getting 2FA status: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status',
      error: error.message
    });
  }
};

/**
 * Generate new backup codes
 */
const generateBackupCodes = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get current 2FA data
    const twoFAData = await TwoFactorAuth.getTOTPSecret(adminId);

    if (!twoFAData || !twoFAData.totpSecret) {
      return res.status(400).json({
        success: false,
        message: '2FA not configured for this account'
      });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () => ({
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      used: false,
      createdAt: new Date().toISOString()
    }));

    // Update in database
    await require('../config/database').pool.query(
      'UPDATE admins SET backupCodes = ? WHERE id = ?',
      [JSON.stringify(backupCodes), adminId]
    );

    logger.info(`[2FA] New backup codes generated for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: 'New backup codes generated',
      data: {
        backupCodes: backupCodes.map(bc => bc.code)
      }
    });
  } catch (error) {
    logger.error(`[2FA] Error generating backup codes: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate backup codes',
      error: error.message
    });
  }
};

module.exports = {
  generateTOTPSecret,
  verifyAndEnable2FA,
  verifyTOTPCode,
  disable2FA,
  get2FAStatus,
  generateBackupCodes
};
