import api from './api';
import { endpoints } from '../constants/apiEndpoints';

/**
 * QR Payment Service
 *
 * Wraps the three QR-specific backend endpoints:
 *   GET  /api/v1/qr/token        – fetch current user's QR token (phone, name, accountNumber, …)
 *   POST /api/v1/qr/pay-vpay     – pay another VPay user via QR
 *   POST /api/v1/qr/pay-bill     – pay a bill via QR
 *
 * All transactions are tagged channel='qr' in the backend DB.
 */
export const qrPaymentService = {
  /**
   * Returns { phone, name, accountNumber, walletId, issuedAt }
   * Used by QRGeneratorScreen to embed live account data in the QR payload.
   */
  getMyQRToken: () => api.get(endpoints.QR_TOKEN),

  /**
   * Pay another VPay user whose QR has been scanned.
   * @param {object} payload
   * @param {string} payload.phone           – recipient's phone number
   * @param {number} payload.amount          – amount in naira
   * @param {string} [payload.note]          – optional narration
   * @param {string} payload.pin             – sender's 4-digit transaction PIN
   * @param {string} [payload.qrRaw]         – raw JSON string of the scanned QR (for audit)
   */
  qrPayVPay: ({ phone, amount, note, pin, qrRaw }) =>
    api.post(endpoints.QR_PAY_VPAY, { phone, amount, note, pin, qrRaw }),

  /**
   * Pay a bill whose QR code has been scanned.
   * @param {object} payload
   * @param {string} payload.billerId
   * @param {string} payload.billerName
   * @param {string} payload.billType
   * @param {string} payload.customerNumber
   * @param {string} payload.division
   * @param {string} payload.paymentItem
   * @param {string} payload.productId
   * @param {number} payload.amount
   * @param {string} payload.pin
   * @param {string} [payload.phoneNumber]
   * @param {string} [payload.qrRaw]
   */
  qrPayBill: (payload) => api.post(endpoints.QR_PAY_BILL, payload),
};
