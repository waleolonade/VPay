const jwt = require('jsonwebtoken');

const authConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  bcryptSaltRounds: 12,
};

const generateAccessToken = (payload) => {
  return jwt.sign(payload, authConfig.jwtSecret, { expiresIn: authConfig.jwtExpiresIn });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, authConfig.jwtRefreshSecret, { expiresIn: authConfig.jwtRefreshExpiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, authConfig.jwtSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, authConfig.jwtRefreshSecret);
};

module.exports = { authConfig, generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
