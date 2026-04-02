const { body } = require('express-validator');

const updateProfileValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
];

const changePinValidation = [
  body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 chars with uppercase, lowercase, and number'),
];

module.exports = { updateProfileValidation, changePinValidation, changePasswordValidation };
