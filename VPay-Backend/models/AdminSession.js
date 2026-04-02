/**
 * Admin Session Model
 * Manages admin login sessions with timeout and concurrency limits
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');

class AdminSession {
  /**
   * Create a new session
   */
  static async create(adminId, ipAddress, userAgent, expiresAt) {
    try {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const createdAt = new Date();

      await pool.query(`
        INSERT INTO admin_sessions (
          id, admin_id, ip_address, user_agent, expires_at, created_at, last_activity
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        sessionId,
        adminId,
        ipAddress,
        userAgent,
        expiresAt,
        createdAt,
        createdAt
      ]);

      logger.info(`[SESSION] New session created for admin ${adminId}`);
      return sessionId;
    } catch (error) {
      logger.error(`[SESSION] Error creating session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate an active session
   */
  static async validate(sessionId) {
    try {
      const [results] = await pool.query(`
        SELECT * FROM admin_sessions
        WHERE id = ? AND expires_at > NOW()
      `, [sessionId]);

      if (results.length === 0) {
        return null;
      }

      const session = results[0];

      // Update last activity
      await pool.query(`
        UPDATE admin_sessions SET last_activity = NOW() WHERE id = ?
      `, [sessionId]);

      return {
        sessionId: session.id,
        adminId: session.admin_id,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        lastActivity: session.last_activity
      };
    } catch (error) {
      logger.error(`[SESSION] Error validating session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidate a session (logout)
   */
  static async invalidate(sessionId) {
    try {
      await pool.query(`
        DELETE FROM admin_sessions WHERE id = ?
      `, [sessionId]);

      logger.info(`[SESSION] Session invalidated: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`[SESSION] Error invalidating session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all active sessions for an admin
   */
  static async getAdminSessions(adminId) {
    try {
      const [results] = await pool.query(`
        SELECT * FROM admin_sessions
        WHERE admin_id = ? AND expires_at > NOW()
        ORDER BY created_at DESC
      `, [adminId]);

      return results.map(session => ({
        sessionId: session.id,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        lastActivity: session.last_activity
      }));
    } catch (error) {
      logger.error(`[SESSION] Error getting admin sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Count active sessions for an admin
   */
  static async countAdminSessions(adminId) {
    try {
      const [results] = await pool.query(`
        SELECT COUNT(*) as count FROM admin_sessions
        WHERE admin_id = ? AND expires_at > NOW()
      `, [adminId]);

      return results[0]?.count || 0;
    } catch (error) {
      logger.error(`[SESSION] Error counting admin sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidate oldest session(s) for an admin (for concurrency limits)
   */
  static async invalidateOldestSession(adminId) {
    try {
      const [results] = await pool.query(`
        SELECT id FROM admin_sessions
        WHERE admin_id = ? AND expires_at > NOW()
        ORDER BY last_activity ASC
        LIMIT 1
      `, [adminId]);

      if (results.length > 0) {
        await this.invalidate(results[0].id);
        logger.warn(`[SESSION] Oldest session terminated for admin ${adminId} (concurrency limit)`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`[SESSION] Error invalidating oldest session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidate all sessions for an admin (force logout everywhere)
   */
  static async invalidateAllAdminSessions(adminId) {
    try {
      await pool.query(`
        DELETE FROM admin_sessions WHERE admin_id = ?
      `, [adminId]);

      logger.warn(`[SESSION] All sessions invalidated for admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[SESSION] Error invalidating all admin sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidate expired sessions (cleanup)
   */
  static async invalidateExpiredSessions() {
    try {
      const [result] = await pool.query(`
        DELETE FROM admin_sessions WHERE expires_at <= NOW()
      `);

      logger.debug(`[SESSION] Cleaned up ${result.affectedRows} expired sessions`);
      return result.affectedRows;
    } catch (error) {
      logger.error(`[SESSION] Error cleaning up expired sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update IP address and user agent for a session
   */
  static async updateSessionLocation(sessionId, ipAddress, userAgent) {
    try {
      await pool.query(`
        UPDATE admin_sessions 
        SET ip_address = ?, user_agent = ?, last_activity = NOW()
        WHERE id = ?
      `, [ipAddress, userAgent, sessionId]);

      logger.info(`[SESSION] Session location updated: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`[SESSION] Error updating session location: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get session activity statistics
   */
  static async getSessionStats() {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as activeSessions,
          COUNT(DISTINCT admin_id) as activeAdmins,
          MAX(created_at) as newestSession,
          MIN(created_at) as oldestSession
        FROM admin_sessions
        WHERE expires_at > NOW()
      `);

      return stats[0] || {
        activeSessions: 0,
        activeAdmins: 0
      };
    } catch (error) {
      logger.error(`[SESSION] Error getting session stats: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AdminSession;
