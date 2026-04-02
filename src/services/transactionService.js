import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const transactionService = {
  /**
   * Fetch a paginated list of transactions.
   * @param {{ limit?: number, offset?: number, type?: string, category?: string, startDate?: string, endDate?: string }} params
   */
  getTransactions: (params = {}) =>
    api.get(endpoints.GET_TRANSACTIONS, {
      params: { limit: 10, offset: 0, ...params },
    }),

  getTransaction: (reference) =>
    api.get(endpoints.GET_TRANSACTION.replace(':reference', reference)),

  /**
   * Alias for getTransaction to match usage in TransactionDetailScreen
   * @param {string} reference 
   */
  getTransactionByReference: (reference) =>
    api.get(endpoints.GET_TRANSACTION.replace(':reference', reference)),

  /**
   * Fetch an income / expense summary for the authenticated user.
   * Useful for dashboard charts.
   */
  getTransactionSummary: () =>
    api.get(endpoints.GET_TRANSACTION_SUMMARY),

  /**
   * Fetch VFD VBAAS transactions (proxied via backend).
   * Supports VFD params: page, limit, from_date, to_date, type, status
   * Fallback to internal transactions if VFD fails.
   */
  getVFDTransactions: async (params = {}) => {
    try {
      return await api.get(endpoints.VFD_TRANSACTIONS, {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          from_date: params.fromDate,
          to_date: params.toDate,
          type: params.type,
          status: params.status,
        },
      });
    } catch (vfdError) {
      console.warn('VFD transactions failed, falling back to internal:', vfdError);
      return await api.get(endpoints.GET_TRANSACTIONS, { params });
    }
  },

  /**
   * Get AI-powered financial advice based on the user's transaction history.
   * @param {string} [question] - Optional custom question for the AI
   */
  getAIAdvice: (question) =>
    api.post(endpoints.AI_ADVICE, { question }),
};

