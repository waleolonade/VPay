const { verifyAccessToken } = require('../config/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const endpoint = `${req.method} ${req.path}`;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`[PROTECT] No token on ${endpoint}`);
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn(`[PROTECT] User not found for token on ${endpoint}`);
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      logger.warn(`[PROTECT] User inactive on ${endpoint}`);
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    logger.debug(`[PROTECT] Token valid for user ${user.phone} on ${endpoint}`);
    req.user = user;
    next();
  } catch (error) {
    const endpoint = `${req.method} ${req.path}`;
    const tokenPrefix = req.headers.authorization?.split(' ')[1]?.substring(0, 10) || 'NO_TOKEN';
    logger.warn(`[PROTECT] Auth error on ${endpoint}: ${error.message} (token: ${tokenPrefix}...)`);

    if (error.name === 'TokenExpiredError') {
      const decodedExpired = require('jsonwebtoken').decode(token);
      if (decodedExpired) {
        logger.warn(`[PROTECT] Expired Token Info: iat=${new Date(decodedExpired.iat * 1000).toISOString()}, exp=${new Date(decodedExpired.exp * 1000).toISOString()}, serverTime=${new Date().toISOString()}`);
      }
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

const superadminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    logger.warn(`[AUTH] Non-superadmin access attempt: ${req.user?.phone} (${req.user?.role})`);
    return res.status(403).json({ success: false, message: 'Superadmin access required.' });
  }
  next();
};

module.exports = { protect, authorize, adminOnly, superadminOnly };
