/**
 * Activity Log Routes
 */

const express = require('express');
const router = express.Router();
const {
  getAllActivityLogs,
  getAdminActivityLogs,
  getResourceActivityLogs,
  getRecentActivityLogs,
  getActionSummary,
  getAdminSummary,
  getActivityStats
} = require('../controllers/activityLogController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/permissions');

// All activity log routes require authentication and VIEW_ADMIN_LOGS permission
router.use(protect, checkPermission(PERMISSIONS.VIEW_ADMIN_LOGS));

/**
 * Get all activity logs with pagination and filters
 */
router.get('/', getAllActivityLogs);

/**
 * Get activity statistics and summaries
 */
router.get('/stats/overview', getActivityStats);

/**
 * Get activity summary by action type
 */
router.get('/summary/actions', getActionSummary);

/**
 * Get activity summary by admin
 */
router.get('/summary/admins', getAdminSummary);

/**
 * Get recent activity logs
 */
router.get('/recent', getRecentActivityLogs);

/**
 * Get activity logs for a specific admin
 */
router.get('/admin/:adminId', getAdminActivityLogs);

/**
 * Get activity logs for a specific resource
 */
router.get('/resource/:resourceType/:resourceId?', getResourceActivityLogs);

module.exports = router;
