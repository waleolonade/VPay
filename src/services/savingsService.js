import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const savingsService = {
  /** Get all savings plans for the authenticated user. */
  getSavings: () => api.get(endpoints.GET_SAVINGS),

  /** Get savings summary (total balance, total interest, active plans count) */
  getSummary: () => api.get(endpoints.SAVINGS_SUMMARY),

  /** Get a single savings plan detail by ID. */
  getPlanDetail: (planId) => api.get(`${endpoints.GET_SAVINGS}/${planId}`),

  /**
   * Create a new savings plan.
   * @param {{ planName, targetAmount, frequency, isAutoSave, autoSaveAmount, autoSaveRule, ruleValue, maturityDate }} data
   */
  createSavings: (data) => api.post(endpoints.CREATE_SAVINGS, data),

  /**
   * Add funds to an existing savings plan from the wallet.
   * @param {string} planId
   * @param {number} amount
   */
  fundPlan: (planId, amount) =>
    api.post(endpoints.SAVINGS_FUND.replace(':id', planId), { amount }),

  /**
   * Withdraw funds from a savings plan back to the wallet.
   * @param {string} planId
   * @param {number} amount
   */
  withdrawSavings: (planId, amount) =>
    api.post(endpoints.SAVINGS_WITHDRAW.replace(':id', planId), { amount }),

  /**
   * Update auto-save settings for a plan.
   * @param {string} planId
   * @param {{ isAutoSave, autoSaveAmount, frequency }} settings
   */
  updateAutoSave: (planId, settings) =>
    api.patch(`${endpoints.GET_SAVINGS}/${planId}/auto-save`, settings),
};
