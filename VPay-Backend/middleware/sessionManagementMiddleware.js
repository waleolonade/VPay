const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to validate admin session
 */
const validateAdminSession = async (req, res, next) => {
  try {
    const adminId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    if (!adminId || !sessionId) {
      return next(); // Not an admin or no session
    }

    // Get session from database
    const [sessionRows] = await pool.query(
      'SELECT * FROM admin_sessions WHERE id = ? AND admin_id = ?',
      [sessionId, adminId]
    );

    if (!sessionRows[0]) {
      return res.status(401).json({
        success: false,
        message: 'Session not found or invalid'
      });
    }

    const session = sessionRows[0];
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    // Check if session has expired
    if (expiresAt < now) {
      // Mark session as expired
      await pool.query(
        'UPDATE admin_sessions SET expires_at = ? WHERE id = ?',
        [now, sessionId]
      );

      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please login again.'
      });
    }

    // Check inactivity timeout
    const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || 3600000); // 1 hour default
    const lastActivity = new Date(session.last_activity);
    const timeSinceActivity = now - lastActivity;

    if (timeSinceActivity > sessionTimeout) {
      logger.warn(`Session timeout for admin ${adminId}: Inactive for ${timeSinceActivity}ms`);
      
      // Mark session as expired
      await pool.query(
        'UPDATE admin_sessions SET expires_at = ? WHERE id = ?',
        [now, sessionId]
      );

      return res.status(401).json({
        success: false,
        message: 'Session timed out due to inactivity.'
      });
    }

    // Update last activity
    await pool.query(
      'UPDATE admin_sessions SET last_activity = NOW() WHERE id = ?',
      [sessionId]
    );

    // Attach session info to request
    req.session = {
      id: sessionId,
      ...session
    };

    next();
  } catch (error) {
    logger.error(`Session validation error: ${error.message}`);
    next(error);
  }
};

/**
 * Create new admin session after login
 */
const createAdminSession = async (adminId, config = {}) => {
  try {
    const sessionId = uuidv4();
    const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || 3600000); // 1 hour
    const expiresAt = new Date(Date.now() + sessionTimeout);
    
    const ipAddress = config.ipAddress || 'unknown';
    const userAgent = config.userAgent || '';

    await pool.query(
      'INSERT INTO admin_sessions (id, admin_id, ip_address, user_agent, expires_at, created_at, last_activity) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [sessionId, adminId, ipAddress, userAgent, expiresAt]
    );

    logger.info(`Created session ${sessionId.substring(0, 8)}... for admin ${adminId}`);

    return sessionId;
  } catch (error) {
    logger.error(`Error creating admin session: ${error.message}`);
    throw error;
  }
};

/**
 * Invalidate session
 */
const invalidateSession = async (sessionId) => {
  try {
    const now = new Date();
    await pool.query(
      'UPDATE admin_sessions SET expires_at = ? WHERE id = ?',
      [now, sessionId]
    );

    logger.info(`Invalidated session ${sessionId.substring(0, 8)}...`);
  } catch (error) {
    logger.error(`Error invalidating session: ${error.message}`);
    throw error;
  }
};

/**
 * Invalidate all sessions for admin
 */
const invalidateAllAdminSessions = async (adminId) => {
  try {
    const now = new Date();
    await pool.query(
      'UPDATE admin_sessions SET expires_at = ? WHERE admin_id = ?',
      [now, adminId]
    );

    logger.info(`Invalidated all sessions for admin ${adminId}`);
  } catch (error) {
    logger.error(`Error invalidating all sessions for admin ${adminId}: ${error.message}`);
    throw error;
  }
};

/**
 * Check concurrent sessions limit
 */
const checkConcurrentSessionLimit = async (adminId) => {
  try {
    const maxSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS || 5);
    
    // Count active sessions
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM admin_sessions WHERE admin_id = ? AND expires_at > NOW()',
      [adminId]
    );

    const activeSessions = result[0]?.count || 0;

    if (activeSessions >= maxSessions) {
      logger.warn(`Admin ${adminId} has reached max concurrent sessions (${maxSessions})`);
      
      // Invalidate oldest session
      const [oldestSession] = await pool.query(
        'SELECT id FROM admin_sessions WHERE admin_id = ? AND expires_at > NOW() ORDER BY created_at ASC LIMIT 1',
        [adminId]
      );

      if (oldestSession[0]) {
        await invalidateSession(oldestSession[0].id);
        logger.info(`Invalidated oldest session for admin ${adminId} due to concurrent limit`);
      }
    }

    return activeSessions < maxSessions;
  } catch (error) {
    logger.error(`Error checking concurrent session limit: ${error.message}`);
    throw error;
  }
};

/**
 * Cleanup expired sessions (should run periodically)
 */
const cleanupExpiredSessions = async () => {
  try {
    const result = await pool.query(
      'DELETE FROM admin_sessions WHERE expires_at < NOW()'
    );

    logger.info(`Cleaned up ${result[0]?.affectedRows || 0} expired sessions`);
  } catch (error) {
    logger.error(`Error cleaning up expired sessions: ${error.message}`);
  }
};

module.exports = {
  validateAdminSession,
  createAdminSession,
  invalidateSession,
  invalidateAllAdminSessions,
  checkConcurrentSessionLimit,
  cleanupExpiredSessions
};
