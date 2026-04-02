const Joi = require('joi');

const NIGERIAN_PHONE_REGEX = /^(\+234|0)[7-9][01]\d{8}$/;

const validatePhone = (phone) => NIGERIAN_PHONE_REGEX.test(phone);

const validateEmail = (email) => Joi.string().email().validate(email).error === undefined;

const validateAmount = (amount, min = 1, max = 10000000) => {
  return typeof amount === 'number' && amount >= min && amount <= max;
};

const validatePassword = (password) => {
  // Min 8 chars, at least one uppercase, one lowercase, one digit
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};

const validatePIN = (pin) => /^\d{4}$/.test(pin);

const validateBVN = (bvn) => /^\d{11}$/.test(bvn);

const validateNIN = (nin) => /^\d{11}$/.test(nin);

const validateAccountNumber = (accountNumber) => /^\d{10}$/.test(accountNumber);

module.exports = {
  validatePhone,
  validateEmail,
  validateAmount,
  validatePassword,
  validatePIN,
  validateBVN,
  validateNIN,
  validateAccountNumber,
  NIGERIAN_PHONE_REGEX,
};
