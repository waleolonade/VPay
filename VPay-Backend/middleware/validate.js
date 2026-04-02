const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatted,
    });
  };
};

module.exports = validate;
