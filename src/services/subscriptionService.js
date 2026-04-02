import api from './api';
import { endpoints } from '../constants/apiEndpoints';

const subscriptionService = {
  /** Get all active subscriptions for the authenticated user. */
  getSubscriptions: () => api.get(endpoints.SUBSCRIPTIONS),

  /**
   * Create a new recurring subscription.
   * @param {{
   *   billerId: string,
   *   billerName: string,
   *   customerNumber: string,
   *   amount: number,
   *   frequency: 'daily'|'weekly'|'monthly',
   *   startDate: string,
   *   pin: string,
   * }} data
   */
  createSubscription: (data) => api.post(endpoints.SUBSCRIPTIONS, data),

  /**
   * Cancel an active subscription.
   * @param {string} id  Subscription ID
   */
  cancelSubscription: (id) =>
    api.post(endpoints.SUBSCRIPTION_CANCEL.replace(':id', id)),
};

export default subscriptionService;
