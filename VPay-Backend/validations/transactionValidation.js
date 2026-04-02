const { body, query } = require('express-validator');

const getTransactionsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['credit', 'debit']).withMessage('Type must be credit or debit'),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'reversed']),
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required'),
];

module.exports = { getTransactionsValidation };
