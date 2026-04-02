import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  verifyAdminOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-admin-otp', { email, otp });
    return response;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response;
  },
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response;
  },

  getAnalytics: async (period = '30d') => {
    const response = await api.get(`/admin/analytics?period=${period}`);
    return response;
  },

  getRecentActivity: async () => {
    const response = await api.get('/admin/recent-activity');
    return response;
  },
};

export const userService = {
  getUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  },

  freezeWallet: async (id, isFrozen) => {
    const response = await api.patch(`/admin/users/${id}/wallet/freeze`, { isFrozen });
    return response;
  },

  freezeUser: async (id) => {
    const response = await api.patch(`/admin/users/${id}/freeze`);
    return response;
  },

  unfreezeUser: async (id) => {
    const response = await api.patch(`/admin/users/${id}/unfreeze`);
    return response;
  },

  getUserActivity: async (id) => {
    const response = await api.get(`/users/${id}/activity`);
    return response;
  },
};

export const transactionService = {
  getTransactions: async (params) => {
    const response = await api.get('/admin/transactions', { params });
    return response;
  },

  getTransactionById: async (id) => {
    const response = await api.get(`/admin/transactions/${id}`);
    return response;
  },

  getTransactionSummary: async () => {
    const response = await api.get('/admin/transactions/summary');
    return response;
  },

  refundTransaction: async (id, reason) => {
    const response = await api.post(`/transactions/${id}/refund`, { reason });
    return response;
  },

  exportTransactions: async (params) => {
    const response = await api.get('/transactions/export', { params, responseType: 'blob' });
    return response;
  },
};

export const walletService = {
  getWallets: async (params) => {
    const response = await api.get('/wallets', { params });
    return response;
  },

  getWalletById: async (id) => {
    const response = await api.get(`/wallets/${id}`);
    return response;
  },

  creditWallet: async (id, amount, description) => {
    const response = await api.post(`/wallets/${id}/credit`, { amount, description });
    return response;
  },

  debitWallet: async (id, amount, description) => {
    const response = await api.post(`/wallets/${id}/debit`, { amount, description });
    return response;
  },
};

export const loanService = {
  getLoans: async (params) => {
    const response = await api.get('/loans', { params });
    return response;
  },

  getLoanById: async (id) => {
    const response = await api.get(`/loans/${id}`);
    return response;
  },

  approveLoan: async (id) => {
    const response = await api.patch(`/admin/loans/${id}/approve`);
    return response;
  },

  rejectLoan: async (id, reason) => {
    const response = await api.patch(`/admin/loans/${id}/reject`, { reason });
    return response;
  },
};

export const savingsService = {
  getSavings: async (params) => {
    const response = await api.get('/savings', { params });
    return response;
  },

  getSavingsById: async (id) => {
    const response = await api.get(`/savings/${id}`);
    return response;
  },
};

export const investmentService = {
  getInvestments: async (params) => {
    const response = await api.get('/investments', { params });
    return response;
  },

  getInvestmentById: async (id) => {
    const response = await api.get(`/investments/${id}`);
    return response;
  },
};

export const kycService = {
  getKYCRequests: async (params) => {
    const response = await api.get('/kyc', { params });
    return response;
  },

  getKYCById: async (id) => {
    const response = await api.get(`/kyc/${id}`);
    return response;
  },

  updateKYC: async (userId, kycStatus, kycLevel) => {
    const response = await api.patch(`/admin/users/${userId}/kyc`, { kycStatus, kycLevel });
    return response;
  },
};

export const billService = {
  getBills: async (params) => {
    const response = await api.get('/bills', { params });
    return response;
  },
};

export const airtimeService = {
  getAirtimeTransactions: async (params) => {
    const response = await api.get('/airtime', { params });
    return response;
  },
};

export const dataService = {
  getDataTransactions: async (params) => {
    const response = await api.get('/data', { params });
    return response;
  },
};

export const cardService = {
  getCards: async (params) => {
    const response = await api.get('/cards', { params });
    return response;
  },

  getCardById: async (id) => {
    const response = await api.get(`/cards/${id}`);
    return response;
  },

  freezeCard: async (id) => {
    const response = await api.post(`/cards/${id}/freeze`);
    return response;
  },

  unfreezeCard: async (id) => {
    const response = await api.post(`/cards/${id}/unfreeze`);
    return response;
  },
};

export const businessService = {
  getBusinessAccounts: async (params) => {
    const response = await api.get('/business', { params });
    return response;
  },

  getBusinessById: async (id) => {
    const response = await api.get(`/business/${id}`);
    return response;
  },

  approveBusinessAccount: async (id) => {
    const response = await api.post(`/business/${id}/approve`);
    return response;
  },

  rejectBusinessAccount: async (id, reason) => {
    const response = await api.post(`/business/${id}/reject`, { reason });
    return response;
  },
};

export const invoiceService = {
  getInvoices: async (params) => {
    const response = await api.get('/invoices', { params });
    return response;
  },

  getInvoiceById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response;
  },
};

export const paymentLinkService = {
  getPaymentLinks: async (params) => {
    const response = await api.get('/payment-links', { params });
    return response;
  },
  getPaymentLinkById: async (id) => {
    const response = await api.get(`/payment-links/${id}`);
    return response;
  },
  createPaymentLink: async (data) => {
    const response = await api.post('/payment-links', data);
    return response;
  },
  deactivatePaymentLink: async (id) => {
    const response = await api.patch(`/payment-links/${id}/deactivate`);
    return response;
  },
};

export const qrPaymentService = {
  getQRPayments: async (params) => {
    const response = await api.get('/qr', { params });
    return response;
  },
};

export const splitPaymentService = {
  getSplitPayments: async (params) => {
    const response = await api.get('/splits', { params });
    return response;
  },
  createSplitPayment: async (data) => {
    const response = await api.post('/splits', data);
    return response;
  },
};


export const subscriptionService = {
  getSubscriptions: async (params) => {
    const response = await api.get('/subscriptions', { params });
    return response;
  },

  getSubscriptionById: async (id) => {
    const response = await api.get(`/subscriptions/${id}`);
    return response;
  },
};

export const rewardService = {
  getRewards: async (params) => {
    const response = await api.get('/rewards', { params });
    return response;
  },

  createReward: async (data) => {
    const response = await api.post('/rewards', data);
    return response;
  },
};

export const promotionService = {
  getPromotions: async (params) => {
    const response = await api.get('/promotions', { params });
    return response;
  },

  createPromotion: async (data) => {
    const response = await api.post('/promotions', data);
    return response;
  },

  updatePromotion: async (id, data) => {
    const response = await api.put(`/promotions/${id}`, data);
    return response;
  },

  deletePromotion: async (id) => {
    const response = await api.delete(`/promotions/${id}`);
    return response;
  },
};

export const payrollService = {
  getPayrolls: async (params) => {
    const response = await api.get('/payroll', { params });
    return response;
  },

  getPayrollById: async (id) => {
    const response = await api.get(`/payroll/${id}`);
    return response;
  },
};

export const supportService = {
  getTickets: async (params) => {
    const response = await api.get('/support', { params });
    return response;
  },

  getTicketById: async (id) => {
    const response = await api.get(`/support/${id}`);
    return response;
  },

  updateTicket: async (id, data) => {
    const response = await api.put(`/support/${id}`, data);
    return response;
  },

  replyToTicket: async (id, message) => {
    const response = await api.post(`/support/${id}/reply`, { message });
    return response;
  },
};

export const notificationService = {
  getNotifications: async (params) => {
    const response = await api.get('/notifications', { params });
    return response;
  },

  sendNotification: async (data) => {
    const response = await api.post('/admin/notifications', data);
    return response;
  },

  sendBulkNotification: async (data) => {
    const response = await api.post('/notifications/bulk', data);
    return response;
  },
};
