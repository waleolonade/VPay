/**
 * Notifications Controller
 * Handles notification operations
 */

const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Send notification to users
 */
const sendNotification = async (req, res) => {
  try {
    const {
      userIds,
      email,
      phone,
      title,
      message,
      htmlContent,
      data = {},
      channels = ['in_app'],
      scheduledTime = null
    } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one user ID is required'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const results = await Promise.all(
      userIds.map(userId =>
        NotificationService.sendMultiChannel(userId, {
          email,
          phone,
          title,
          message,
          htmlContent,
          data,
          channels,
          scheduledTime
        })
      )
    );

    logger.info(`[NOTIFICATION] Sent ${userIds.length} notifications by admin ${req.user.id}`);

    return res.status(200).json({
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      data: { sentCount: userIds.length, results }
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error sending notification: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await Notification.getUserNotifications(
      userId,
      page,
      limit,
      unreadOnly
    );

    const stats = await Notification.getStats(userId);

    logger.debug(`[NOTIFICATION] Retrieved ${notifications.length} notifications for user ${userId}`);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        stats,
        pagination: {
          page,
          limit,
          total: stats.totalNotifications || 0
        }
      }
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error getting notifications: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Get current user's notifications
 */
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await Notification.getUserNotifications(
      userId,
      page,
      limit,
      unreadOnly
    );

    const stats = await Notification.getStats(userId);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        stats,
        pagination: {
          page,
          limit,
          total: stats.totalNotifications || 0
        }
      }
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error getting my notifications: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.markAsRead(notificationId);

    logger.debug(`[NOTIFICATION] Notification ${notificationId} marked as read`);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error marking notification as read: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.markAllAsRead(userId);

    logger.debug(`[NOTIFICATION] All notifications marked as read for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error marking all notifications as read: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.delete(notificationId);

    logger.debug(`[NOTIFICATION] Notification ${notificationId} deleted`);

    return res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error deleting notification: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

/**
 * Get notification templates
 */
const getTemplates = async (req, res) => {
  try {
    const templates = NotificationService.getTemplates();

    return res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error getting templates: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error getting unread count: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * Send broadcast notification (admin only)
 */
const sendBroadcast = async (req, res) => {
  try {
    const {
      title,
      message,
      userIds = [],
      channels = ['in_app']
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    await Notification.broadcastNotification(title, message, userIds, channels);

    logger.warn(`[NOTIFICATION] Broadcast sent by admin ${req.user.id}: ${title}`);

    return res.status(200).json({
      success: true,
      message: `Broadcast notification sent to ${userIds.length} users`
    });
  } catch (error) {
    logger.error(`[NOTIFICATION] Error sending broadcast: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to send broadcast',
      error: error.message
    });
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getTemplates,
  getUnreadCount,
  sendBroadcast
};
