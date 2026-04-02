const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};

/**
 * Check if IP is in CIDR range
 */
const isIPInCIDR = (ip, cidr) => {
  const [range, bits] = cidr.split('/');
  if (!bits) return ip === range;

  const ip2long = (ip) => {
    const parts = ip.split('.');
    return parts.reduce((acc, part, i) => {
      return acc + parseInt(part) * Math.pow(256, 3 - i);
    }, 0);
  };

  const ipLong = ip2long(ip);
  const rangeLong = ip2long(range);
  const mask = -1 << (32 - parseInt(bits));
  return (ipLong & mask) === (rangeLong & mask);
};

/**
 * Middleware to check if admin's IP is whitelisted
 */
const checkIPWhitelist = async (req, res, next) => {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      return next();
    }

    // Check if IP whitelist is enabled for this admin
    const [adminRows] = await pool.query(
      'SELECT require_ip_whitelist FROM admins WHERE id = ?',
      [adminId]
    );

    if (!adminRows[0]?.require_ip_whitelist) {
      return next();
    }

    const clientIP = getClientIP(req);

    // Get whitelisted IPs for admin
    const [ipRows] = await pool.query(
      'SELECT ip_address FROM admin_ip_whitelist WHERE admin_id = ?',
      [adminId]
    );

    const whitelistedIPs = ipRows.map(r => r.ip_address);

    if (whitelistedIPs.length === 0) {
      logger.warn(`No whitelisted IPs found for admin ${adminId}, request blocked from ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'IP address is not whitelisted'
      });
    }

    // Check if client IP is in any of the whitelisted ranges
    const isAllowed = whitelistedIPs.some(whitelistIP => {
      if (whitelistIP.includes('/')) {
        return isIPInCIDR(clientIP, whitelistIP);
      }
      return clientIP === whitelistIP;
    });

    if (!isAllowed) {
      logger.warn(`Login attempt from non-whitelisted IP ${clientIP} for admin ${adminId}`);
      
      // Log attempt
      await pool.query(
        'INSERT INTO admin_login_attempts (admin_id, ip_address, status, reason) VALUES (?, ?, ?, ?)',
        [adminId, clientIP, 'blocked', 'IP not whitelisted']
      );

      return res.status(403).json({
        success: false,
        message: 'Your IP address is not authorized to access this account'
      });
    }

    // Log successful attempt
    await pool.query(
      'INSERT INTO admin_login_attempts (admin_id, ip_address, status) VALUES (?, ?, ?)',
      [adminId, clientIP, 'success']
    );

    next();
  } catch (error) {
    logger.error(`IP whitelist check error: ${error.message}`);
    next(error);
  }
};

/**
 * Require IP whitelist check
 */
const requireIPWhitelist = async (req, res, next) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get admin's IP whitelist status
    const [adminRows] = await pool.query(
      'SELECT require_ip_whitelist FROM admins WHERE id = ?',
      [adminId]
    );

    if (!adminRows[0]?.require_ip_whitelist) {
      return res.status(403).json({
        success: false,
        message: 'IP whitelist must be enabled to perform this action'
      });
    }

    // Use checkIPWhitelist to verify
    await checkIPWhitelist(req, res, () => {
      next();
    });
  } catch (error) {
    logger.error(`requireIPWhitelist error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  checkIPWhitelist,
  requireIPWhitelist,
  getClientIP,
  isIPInCIDR
};
