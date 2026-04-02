/**
 * Activity Logging Middleware
 * Automatically logs all admin actions
 */

const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

/**
 * Middleware to log admin actions
 * Usage: router.patch('/users/:id', logActivity('user', 'update'), handler)
 */
const logActivity = (resourceType, action, getResourceId = null) => {
  return async (req, res, next) => {
    // Store original res.json to intercept the response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Only log on success
      if (data && data.success) {
        try {
          // Determine resource ID
          let resourceId = null;
          if (typeof getResourceId === 'function') {
            resourceId = getResourceId(req, data);
          } else if (req.params.id) {
            resourceId = req.params.id;
          }

          // Log the activity
          const ipAddress = req.ip || req.connection.remoteAddress || '';
          const details = {
            method: req.method,
            path: req.path,
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            statusCode: res.statusCode
          };

          ActivityLog.log(
            req.user.id,
            action,
            resourceType,
            resourceId,
            details,
            ipAddress
          ).catch(err => {
            logger.error(`[ACTIVITY] Failed to log activity: ${err.message}`);
          });
        } catch (err) {
          logger.error(`[ACTIVITY] Error in activity logging middleware: ${err.message}`);
        }
      }

      // Call the original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware to get request IP address
 */
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['cf-connecting-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

module.exports = {
  logActivity,
  getClientIP
};
