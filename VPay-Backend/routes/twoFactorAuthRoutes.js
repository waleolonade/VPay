/**
 * Two-Factor Authentication Routes
 */

const express = require('express');
const router = express.Router();
const {
  generateTOTPSecret,
  verifyAndEnable2FA,
  verifyTOTPCode,
  disable2FA,
  get2FAStatus,
  generateBackupCodes
} = require('../controllers/twoFactorAuthController');
const { protect } = require('../middleware/auth');
const { superadminOnly } = require('../middleware/permissions');

// All 2FA routes require authentication
router.use(protect);

/**
 * Get current 2FA status
 */
router.get('/status', get2FAStatus);

/**
 * Generate TOTP secret (protected by superadmin)
 */
router.post('/generate-secret', superadminOnly, generateTOTPSecret);

/**
 * Verify TOTP code and enable 2FA (protected by superadmin)
 */
router.post('/enable', superadminOnly, verifyAndEnable2FA);

/**
 * Verify TOTP code during login
 */
router.post('/verify', verifyTOTPCode);

/**
 * Disable 2FA (protected by superadmin)
 */
router.post('/disable', superadminOnly, disable2FA);

/**
 * Generate new backup codes (protected by superadmin)
 */
router.post('/generate-backup-codes', superadminOnly, generateBackupCodes);

module.exports = router;
