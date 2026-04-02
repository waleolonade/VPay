import api from './api';

export const businessService = {
  // Submit business account request
  async submitRequest(data) {
    const response = await api.post('/api/v1/business/request', data);
    return response.data;
  },

  // Get user's business requests history
  async getRequests() {
    const response = await api.get('/api/v1/business/requests');
    return response.data;
  },

  // Get analytics overview
  async getAnalyticsOverview() {
    const response = await api.get('/api/v1/business/analytics/overview');
    return response.data;
  },

  // Get monthly trends
  async getMonthlyTrends(months = 6) {
    const response = await api.get(`/api/v1/business/analytics/trends?months=${months}`);
    return response.data;
  },

  // Get top customers
  async getTopCustomers(limit = 10) {
    const response = await api.get(`/api/v1/business/analytics/customers?limit=${limit}`);
    return response.data;
  },

  // Get category breakdown
  async getCategoryBreakdown() {
    const response = await api.get('/api/v1/business/analytics/categories');
    return response.data;
  },

  // Get recent activity
  async getRecentActivity(limit = 20) {
    const response = await api.get(`/api/v1/business/analytics/activity?limit=${limit}`);
    return response.data;
  },

  // Get growth rate
  async getGrowthRate() {
    const response = await api.get('/api/v1/business/analytics/growth');
    return response.data;
  },
};
