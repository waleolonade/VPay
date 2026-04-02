/**
 * IP Whitelist Routes
 */

const express = require('express');
const router = express.Router();
const {
  getMyWhitelistedIPs,
  getAdminWhitelistedIPs,
  addWhitelistedIP,
  removeWhitelistedIP,
  enableIPWhitelist,
  disableIPWhitelist,
  autoDiscoverCurrentIP,
  getIPActivity,
  getIPWhitelistStatus,
  clearAllWhitelistedIPs
} = require('../controllers/ipWhitelistController');
const { protect } = require('../middleware/auth');
const { checkPermission, superadminOnly } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/permissions');

// All IP whitelist routes require authentication
router.use(protect);

/**
 * User's own IP whitelist management
 */

/**
 * Get current user's whitelisted IPs and status
 */
router.get('/my-whitelist', getMyWhitelistedIPs);

/**
 * Get IP whitelist status
 */
router.get('/status', getIPWhitelistStatus);

/**
 * Add current IP to whitelist
 */
router.post('/auto-discover', autoDiscoverCurrentIP);

/**
 * Add IP to whitelist
 */
router.post('/add', addWhitelistedIP);

/**
 * Remove IP from whitelist
 */
router.post('/remove', removeWhitelistedIP);

/**
 * Enable IP whitelist checking
 */
router.post('/enable', enableIPWhitelist);

/**
 * Disable IP whitelist checking
 */
router.post('/disable', disableIPWhitelist);

/**
 * Get IP activity (login attempts from various IPs)
 */
router.get('/activity', getIPActivity);

/**
 * Clear all whitelisted IPs
 */
router.post('/clear-all', clearAllWhitelistedIPs);

/**
 * Superadmin routes
 */
router.use(superadminOnly);

/**
 * Get whitelisted IPs for any admin (superadmin only)
 */
router.get('/admin/:adminId/whitelist', getAdminWhitelistedIPs);

module.exports = router;
