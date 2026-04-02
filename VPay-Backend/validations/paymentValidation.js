const { body } = require('express-validator');

const bankTransferValidation = [
  body('accountNumber').isLength({ min: 10, max: 10 }).isNumeric().withMessage('Account number must be 10 digits'),
  body('bankCode').notEmpty().withMessage('Bank code is required'),
  body('bankName').notEmpty().withMessage('Bank name is required'),
  body('accountName').notEmpty().withMessage('Account name is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
];

const vpayTransferValidation = [
  body('recipientPhone')
    .matches(/^(\+234|0)[7-9][01]\d{8}$/)
    .withMessage('Valid Nigerian phone number required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
];

const fundWalletValidation = [
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
];

const airtimeValidation = [
  body('phone').matches(/^(\+234|0)[7-9][01]\d{8}$/).withMessage('Valid phone required'),
  body('network').isIn(['mtn', 'airtel', 'glo', '9mobile']).withMessage('Invalid network'),
  body('amount').isFloat({ min: 50 }).withMessage('Minimum airtime is ₦50'),
  body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
];

module.exports = { bankTransferValidation, vpayTransferValidation, fundWalletValidation, airtimeValidation };
