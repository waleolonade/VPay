/**
 * RBAC Permission Middleware
 * Middleware functions for role-based access control
 */

const { hasPermission, hasAnyPermission, hasAllPermissions } = require('../config/permissions');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {Function} Express middleware
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn(`[PERMISSION] No user context for permission check: ${permission}`);
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    if (!hasPermission(req.user.role, permission)) {
      logger.warn(`[PERMISSION] User ${req.user.phone} (${req.user.role}) denied access to ${permission}`);
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Permission required: ${permission}`,
        requiredPermission: permission,
        userRole: req.user.role
      });
    }

    logger.debug(`[PERMISSION] User ${req.user.phone} granted permission: ${permission}`);
    next();
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 * @param {Array<string>} permissions - Array of permissions
 * @returns {Function} Express middleware
 */
const checkAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn(`[PERMISSION] No user context for permission check`);
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      logger.warn(`[PERMISSION] User ${req.user.phone} (${req.user.role}) denied access. Required any of: ${permissions.join(', ')}`);
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. One of these permissions required: ${permissions.join(', ')}`,
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }

    logger.debug(`[PERMISSION] User ${req.user.phone} has required permission`);
    next();
  };
};

/**
 * Middleware to check if user has all specified permissions
 * @param {Array<string>} permissions - Array of permissions
 * @returns {Function} Express middleware
 */
const checkAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn(`[PERMISSION] No user context for permission check`);
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      logger.warn(`[PERMISSION] User ${req.user.phone} (${req.user.role}) denied access. Required all of: ${permissions.join(', ')}`);
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. All these permissions required: ${permissions.join(', ')}`,
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }

    logger.debug(`[PERMISSION] User ${req.user.phone} has all required permissions`);
    next();
  };
};

/**
 * Middleware to require superadmin only
 * @returns {Function} Express middleware
 */
const superadminOnly = (req, res, next) => {
  if (!req.user) {
    logger.warn(`[PERMISSION] No user context for superadmin check`);
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }

  if (req.user.role !== 'superadmin') {
    logger.warn(`[PERMISSION] User ${req.user.phone} (${req.user.role}) denied superadmin access`);
    return res.status(403).json({ 
      success: false, 
      message: 'Superadmin access required.',
      userRole: req.user.role
    });
  }

  logger.debug(`[PERMISSION] User ${req.user.phone} has superadmin access`);
  next();
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  superadminOnly
};
