const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // MySQL duplicate entry (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    statusCode = 409;
    // Extract field name from MySQL error message e.g. "Duplicate entry 'x' for key 'users.email'"
    const match = err.message.match(/for key '(.+?)'/);
    const field = match ? match[1].split('.').pop() : 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // MySQL constraint violation
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  if (statusCode === 500) {
    logger.error(`${err.message}\n${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
