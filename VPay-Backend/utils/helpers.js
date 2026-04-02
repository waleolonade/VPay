const crypto = require('crypto');

/**
 * Format amount to currency string
 */
const formatCurrency = (amount, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
};

/**
 * Mask sensitive data (e.g., account number, phone)
 */
const maskData = (data, visibleStart = 3, visibleEnd = 3) => {
  if (!data || data.length <= visibleStart + visibleEnd) return data;
  const masked = '*'.repeat(data.length - visibleStart - visibleEnd);
  return `${data.slice(0, visibleStart)}${masked}${data.slice(-visibleEnd)}`;
};

/**
 * Generate a random alphanumeric string
 */
const generateRandomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
};

/**
 * Generate a wallet account number (10 digits starting with 9)
 */
const generateAccountNumber = () => {
  const random = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
  return `9${random}`;
};

/** Personal wallet account — starts with 4 (e.g. 4xxxxxxxxx) */
const generatePersonalAccountNumber = () => {
  const random = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
  return `4${random}`;
};

/** Business wallet account — starts with 5 (e.g. 5xxxxxxxxx) */
const generateBusinessAccountNumber = () => {
  const random = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
  return `5${random}`;
};

/**
 * Generate a referral code
 */
const generateReferralCode = (firstName = '') => {
  const prefix = firstName.slice(0, 3).toUpperCase() || 'VPY';
  const suffix = generateRandomString(5);
  return `${prefix}${suffix}`;
};

/**
 * Paginate query results
 */
const paginate = (page = 1, limit = 20) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return { skip, limit: parseInt(limit) };
};

/**
 * Build pagination metadata
 */
const paginationMeta = (total, page, limit) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

/**
 * Pick specific keys from an object
 */
const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
};

module.exports = {
  formatCurrency,
  maskData,
  generateRandomString,
  generateAccountNumber,
  generatePersonalAccountNumber,
  generateBusinessAccountNumber,
  generateReferralCode,
  paginate,
  paginationMeta,
  pick,
};
