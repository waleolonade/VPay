import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const authService = {
  /**
   * Login with email or phone + password.
   * Returns { success, data: { user, accessToken, refreshToken } }
   */
  login: (identifier, password) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const payload = isEmail
      ? { email: identifier, password }
      : { phone: identifier, password };
    return api.post(endpoints.LOGIN, payload);
  },

  /** Request an OTP to the given phone number for passwordless login. */
  requestOTP: (phone) => api.post(endpoints.LOGIN_OTP, { phone }),

  /** Verify the OTP received via SMS. Returns tokens on success. */
  verifyOTP: (phone, otp) => api.post(endpoints.VERIFY_OTP, { phone, otp }),

  /** Verify the Admin OTP received via Email. Returns tokens on success. */
  verifyAdminOtp: (email, otp) => api.post(endpoints.VERIFY_ADMIN_OTP, { email, otp }),

  /** Resend OTP to the given phone number. */
  resendOTP: (phone) => api.post(endpoints.RESEND_OTP, { phone }),

  /**
   * Register a new user.
   * @param {{ firstName, lastName, email, phone, password }} userData
   */
  register: (userData) => api.post(endpoints.REGISTER, userData),

  /** Invalidate the current session on the server. */
  logout: () => api.post(endpoints.LOGOUT),

  /** Exchange a valid refresh token for a new access token. */
  refreshToken: (token) => api.post(endpoints.REFRESH_TOKEN, { token }),

  /** Send a password-reset OTP to the given phone number. */
  forgotPassword: (phone) => api.post(endpoints.FORGOT_PASSWORD, { phone }),

  /** Complete the password-reset flow. */
  resetPassword: (phone, otp, newPassword) =>
    api.post(endpoints.RESET_PASSWORD, { phone, otp, newPassword }),

  /** Change password while authenticated (requires current password). */
  changePassword: (currentPassword, newPassword) =>
    api.patch(endpoints.CHANGE_PASSWORD, { currentPassword, newPassword }),

  /** Look up the current user's full profile. */
  getProfile: () => api.get(endpoints.GET_PROFILE),

  /** Look up the public profile of any VPay user by phone number. */
  getPublicProfile: (phone) => api.get(`${endpoints.AUTH}/profile/${encodeURIComponent(phone)}`),
};

