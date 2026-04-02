const axios = require('axios');
const { getAuthHeaders } = require('./vfdAuthService');
const logger = require('../utils/logger');

const getBaseUrl = () =>
  process.env.NODE_ENV === 'production'
    ? 'https://api-apps.vfdbank.systems/vtech-cards/api/v2/baas-cards'
    : 'https://api-devapps.vfdbank.systems/vtech-cards/api/v2/baas-cards';

const getWalletName = () => process.env.VFD_WALLET_NAME || 'vpay';

const buildClient = async () => {
  const headers = await getAuthHeaders();
  return axios.create({ baseURL: getBaseUrl(), headers, timeout: 30_000 });
};

/**
 * Initiate a non-tokenized card payment
 * POST /initiate/payment
 *
 * @param {Object} params
 * @param {number}  params.amount         - Amount in Naira (minimum ₦1000)
 * @param {string}  params.reference      - Unique reference (wallet-name prefixed)
 * @param {string}  params.cardNumber
 * @param {string}  params.cardPin
 * @param {string}  params.cvv2
 * @param {string}  params.expiryDate     - Format: yymm (e.g. "5003")
 * @param {boolean} [params.shouldTokenize=false]
 *
 * @returns {Object} { success, code, narration, redirectHtml?, hasSavedCards }
 */
const initiateCardPayment = async ({
  amount,
  reference,
  cardNumber,
  cardPin,
  cvv2,
  expiryDate,
  shouldTokenize = false,
}) => {
  const walletName = getWalletName();
  const ref = reference.startsWith(walletName) ? reference : `${walletName}-${reference}`;

  const client = await buildClient();
  const { data } = await client.post('/initiate/payment', {
    amount: String(amount),
    reference: ref,
    useExistingCard: false,
    cardNumber,
    cardPin,
    cvv2,
    expiryDate,
    shouldTokenize,
  });

  if (!data.success) throw new Error(data.message || 'Card payment initiation failed');

  return {
    success: data.success,
    message: data.message,
    code: data.data?.code,
    narration: data.data?.narration,
    redirectHtml: data.data?.redirectHtml || null,
    requiresOtp: !data.data?.redirectHtml,
    hasSavedCards: data.data?.hasSavedCards,
  };
};

/**
 * Validate the OTP for a card payment that requires OTP authentication
 * POST /validate-otp
 *
 * @param {string} otp       - OTP received by cardholder
 * @param {string} reference - Same reference used in initiateCardPayment
 */
const validateCardOtp = async (otp, reference) => {
  const walletName = getWalletName();
  const ref = reference.startsWith(walletName) ? reference : `${walletName}-${reference}`;

  const client = await buildClient();
  const { data } = await client.post('/validate-otp', { otp, reference: ref });

  if (data.status !== '00') throw new Error(data.message || 'OTP validation failed');
  return { success: true, reference: data.data?.reference };
};

/**
 * Check payment status
 * GET /payment-details?reference=
 *
 * @param {string} reference - Transaction reference
 * @returns {{ transactionStatus, transactionMessage, amount, reference, transactionDescription }}
 */
const getCardPaymentStatus = async (reference) => {
  const walletName = getWalletName();
  const ref = reference.startsWith(walletName) ? reference : `${walletName}-${reference}`;

  const client = await buildClient();
  const { data } = await client.get(`/payment-details?reference=${encodeURIComponent(ref)}`);

  if (data.status !== '00') throw new Error(data.message || 'Payment status check failed');
  return data.data; // { transactionStatus, transactionMessage, amount, reference, transactionDescription }
};

/**
 * Request a new virtual card
 * POST /virtual-card
 *
 * @param {Object} params
 * @param {string} params.accountNumber - User's VFD account number
 * @param {string} params.cardBrand      - 'Verve' | 'MasterCard' | 'Visa'
 */
const requestVirtualCard = async ({ accountNumber, cardBrand = 'Verve' }) => {
  const client = await buildClient();
  const { data } = await client.post('/virtual-card', {
    accountNumber,
    cardBrand,
    currency: 'NGN',
  });

  if (data.status !== '00') throw new Error(data.message || 'Virtual card creation failed');
  return data.data; // { cardNumber, expiry, cvv, status, cardId }
};

/**
 * Request a physical debit card
 * POST /physical-card
 */
const requestPhysicalCard = async ({ accountNumber, cardBrand = 'Verve', deliveryAddress }) => {
  const client = await buildClient();
  const { data } = await client.post('/physical-card', {
    accountNumber,
    cardBrand,
    deliveryAddress,
  });

  if (data.status !== '00') throw new Error(data.message || 'Physical card request failed');
  return data.data;
};

/**
 * Toggle card status (Block/Unblock)
 * PATCH /status
 */
const toggleCardStatus = async (cardId, status) => {
  const client = await buildClient();
  const { data } = await client.patch('/status', { cardId, status });
  if (data.status !== '00') throw new Error(data.message || `Failed to ${status} card`);
  return data.data;
};

/**
 * Get card details (including PAN/CVV)
 * GET /details/:cardId
 */
const getCardDetails = async (cardId) => {
  const client = await buildClient();
  const { data } = await client.get(`/details/${cardId}`);
  if (data.status !== '00') throw new Error(data.message || 'Failed to fetch card details');
  return data.data;
};

module.exports = {
  initiateCardPayment,
  validateCardOtp,
  getCardPaymentStatus,
  requestVirtualCard,
  requestPhysicalCard,
  toggleCardStatus,
  getCardDetails,
};
