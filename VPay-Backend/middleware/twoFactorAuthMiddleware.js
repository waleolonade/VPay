const speakeasy = require('speakeasy');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware to verify TOTP code (2FA)
 * Requires admin_id in request or from auth token
 */
const verify2FA = async (req, res, next) => {
  try {
    const { totpCode, backupCode } = req.body;
    const adminId = req.body.adminId || req.user?.id;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required for 2FA verification'
      });
    }

    if (!totpCode && !backupCode) {
      return res.status(400).json({
        success: false,
        message: 'TOTP code or backup code is required'
      });
    }

    // Get admin's TOTP secret
    const [adminRows] = await pool.query(
      'SELECT totp_secret FROM admins WHERE id = ? AND two_factor_enabled = TRUE',
      [adminId]
    );

    if (!adminRows[0]) {
      return res.status(403).json({
        success: false,
        message: '2FA is not enabled for this account'
      });
    }

    const totpSecret = adminRows[0].totp_secret;

    // If using TOTP code
    if (totpCode) {
      const verified = speakeasy.totp.verify({
        secret: totpSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2 // Allow 30 seconds before/after for clock skew
      });

      if (!verified) {
        logger.warn(`2FA verification failed for admin ${adminId}: Invalid TOTP code`);
        return res.status(401).json({
          success: false,
          message: 'Invalid TOTP code'
        });
      }

      logger.info(`2FA verified via TOTP for admin ${adminId}`);
      req.user = req.user || {};
      req.user.totp_verified = true;
      return next();
    }

    // If using backup code
    if (backupCode) {
      // Check if backup code exists and hasn't been used
      const [backupRows] = await pool.query(
        'SELECT id FROM admin_backup_codes WHERE admin_id = ? AND code = ? AND used = FALSE LIMIT 1',
        [adminId, backupCode]
      );

      if (!backupRows[0]) {
        logger.warn(`2FA verification failed for admin ${adminId}: Invalid/used backup code`);
        return res.status(401).json({
          success: false,
          message: 'Invalid or already-used backup code'
        });
      }

      // Mark backup code as used
      await pool.query(
        'UPDATE admin_backup_codes SET used = TRUE, used_at = NOW() WHERE id = ?',
        [backupRows[0].id]
      );

      logger.info(`2FA verified via backup code for admin ${adminId}`);
      req.user = req.user || {};
      req.user.backup_code_used = true;
      return next();
    }
  } catch (error) {
    logger.error(`2FA verification middleware error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA'
    });
  }
};

/**
 * Check if 2FA is required for admin and if not provided, return 2FA required response
 */
const check2FARequired = async (req, res, next) => {
  try {
    const adminId = req.user?.id || req.body?.adminId;

    if (!adminId) {
      return next();
    }

    // Check if 2FA is enabled for this admin
    const [adminRows] = await pool.query(
      'SELECT two_factor_enabled FROM admins WHERE id = ?',
      [adminId]
    );

    if (adminRows[0]?.two_factor_enabled) {
      // Check if 2FA has already been verified in this request
      if (!req.user?.totp_verified && !req.user?.backup_code_used) {
        return res.status(403).json({
          success: false,
          message: 'Two-factor authentication required',
          require2FA: true
        });
      }
    }

    next();
  } catch (error) {
    logger.error(`2FA check middleware error: ${error.message}`);
    next(error);
  }
};

/**
 * Require 2FA for sensitive operations
 */
const require2FA = async (req, res, next) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if admin has 2FA enabled
    const [adminRows] = await pool.query(
      'SELECT two_factor_enabled FROM admins WHERE id = ?',
      [adminId]
    );

    if (!adminRows[0]?.two_factor_enabled) {
      return res.status(403).json({
        success: false,
        message: 'Two-factor authentication must be enabled to perform this action'
      });
    }

    // Verify 2FA was verified in this request or session
    if (!req.user.totp_verified && !req.user.backup_code_used && !req.session?.totp_verified) {
      return res.status(403).json({
        success: false,
        message: 'Valid 2FA verification required',
        require2FA: true
      });
    }

    next();
  } catch (error) {
    logger.error(`require2FA middleware error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  verify2FA,
  check2FARequired,
  require2FA
};
