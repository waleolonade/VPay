const Notification = require('../models/Notification');
const { paginate, paginationMeta } = require('../utils/helpers');

// @desc    Get notifications
// @route   GET /api/v1/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { user: req.user.id };
    if (unreadOnly === 'true') filter.isRead = false;
    const { skip } = paginate(page, limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter, { limit: parseInt(limit), skip }),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user.id, isRead: false }),
    ]);
    res.status(200).json({ success: true, data: notifications, unreadCount, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/v1/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { id: req.params.id, user: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/v1/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ id: req.params.id, user: req.user.id });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};
