/**
 * Session Management Routes
 */

const express = require('express');
const router = express.Router();
const {
  getMyActiveSessions,
  getAdminSessions,
  terminateSession,
  terminateAllSessions,
  getSessionConfig,
  getSessionStats,
  validateSession
} = require('../controllers/sessionManagementController');
const { protect } = require('../middleware/auth');
const { superadminOnly } = require('../middleware/permissions');

// All session routes require authentication
router.use(protect);

/**
 * Get current user's active sessions
 */
router.get('/my-sessions', getMyActiveSessions);

/**
 * Validate current session
 */
router.get('/validate', validateSession);

/**
 * Get session configuration
 */
router.get('/config', getSessionConfig);

/**
 * Terminate a specific session
 */
router.post('/terminate/:sessionId', terminateSession);

/**
 * Terminate all sessions for current admin
 */
router.post('/terminate-all', (req, res) => {
  req.params.adminId = req.user.id;
  terminateAllSessions(req, res);
});

/**
 * Superadmin routes
 */
router.use(superadminOnly);

/**
 * Get all active sessions for a specific admin (superadmin only)
 */
router.get('/admin/:adminId', getAdminSessions);

/**
 * Terminate all sessions for any admin (superadmin only)
 */
router.post('/admin/:adminId/terminate-all', terminateAllSessions);

/**
 * Get global session statistics (superadmin only)
 */
router.get('/stats/global', getSessionStats);

module.exports = router;
