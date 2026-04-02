/**
 * IP Whitelist Model
 * Manages IP address whitelisting for admin access
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class IPWhitelist {
  /**
   * Add IP address to whitelist
   */
  static async addIP(adminId, ipAddress, description = '') {
    try {
      // Validate IP format
      if (!this.isValidIP(ipAddress)) {
        throw new Error('Invalid IP address format');
      }

      // Check if already exists
      const [existing] = await pool.query(`
        SELECT id FROM admin_ip_whitelist WHERE admin_id = ? AND ip_address = ?
      `, [adminId, ipAddress]);

      if (existing.length > 0) {
        return false; // Already exists
      }

      await pool.query(`
        INSERT INTO admin_ip_whitelist (
          admin_id, ip_address, description, created_at
        ) VALUES (?, ?, ?, NOW())
      `, [adminId, ipAddress, description]);

      logger.info(`[IP_WHITELIST] IP added for admin ${adminId}: ${ipAddress}`);
      return true;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error adding IP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove IP address from whitelist
   */
  static async removeIP(adminId, ipAddress) {
    try {
      await pool.query(`
        DELETE FROM admin_ip_whitelist
        WHERE admin_id = ? AND ip_address = ?
      `, [adminId, ipAddress]);

      logger.info(`[IP_WHITELIST] IP removed for admin ${adminId}: ${ipAddress}`);
      return true;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error removing IP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get whitelisted IPs for admin
   */
  static async getAdminIPs(adminId) {
    try {
      const [ips] = await pool.query(`
        SELECT id, ip_address, description, created_at
        FROM admin_ip_whitelist
        WHERE admin_id = ?
        ORDER BY created_at DESC
      `, [adminId]);

      return ips;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error getting admin IPs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if IP is whitelisted for admin
   */
  static async isIPAllowed(adminId, ipAddress, requireWhitelist = false) {
    try {
      // If whitelisting is not required, allow all IPs
      if (!requireWhitelist) {
        return true;
      }

      const [results] = await pool.query(`
        SELECT id FROM admin_ip_whitelist
        WHERE admin_id = ? AND ip_address = ?
        LIMIT 1
      `, [adminId, ipAddress]);

      return results.length > 0;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error checking IP whitelist: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enable 2-factor IP check for admin
   */
  static async enableIPCheck(adminId) {
    try {
      await pool.query(`
        UPDATE admins SET require_ip_whitelist = true WHERE id = ?
      `, [adminId]);

      logger.info(`[IP_WHITELIST] IP check enabled for admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error enabling IP check: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disable IP check for admin
   */
  static async disableIPCheck(adminId) {
    try {
      await pool.query(`
        UPDATE admins SET require_ip_whitelist = false WHERE id = ?
      `, [adminId]);

      logger.info(`[IP_WHITELIST] IP check disabled for admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error disabling IP check: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get IP whitelist status for admin
   */
  static async getIPCheckStatus(adminId) {
    try {
      const [results] = await pool.query(`
        SELECT require_ip_whitelist FROM admins WHERE id = ?
      `, [adminId]);

      if (results.length === 0) {
        return false;
      }

      return results[0].require_ip_whitelist;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error getting IP check status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add auto-discovered IP (from current login)
   */
  static async autoDiscoverIP(adminId, ipAddress, description = 'Auto-discovered') {
    try {
      // Check if IP already exists
      const [existing] = await pool.query(`
        SELECT id FROM admin_ip_whitelist WHERE admin_id = ? AND ip_address = ?
      `, [adminId, ipAddress]);

      if (existing.length === 0) {
        await this.addIP(adminId, ipAddress, description);
        logger.info(`[IP_WHITELIST] IP auto-discovered for admin ${adminId}: ${ipAddress}`);
        return true;
      }

      return false; // Already exists
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error auto-discovering IP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get admin IP activity (logins from various IPs)
   */
  static async getAdminIPActivity(adminId, limit = 20) {
    try {
      const [activity] = await pool.query(`
        SELECT DISTINCT ip_address, COUNT(*) as loginCount
        FROM admin_sessions
        WHERE admin_id = ?
        GROUP BY ip_address
        ORDER BY loginCount DESC
        LIMIT ?
      `, [adminId, limit]);

      return activity;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error getting admin IP activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate IP format (supports IPv4 and IPv6)
   */
  static isValidIP(ip) {
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^(\w{0,4}:)*(\w{0,4}:)*(\w{0,4})$/;
    return ipv4.test(ip) || ipv6.test(ip);
  }

  /**
   * Check if IP is in CIDR range
   */
  static isIPInRange(ip, cidr) {
    const [network, bits] = cidr.split('/');
    if (!bits) return ip === network;

    // Simple implementation - in production use a proper library
    const ipOctets = ip.split('.').map(Number);
    const networkOctets = network.split('.').map(Number);
    const maskBits = parseInt(bits);

    for (let i = 0; i < 4; i++) {
      const shift = 8 - Math.min(8, maskBits - i * 8);
      if (shift > 0 && shift < 8) {
        const mask = (0xff << shift) & 0xff;
        if ((ipOctets[i] & mask) !== (networkOctets[i] & mask)) return false;
      } else if (shift <= 0) {
        if (ipOctets[i] !== networkOctets[i]) return false;
      }
    }

    return true;
  }

  /**
   * Clear all whitelisted IPs for admin
   */
  static async clearAdminIPs(adminId) {
    try {
      await pool.query(`
        DELETE FROM admin_ip_whitelist WHERE admin_id = ?
      `, [adminId]);

      logger.warn(`[IP_WHITELIST] All IPs cleared for admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[IP_WHITELIST] Error clearing admin IPs: ${error.message}`);
      throw error;
    }
  }
}

module.exports = IPWhitelist;
