import api from './api';

export const transactionService = {
  // Fetch paginated transactions with filters (admin scope)
  getTransactions: async (params = {}) => {
    const response = await api.get('/admin/transactions', { params });
    return response;
  },

  // Fetch admin transaction summary (totals, counts, etc)
  getTransactionSummary: async () => {
    const response = await api.get('/admin/transactions/summary');
    return response;
  },

  // Refund a transaction (admin action)
  refundTransaction: async (id, reason = 'Admin refund') => {
    const response = await api.post(`/admin/transactions/${id}/refund`, { reason });
    return response;
  },

  // Get details for a single transaction
  getTransaction: async (reference) => {
    const response = await api.get(`/admin/transactions/${reference}`);
    return response;
  },
};
