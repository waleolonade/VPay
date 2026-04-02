import api from './api';
import { endpoints } from '../constants/apiEndpoints';

/**
 * Offers & Promotions Service
 * Handles fetching personalized offers, cashback deals, and promotional content
 */
export const offersService = {
  /**
   * Get all active promotions and offers
   */
  getPromotions: async () => {
    try {
      const { data } = await api.get(endpoints.PROMOTIONS);
      return data;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  },

  /**
   * Get personalized offers based on user activity
   */
  getPersonalizedOffers: async () => {
    try {
      const { data } = await api.get(endpoints.PERSONALIZED_OFFERS);
      return data;
    } catch (error) {
      console.error('Error fetching personalized offers:', error);
      throw error;
    }
  },

  /**
   * Get cashback offers
   */
  getCashbackOffers: async () => {
    try {
      const { data } = await api.get(endpoints.CASHBACK_OFFERS);
      return data;
    } catch (error) {
      console.error('Error fetching cashback offers:', error);
      throw error;
    }
  },

  /**
   * Track promotion click/view
   */
  trackPromotion: async (promotionId, action = 'view') => {
    try {
      const { data } = await api.post(endpoints.TRACK_PROMOTION, {
        promotionId,
        action,
      });
      return data;
    } catch (error) {
      console.error('Error tracking promotion:', error);
      // Don't throw - this is not critical
    }
  },
};
