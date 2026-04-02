import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const dashboardService = {
  getDashboard: async () => {
    try {
      const response = await api.get(endpoints.DASHBOARD);
      return response.data;
    } catch (error) {
      if (!error.silent) {
        console.error('Error fetching dashboard:', error);
      }
      throw error;
    }
  },
};