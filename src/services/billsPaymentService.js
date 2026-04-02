/**
 * Bills Payment Service
 * Proxies to the VPay backend which calls VFD BaaS under the hood.
 * JWT auth is injected automatically by the api.js interceptor.
 *
 * Typical flow:
 *  1. getCategories()      – list available categories
 *  2. getBillers(cat)      – list billers for a category
 *  3. getBillerItems(...)  – list plans / payment items for a biller
 *  4. validateCustomer()   – verify customer ID (meter no., decoder no., etc.)
 *  5. payBill()            – execute the payment
 *  6. getTransactionStatus() – poll for final status
 */
import api from './api';
import { endpoints } from '../constants/apiEndpoints';

const billsService = {
  /**
   * Get all biller categories.
   * Returns: [{ category: string }, ...]
   */
  getCategories: async () => {
    const res = await api.get(endpoints.BILLS_CATEGORIES);
    return res.data ?? [];
  },

  /**
   * Get billers for a category (pass null for all billers).
   * Returns: [{ id, name, division, product, category, convenienceFee? }, ...]
   */
  getBillers: async (categoryName = null) => {
    const params = categoryName ? { category: categoryName } : {};
    const res = await api.get(endpoints.BILLS_BILLERS, { params });
    return res.data ?? [];
  },

  /**
   * Get payment items / plans for a specific biller.
   * Returns: [{ id, billerid, paymentCode, paymentitemname, amount, isAmountFixed }, ...]
   */
  getBillerItems: async (billerId, divisionId, productId) => {
    const url = endpoints.BILLS_BILLER_ITEMS.replace(':billerId', billerId);
    const res = await api.get(url, { params: { divisionId, productId } });
    // VFD API returns { paymentitems: [...] } or sometimes just the array
    if (res.data && res.data.paymentitems) return res.data.paymentitems;
    if (Array.isArray(res.data)) return res.data;
    return res.data ?? [];
  },

  /**
   * Validate a customer ID before payment.
   * Required for Utility, Cable TV and Betting; optional for Airtime / Data.
   * Returns: { success: boolean, message: string }
   */
  validateCustomer: ({ billerId, customerId, divisionId, paymentItem }) =>
    api.post(endpoints.BILLS_VERIFY, {
      billerId,
      customerNumber: customerId,
      divisionId,
      paymentItem,
    }).then((res) => res.data),

  /**
   * Execute a bill payment.
   * PIN is verified server-side against the user's transaction PIN.
   * Returns the created bill record.
   *
   * @param {{
   *   billerId: string,
   *   billerName: string,
   *   billType: string,
   *   customerNumber: string,
   *   customerName?: string,
   *   division: string,
   *   paymentItem: string,
   *   productId: string,
   *   amount: number,
   *   pin: string,
   *   phoneNumber?: string,
   * }} params
   */
  payBill: (params) =>
    api.post(endpoints.BILLS_PAY, {
      ...params,
      customerNumber: params.customerNumber ?? '',
    }).then((res) => res.data),

  /**
   * Buy airtime directly (shortcut — no biller-item lookup needed).
   * @param {{ network: string, phone: string, amount: number, pin: string }} params
   */
  buyAirtime: (params) => api.post(endpoints.AIRTIME_BUY, params),

  /** Get the authenticated user's airtime purchase history. */
  getAirtimeHistory: (page = 1, limit = 10) =>
    api.get(endpoints.AIRTIME_HISTORY, { params: { page, limit } }),

  /**
   * Get available data plans for a mobile network.
   * @param {string} network  e.g. 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE'
   */
  getDataPlans: (network) =>
    api.get(endpoints.DATA_PLANS.replace(':network', network)),

  /**
   * Buy a data bundle.
   * @param {{ network: string, phone: string, planCode: string, amount: number, pin: string }} params
   */
  buyData: (params) => api.post(endpoints.DATA_BUY, params),

  /** Get the authenticated user's data purchase history. */
  getDataHistory: (page = 1, limit = 10) =>
    api.get(endpoints.DATA_HISTORY, { params: { page, limit } }),

  /**
   * Poll the status of a bill transaction.
   * Returns: { transactionStatus: string, amount: string, token?: string }
   */
  getTransactionStatus: async (transactionId) => {
    const url = endpoints.BILLS_STATUS.replace(':transactionId', transactionId);
    const res = await api.get(url);
    return res.data;
  },

  /**
   * Get the authenticated user's bill payment history.
   * Returns: { success, data: Bill[], pagination }
   */
  getBillHistory: (page = 1, limit = 10) =>
    api.get(endpoints.BILLS_HISTORY, { params: { page, limit } }),
};

export default billsService;
