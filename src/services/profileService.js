import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const profileService = {
  /** Get the full profile of the authenticated user. */
  getProfile: () => api.get(endpoints.GET_PROFILE),

  /**
   * Update editable profile fields.
   * @param {{ firstName?: string, lastName?: string, email?: string, address?: string }} data
   */
  updateProfile: (data) => api.put(endpoints.UPDATE_PROFILE, data),

  /**
   * Upload or replace the user's profile avatar.
   * @param {string} imageUri  Local URI returned by expo-image-picker
   */
  uploadAvatar: (imageUri) => {
    const formData = new FormData();
    formData.append('avatar', { uri: imageUri, type: 'image/jpeg', name: 'avatar.jpg' });
    return api.patch(endpoints.UPLOAD_AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Prevent axios from JSON-serialising FormData
      transformRequest: (d) => d,
    });
  },

  /**
   * Change the account password.
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  changePassword: (currentPassword, newPassword) =>
    api.patch(endpoints.CHANGE_PASSWORD, { currentPassword, newPassword }),

  /**
   * Set or update the transaction PIN.
   * @param {string} pin  4-digit numeric PIN
   * @param {string} [currentPin]  Required when updating an existing PIN
   */
  setPin: (pin, currentPin) =>
    api.patch(endpoints.SET_PIN, { pin, ...(currentPin && { currentPin }) }),

  // ── Bank accounts & cards ────────────────────────────────────────────────

  /** Get the user's saved bank accounts and cards. */
  getBanksAndCards: () => api.get(endpoints.BANK_ACCOUNTS),

  /**
   * Add a new bank account.
   * @param {{ accountNumber: string, bankCode: string, bankName: string }} data
   */
  addBankAccount: (data) => api.post(endpoints.BANK_ACCOUNTS, data),

  /** Remove a saved bank account. */
  removeBankAccount: (id) =>
    api.delete(endpoints.BANK_ACCOUNT.replace(':id', id)),

  /** Add a debit/credit card (tokenised). */
  addCard: (cardData) => api.post(endpoints.CARDS, cardData),

  /** Remove a saved card. */
  removeCard: (id) => api.delete(endpoints.CARD.replace(':id', id)),

  // ── Beneficiaries ─────────────────────────────────────────────────────────

  /** Get all saved beneficiaries. */
  getBeneficiaries: () => api.get(endpoints.BENEFICIARIES),

  /**
   * Save a new beneficiary.
   * @param {{ name: string, phone?: string, accountNumber?: string, bankCode?: string, type: string }} data
   */
  addBeneficiary: (data) => api.post(endpoints.BENEFICIARIES, data),

  /** Update a saved beneficiary. */
  updateBeneficiary: (id, data) =>
    api.put(endpoints.BENEFICIARY.replace(':id', id), data),

  /** Delete a saved beneficiary. */
  deleteBeneficiary: (id) =>
    api.delete(endpoints.BENEFICIARY.replace(':id', id)),
};
