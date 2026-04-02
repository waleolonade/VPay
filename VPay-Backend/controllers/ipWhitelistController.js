/**
 * IP Whitelist Controller
 */

const IPWhitelist = require('../models/IPWhitelist');
const logger = require('../utils/logger');

/**
 * Get whitelisted IPs for current admin
 */
const getMyWhitelistedIPs = async (req, res) => {
  try {
    const adminId = req.user.id;

    const ips = await IPWhitelist.getAdminIPs(adminId);
    const ipCheckEnabled = await IPWhitelist.getIPCheckStatus(adminId);

    return res.status(200).json({
      success: true,
      data: {
        ips,
        ipCheckEnabled
      }
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error getting whitelisted IPs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch whitelisted IPs',
      error: error.message
    });
  }
};

/**
 * Get whitelisted IPs for a specific admin (superadmin only)
 */
const getAdminWhitelistedIPs = async (req, res) => {
  try {
    const { adminId } = req.params;

    const ips = await IPWhitelist.getAdminIPs(adminId);
    const ipCheckEnabled = await IPWhitelist.getIPCheckStatus(adminId);

    return res.status(200).json({
      success: true,
      data: {
        ips,
        ipCheckEnabled
      }
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error getting admin whitelisted IPs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin whitelisted IPs',
      error: error.message
    });
  }
};

/**
 * Add IP to whitelist
 */
const addWhitelistedIP = async (req, res) => {
  try {
    const { ipAddress, description } = req.body;
    const adminId = req.user.id;

    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    if (!IPWhitelist.isValidIP(ipAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format'
      });
    }

    const added = await IPWhitelist.addIP(adminId, ipAddress, description);

    if (!added) {
      return res.status(400).json({
        success: false,
        message: 'IP address already in whitelist'
      });
    }

    logger.info(`[IP_WHITELIST] IP added: ${ipAddress} for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: 'IP address added to whitelist',
      data: { ipAddress, description }
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error adding IP: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to add IP to whitelist',
      error: error.message
    });
  }
};

/**
 * Remove IP from whitelist
 */
const removeWhitelistedIP = async (req, res) => {
  try {
    const { ipAddress } = req.body;
    const adminId = req.user.id;

    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    await IPWhitelist.removeIP(adminId, ipAddress);

    logger.info(`[IP_WHITELIST] IP removed: ${ipAddress} for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: 'IP address removed from whitelist'
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error removing IP: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove IP from whitelist',
      error: error.message
    });
  }
};

/**
 * Enable IP whitelist checking
 */
const enableIPWhitelist = async (req, res) => {
  try {
    const adminId = req.user.id;

    await IPWhitelist.enableIPCheck(adminId);

    logger.warn(`[IP_WHITELIST] IP check enabled for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: 'IP whitelist checking enabled'
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error enabling IP check: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to enable IP whitelist',
      error: error.message
    });
  }
};

/**
 * Disable IP whitelist checking
 */
const disableIPWhitelist = async (req, res) => {
  try {
    const adminId = req.user.id;

    await IPWhitelist.disableIPCheck(adminId);

    logger.warn(`[IP_WHITELIST] IP check disabled for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: 'IP whitelist checking disabled'
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error disabling IP check: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable IP whitelist',
      error: error.message
    });
  }
};

/**
 * Auto-discover and add current IP
 */
const autoDiscoverCurrentIP = async (req, res) => {
  try {
    const adminId = req.user.id;
    const currentIP = req.ip || req.connection.remoteAddress || '';

    if (!currentIP) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine current IP address'
      });
    }

    const added = await IPWhitelist.autoDiscoverIP(adminId, currentIP, 'Current device');

    return res.status(200).json({
      success: true,
      message: added ? 'Current IP added to whitelist' : 'Current IP already in whitelist',
      data: { currentIP }
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error auto-discovering IP: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to discover current IP',
      error: error.message
    });
  }
};

/**
 * Get IP activity (login attempts from different IPs)
 */
const getIPActivity = async (req, res) => {
  try {
    const adminId = req.user.id;

    const activity = await IPWhitelist.getAdminIPActivity(adminId);

    return res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error getting IP activity: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch IP activity',
      error: error.message
    });
  }
};

/**
 * Get IP whitelist status
 */
const getIPWhitelistStatus = async (req, res) => {
  try {
    const adminId = req.user.id;

    const ipCheckEnabled = await IPWhitelist.getIPCheckStatus(adminId);
    const ips = await IPWhitelist.getAdminIPs(adminId);

    return res.status(200).json({
      success: true,
      data: {
        enabled: ipCheckEnabled,
        totalIPs: ips.length,
        ips
      }
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error getting IP whitelist status: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch IP whitelist status',
      error: error.message
    });
  }
};

/**
 * Clear all whitelisted IPs
 */
const clearAllWhitelistedIPs = async (req, res) => {
  try {
    const adminId = req.user.id;

    if (!req.body.confirmClear) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required to clear all IPs'
      });
    }

    await IPWhitelist.clearAdminIPs(adminId);

    logger.warn(`[IP_WHITELIST] All IPs cleared for admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: 'All whitelisted IPs cleared'
    });
  } catch (error) {
    logger.error(`[IP_WHITELIST] Error clearing IPs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear whitelisted IPs',
      error: error.message
    });
  }
};

module.exports = {
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
};
