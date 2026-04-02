/**
 * Session Management Controller
 * Handles admin session operations
 */

const AdminSession = require('../models/AdminSession');
const logger = require('../utils/logger');

/**
 * Get all active sessions for current admin
 */
const getMyActiveSessions = async (req, res) => {
  try {
    const adminId = req.user.id;

    const sessions = await AdminSession.getAdminSessions(adminId);

    logger.debug(`[SESSION] Retrieved ${sessions.length} sessions for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error(`[SESSION] Error getting active sessions: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions',
      error: error.message
    });
  }
};

/**
 * Get admin's session details
 */
const getAdminSessions = async (req, res) => {
  try {
    const { adminId } = req.params;

    const sessions = await AdminSession.getAdminSessions(adminId);

    return res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error(`[SESSION] Error getting admin sessions: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin sessions',
      error: error.message
    });
  }
};

/**
 * Terminate a specific session
 */
const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.user.id;

    // Verify the session belongs to the user (unless superadmin)
    if (req.user.role !== 'superadmin') {
      const sessions = await AdminSession.getAdminSessions(adminId);
      const sessionExists = sessions.some(s => s.sessionId === sessionId);

      if (!sessionExists) {
        return res.status(403).json({
          success: false,
          message: 'Cannot terminate other users\' sessions'
        });
      }
    }

    await AdminSession.invalidate(sessionId);

    logger.warn(`[SESSION] Session terminated: ${sessionId}`);

    return res.status(200).json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    logger.error(`[SESSION] Error terminating session: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to terminate session',
      error: error.message
    });
  }
};

/**
 * Terminate all sessions for an admin (logout everywhere)
 */
const terminateAllSessions = async (req, res) => {
  try {
    const { adminId } = req.params;
    const requestingAdminId = req.user.id;

    // Users can only terminate their own sessions
    // Superadmin can terminate anyone's sessions
    if (req.user.role !== 'superadmin' && adminId !== requestingAdminId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot terminate other users\' sessions'
      });
    }

    await AdminSession.invalidateAllAdminSessions(adminId);

    logger.warn(`[SESSION] All sessions terminated for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: 'All sessions terminated successfully'
    });
  } catch (error) {
    logger.error(`[SESSION] Error terminating all sessions: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to terminate all sessions',
      error: error.message
    });
  }
};

/**
 * Get session configuration (limits, timeout, etc)
 */
const getSessionConfig = async (req, res) => {
  try {
    const config = {
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5,
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour in ms
      sessionTimeoutMinutes: 60,
      activityRefreshInterval: parseInt(process.env.SESSION_ACTIVITY_REFRESH) || 300000, // 5 mins
      rememberMeDuration: parseInt(process.env.REMEMBER_ME_DURATION) || 604800000 // 7 days
    };

    return res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error(`[SESSION] Error getting session config: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch session configuration',
      error: error.message
    });
  }
};

/**
 * Get global session statistics (superadmin only)
 */
const getSessionStats = async (req, res) => {
  try {
    const stats = await AdminSession.getSessionStats();

    logger.debug(`[SESSION] Retrieved session statistics`);

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5
      }
    });
  } catch (error) {
    logger.error(`[SESSION] Error getting session stats: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch session statistics',
      error: error.message
    });
  }
};

/**
 * Check session validity
 */
const validateSession = async (req, res) => {
  try {
    // If we got here, the user is authenticated and the session is valid
    const sessions = await AdminSession.getAdminSessions(req.user.id);
    const activeCount = sessions.length;

    return res.status(200).json({
      success: true,
      data: {
        isValid: true,
        adminId: req.user.id,
        activeSessionCount: activeCount,
        currentSessionIsValid: true
      }
    });
  } catch (error) {
    logger.error(`[SESSION] Error validating session: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate session',
      error: error.message
    });
  }
};

module.exports = {
  getMyActiveSessions,
  getAdminSessions,
  terminateSession,
  terminateAllSessions,
  getSessionConfig,
  getSessionStats,
  validateSession
};
