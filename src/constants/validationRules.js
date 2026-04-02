// Validation rules
export const validationRules = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+234|0)[0-9]{10}$/,
  pin: /^[0-9]{4}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

export const errorMessages = {
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  invalidPin: 'PIN must be 4 digits',
  weakPassword: 'Password must contain uppercase, lowercase, number, and special character',
  required: 'This field is required',
  minLength: (length) => `Minimum length is ${length} characters`,
  maxLength: (length) => `Maximum length is ${length} characters`,
};
