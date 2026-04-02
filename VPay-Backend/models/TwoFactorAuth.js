/**
 * Two-Factor Authentication (2FA) Model
 * Stores TOTP secrets for superadmin accounts
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class TwoFactorAuth {
  /**
   * Store TOTP secret for admin
   */
  static async setTOTPSecret(adminId, secret, backupCodes) {
    try {
      await pool.query(`
        UPDATE admins 
        SET totpSecret = ?, backupCodes = ?, twoFactorEnabled = true, updatedAt = NOW()
        WHERE id = ?
      `, [secret, JSON.stringify(backupCodes), adminId]);

      logger.info(`[2FA] TOTP secret set for admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[2FA] Error setting TOTP secret: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get TOTP secret for admin
   */
  static async getTOTPSecret(adminId) {
    try {
      const [results] = await pool.query(`
        SELECT totpSecret, backupCodes, twoFactorEnabled
        FROM admins
        WHERE id = ?
      `, [adminId]);

      if (results.length === 0) {
        return null;
      }

      return {
        totpSecret: results[0].totpSecret,
        backupCodes: results[0].backupCodes ? JSON.parse(results[0].backupCodes) : [],
        twoFactorEnabled: results[0].twoFactorEnabled
      };
    } catch (error) {
      logger.error(`[2FA] Error getting TOTP secret: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enable 2FA for admin
   */
  static async enable2FA(adminId) {
    try {
      await pool.query(`
        UPDATE admins 
        SET twoFactorEnabled = true, updatedAt = NOW()
        WHERE id = ?
      `, [adminId]);

      logger.warn(`[2FA] 2FA enabled for admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[2FA] Error enabling 2FA: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disable 2FA for admin
   */
  static async disable2FA(adminId) {
    try {
      await pool.query(`
        UPDATE admins 
        SET twoFactorEnabled = false, totpSecret = NULL, backupCodes = NULL, updatedAt = NOW()
        WHERE id = ?
      `, [adminId]);

      logger.warn(`[2FA] 2FA disabled for admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[2FA] Error disabling 2FA: ${error.message}`);
      throw error;
    }
  }

  /**
   * Use backup code and mark as used
   */
  static async useBackupCode(adminId, code) {
    try {
      const [results] = await pool.query(`
        SELECT backupCodes FROM admins WHERE id = ?
      `, [adminId]);

      if (results.length === 0) return false;

      let backupCodes = results[0].backupCodes ? JSON.parse(results[0].backupCodes) : [];
      const codeIndex = backupCodes.findIndex(c => c.code === code && !c.used);

      if (codeIndex === -1) return false;

      backupCodes[codeIndex].used = true;
      backupCodes[codeIndex].usedAt = new Date().toISOString();

      await pool.query(`
        UPDATE admins SET backupCodes = ? WHERE id = ?
      `, [JSON.stringify(backupCodes), adminId]);

      logger.warn(`[2FA] Backup code used for admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[2FA] Error using backup code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get 2FA status for admin
   */
  static async get2FAStatus(adminId) {
    try {
      const [results] = await pool.query(`
        SELECT twoFactorEnabled, totpSecret IS NOT NULL as secretConfigured
        FROM admins
        WHERE id = ?
      `, [adminId]);

      if (results.length === 0) {
        return null;
      }

      return {
        enabled: results[0].twoFactorEnabled,
        configured: results[0].secretConfigured
      };
    } catch (error) {
      logger.error(`[2FA] Error getting 2FA status: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TwoFactorAuth;
