/**
 * Activity Log Controller
 * Handles activity log queries and reporting
 */

const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

/**
 * Get all activity logs
 */
const getAllActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const filters = {};
    if (req.query.adminId) filters.adminId = req.query.adminId;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.resourceType) filters.resourceType = req.query.resourceType;
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;

    const result = await ActivityLog.getAll(page, limit, filters);

    logger.debug(`[ACTIVITY] Fetched ${result.logs.length} logs`);

    return res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error(`[ACTIVITY] Error fetching activity logs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity logs by admin
 */
const getAdminActivityLogs = async (req, res) => {
  try {
    const { adminId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await ActivityLog.getByAdmin(adminId, page, limit);

    return res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error(`[ACTIVITY] Error fetching admin activity logs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity by resource
 */
const getResourceActivityLogs = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await ActivityLog.getByResource(resourceType, resourceId, page, limit);

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error(`[ACTIVITY] Error fetching resource activity logs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch resource activity logs',
      error: error.message
    });
  }
};

/**
 * Get recent activity
 */
const getRecentActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const logs = await ActivityLog.getRecent(limit);

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error(`[ACTIVITY] Error fetching recent activity logs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity summary by action
 */
const getActionSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const summary = await ActivityLog.getActionSummary(days);

    return res.status(200).json({
      success: true,
      message: `Activity summary for last ${days} days`,
      data: summary
    });
  } catch (error) {
    logger.error(`[ACTIVITY] Error fetching action summary: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch action summary',
      error: error.message
    });
  }
};

/**
 * Get activity summary by admin
 */
const getAdminSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const summary = await ActivityLog.getAdminSummary(days);

    return res.status(200).json({
      success: true,
      message: `Admin activity summary for last ${days} days`,
      data: summary
    });
  } catch (error) {
    logger.error(`[ACTIVITY] Error fetching admin summary: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin summary',
      error: error.message
    });
  }
};

/**
 * Get activity statistics
 */
const getActivityStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const [actionSummary, adminSummary] = await Promise.all([
      ActivityLog.getActionSummary(days),
      ActivityLog.getAdminSummary(days)
    ]);

    const totalActions = actionSummary.reduce((sum, item) => sum + item.count, 0);
    const totalAdmins = adminSummary.length;
    const topAction = actionSummary[0];
    const topAdmin = adminSummary[0];

    return res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        totalActions,
        totalAdmins,
        topAction: topAction ? {
          action: topAction.action,
          count: topAction.count
        } : null,
        topAdmin: topAdmin ? {
          adminId: topAdmin.admin_id,
          activityCount: topAdmin.activityCount
        } : null,
        actionBreakdown: actionSummary,
        adminActivity: adminSummary
      }
    });
  } catch (error) {
    logger.error(`[ACTIVITY] Error fetching activity statistics: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllActivityLogs,
  getAdminActivityLogs,
  getResourceActivityLogs,
  getRecentActivityLogs,
  getActionSummary,
  getAdminSummary,
  getActivityStats
};
