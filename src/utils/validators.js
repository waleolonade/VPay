// Form validators
import { validationRules, errorMessages } from '../constants/validationRules';

export const validateEmail = (email) => {
  if (!email) return errorMessages.required;
  if (!validationRules.email.test(email)) {
    return errorMessages.invalidEmail;
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return errorMessages.required;
  if (!validationRules.phone.test(phone)) {
    return errorMessages.invalidPhone;
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) return errorMessages.required;
  if (password.length < 8) {
    return errorMessages.minLength(8);
  }
  if (!validationRules.password.test(password)) {
    return errorMessages.weakPassword;
  }
  return null;
};

export const validatePin = (pin) => {
  if (!pin) return errorMessages.required;
  if (!validationRules.pin.test(pin)) {
    return errorMessages.invalidPin;
  }
  return null;
};

export const validateAmount = (amount) => {
  if (!amount) return errorMessages.required;
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return 'Please enter a valid amount';
  }
  return null;
};

export const validateBVN = (bvn) => {
  if (!bvn) return null; // BVN is optional
  if (!/^\d{11}$/.test(bvn)) {
    return 'BVN must be exactly 11 digits';
  }
  return null;
};

export const validateNIN = (nin) => {
  if (!nin) return null; // NIN is optional
  if (!/^\d{11}$/.test(nin)) {
    return 'NIN must be exactly 11 digits';
  }
  return null;
};

export const validateDateOfBirth = (date) => {
  if (!date) return null; // Optional
  const today = new Date();
  const birthDate = new Date(date);
  const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
  
  if (age < 18) {
    return 'You must be at least 18 years old';
  }
  if (age > 120) {
    return 'Please enter a valid date of birth';
  }
  return null;
};

export const validateName = (name, fieldName = 'Name') => {
  if (!name) return `${fieldName} is required`;
  if (name.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return `${fieldName} can only contain letters, spaces, hyphens and apostrophes`;
  }
  return null;
};
