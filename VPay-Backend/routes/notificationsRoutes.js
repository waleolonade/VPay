
/**
 * Notifications Routes
 */

const express = require('express');
const router = express.Router();
const {
  sendNotification,
  getUserNotifications,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getTemplates,
  getUnreadCount,
  sendBroadcast
} = require('../controllers/notificationsController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/permissions');
const logger = require('../utils/logger');

// All notification routes require authentication
router.use(protect);

router.use((req, res, next) => {
  logger.debug(`[NOTIFS-ROUTE] Request: ${req.method} ${req.originalUrl} - User: ${req.user?.id} - Role: ${req.user?.role}`);
  next();
});

/**
 * User notification routes
 */

/**
 * Get current user's notifications (root alias)
 */
router.get('/', getMyNotifications);

/**
 * Get current user's notifications (explicit endpoint)
 */
router.get('/my-notifications', getMyNotifications);

/**
 * Get unread count for current user
 */
router.get('/unread-count', getUnreadCount);

/**
 * Mark notification as read
 */
router.post('/:notificationId/read', markNotificationAsRead);

/**
 * Mark all as read
 */
router.post('/mark-all/read', markAllNotificationsAsRead);

/**
 * Delete notification
 */
router.delete('/:notificationId', deleteNotification);

/**
 * Get notification templates
 */
router.get('/templates', getTemplates);

/**
 * Admin notification routes (requires SEND_NOTIFICATIONS permission handled per route)
 */

/**
 * Send notification to users
 */
router.post('/send', checkPermission(PERMISSIONS.SEND_NOTIFICATIONS), sendNotification);

/**
 * Send broadcast notification
 */
router.post('/broadcast', checkPermission(PERMISSIONS.SEND_NOTIFICATIONS), sendBroadcast);

/**
 * Get notifications for a specific user (admin view)
 */
router.get('/user/:userId', checkPermission(PERMISSIONS.SEND_NOTIFICATIONS), getUserNotifications);

module.exports = router;
