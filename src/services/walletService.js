import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const walletService = {
  /** Fetch the wallet object (balance + account details). */
  getWallet: () => api.get(endpoints.GET_WALLETS),
  getWallets: () => api.get(endpoints.GET_WALLETS),

  /** Fetch detailed wallet aggregates (available, ledger, bonus, accounts). */
  getWalletDetails: () => api.get(endpoints.WALLET_DETAILS),

  /** Request VFD statement */
  getStatement: (startDate, endDate) => api.get(endpoints.WALLET_STATEMENT, { params: { startDate, endDate } }),

  /** Generate dynamic virtual account */
  generateVirtualAccount: (amount) => api.post(endpoints.WALLET_FUND_VIRTUAL, { amount }),

  /** Alias kept for backward compatibility. */
  getBalance: () => api.get(endpoints.GET_WALLETS),

  // ── Funding ──────────────────────────────────────────────────────────────

  /**
   * Initiate a bank-transfer funding request.
   * Returns a virtual account to pay into.
   * @param {{ amount: number }} params
   */
  initBankFunding: (amount, walletType = 'personal') =>
    api.post(endpoints.WALLET_FUND_BANK, { amount, walletType }),

  /**
   * Initiate a card-funding request.
   * @param {{ amount: number, cardNumber, expiryMonth, expiryYear, cvv, pin }} params
   */
  initCardFunding: (params) =>
    api.post(endpoints.WALLET_FUND_CARD, params),

  /**
   * Validate the OTP step of a card-funding transaction.
   * @param {{ reference: string, otp: string }} params
   */
  validateCardFundingOtp: (reference, otp) =>
    api.post(endpoints.WALLET_FUND_CARD_OTP, { reference, otp }),

  /**
   * Confirm / verify a completed card-funding transaction.
   * @param {string} reference
   */
  verifyCardFunding: (reference) =>
    api.post(endpoints.WALLET_FUND_CARD_VERIFY, { reference }),

  /** (Dev/staging only) Simulate an inward credit to the wallet. */
  simulateFunding: (amount, walletType = 'personal') =>
    api.post(endpoints.WALLET_FUND_SIMULATE, { amount, walletType }),

  /** Upgrade to business account / Update Business Profile */
  activateBusiness: (businessName, businessCategory, cacNumber, cacCertificate) =>
    api.put(endpoints.WALLET_BUSINESS_PROFILE, { businessName, businessCategory, cacNumber, cacCertificate }),
};
