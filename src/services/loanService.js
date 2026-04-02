import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const loanService = {
  /** Get all active / historical loans for the authenticated user. */
  getLoans: () => api.get(endpoints.GET_LOANS),

  /** Check whether the authenticated user qualifies for a loan. */
  checkEligibility: () => api.get(endpoints.LOAN_ELIGIBILITY),

  /**
   * Get an indicative repayment schedule for a given amount and duration.
   * @param {{ amount: number, duration: number }} params
   */
  calculateLoan: (amount, duration) =>
    api.post(endpoints.LOAN_CALCULATE, { amount, duration }),

  /**
   * Submit a loan application.
   * @param {{ amount: number, duration: number, purpose: string, pin: string }} loanData
   */
  applyLoan: (loanData) => api.post(endpoints.APPLY_LOAN, loanData),

  /**
   * Make a repayment against an existing loan.
   * @param {string} loanId
   * @param {number} amount
   * @param {string} pin  Transaction PIN
   */
  repayLoan: (loanId, amount, pin) =>
    api.post(endpoints.LOAN_REPAY.replace(':id', loanId), { amount, pin }),
};
