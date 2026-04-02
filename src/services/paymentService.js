import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const paymentService = {
  // ── Bank list ─────────────────────────────────────────────────────────────

  /** Fetch all supported Nigerian banks from VFD BaaS. */
  getBanks: () => api.get(endpoints.BANKS_LIST),

  // ── Bank transfers ────────────────────────────────────────────────────────

  /**
   * Send money to an external bank account.
   * @param {{ accountNumber: string, bankCode: string, amount: number, narration?: string, pin: string }} params
   */
  bankTransfer: (params) => api.post(endpoints.BANK_TRANSFER, params),

  /**
   * Send money to another VPay user instantly (internal transfer).
   * @param {{ recipientPhone: string, amount: number, description?: string, pin: string }} params
   */
  vpayTransfer: (params) => api.post(endpoints.VPAY_TRANSFER, params),

  /**
   * Search for VPay users by phone, first name, or last name.
   * @param {string} query - Search query (min 3 chars)
   */
  searchVPayUsers: (query) => api.get(endpoints.SEARCH_VPAY_USERS, { params: { query } }),

  // ── Account resolution ────────────────────────────────────────────────────

  /**
   * Resolve a bank account number to get the account holder's name.
   * @param {{ accountNumber: string, bankCode: string }} params
   */
  resolveAccount: (accountNumber, bankCode) =>
    api.post(endpoints.RESOLVE_ACCOUNT, { accountNumber, bankCode }),

  /**
   * Verify a VPay account by phone number OR VPay account number.
   * @param {string|null} phone - 11-digit phone number
   * @param {string|null} accountNumber - external bank account number
   * @param {string|null} bankCode - external bank code
   * @param {string|null} vpayAccountNumber - 10-digit VPay account number
   */
  verifyAccount: (phone, accountNumber, bankCode, vpayAccountNumber) => {
    const body = {};
    if (vpayAccountNumber) {
      body.vpayAccountNumber = vpayAccountNumber;
      console.log('[paymentService] Verifying VPay account:', vpayAccountNumber);
    } else if (phone) {
      body.phone = phone;
      console.log('[paymentService] Verifying VPay user by phone:', phone);
    } else {
      body.accountNumber = accountNumber;
      body.bankCode = bankCode;
      console.log('[paymentService] Verifying external bank account:', accountNumber, 'at bank:', bankCode);
    }
    return api.post(endpoints.VERIFY_ACCOUNT, body);
  },

  // ── Payment links ─────────────────────────────────────────────────────────

  /**
   * Create a shareable payment link.
   * @param {{ title: string, amount?: number, description?: string }} params
   */
  createPaymentLink: (params) => api.post(endpoints.PAYMENT_LINKS, params),

  /** Get all payment links created by the authenticated user. */
  getMyPaymentLinks: () => api.get(endpoints.PAYMENT_LINKS),

  /** Get public details of a payment link by its slug (no auth required). */
  getPaymentLinkBySlug: (slug) =>
    api.get(endpoints.PAYMENT_LINK_SLUG.replace(':slug', slug)),

  /** Deactivate a payment link. */
  deactivatePaymentLink: (id) =>
    api.put(endpoints.PAYMENT_LINK_DEACTIVATE.replace(':id', id)),

  // ── Bill splitting ────────────────────────────────────────────────────────

  /**
   * Create a split-payment request.
   * @param {{ title: string, amount: number, participants: string[] }} params
   */
  createSplit: (params) => api.post(endpoints.SPLITS, params),

  /** Get all splits the authenticated user has created or been added to. */
  getMySplits: () => api.get(endpoints.SPLITS),

  /** Get the details + participant statuses of a specific split. */
  getSplitDetails: (id) =>
    api.get(endpoints.SPLIT_DETAILS.replace(':id', id)),

  /** Pay the authenticated user's share of a split. */
  paySplit: (id, pin) =>
    api.post(endpoints.SPLIT_PAY.replace(':id', id), { pin }),
};
