const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique transaction reference
 * Format: VPY-{YYYYMMDD}-{8 random hex chars}
 */
const generateReference = (prefix = 'VPY') => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const unique = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `${prefix}-${dateStr}-${unique}`;
};

module.exports = generateReference;
