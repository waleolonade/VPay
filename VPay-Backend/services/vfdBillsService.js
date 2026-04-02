const axios = require('axios');
const { getAuthHeaders } = require('./vfdAuthService');
const logger = require('../utils/logger');

const getBaseUrl = () =>
  process.env.NODE_ENV === 'production'
    ? 'https://api-apps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore'
    : 'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';

const getWalletName = () => process.env.VFD_WALLET_NAME || 'vpay';

const buildClient = async (forceRefresh = false) => {
  const headers = await getAuthHeaders(forceRefresh);
  return axios.create({ baseURL: getBaseUrl(), headers, timeout: 30_000 });
};

/**
 * Execute a VFD API call. On 403 (stale token), force-refresh and retry once.
 */
const vfdCall = async (fn) => {
  try {
    const client = await buildClient(false);
    return await fn(client);
  } catch (error) {
    if (error.response?.status === 403) {
      logger.warn('VFD returned 403 — refreshing token and retrying once...');
      const fresh = await buildClient(true);
      return await fn(fresh);
    }
    throw error;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// BILLER CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all biller categories
 * GET /billercategory
 * Returns: ["Airtime", "Cable TV", "Data", "Internet Subscription", "Utility", ...]
 */
const getBillerCategories = async () => {
  return vfdCall(async (client) => {
    const { data } = await client.get('/billercategory');
    logger.debug(`VFD billercategory response: status=${data.status}`);
    if (data.status !== '00') throw new Error(`Biller categories API error: ${data.message}`);
    logger.info('Biller categories fetched successfully');
    return data.data;
  });
};

/**
 * Get biller list for a category (or all billers if no category given)
 * GET /billerlist[?categoryName=]
 */
const getBillerList = async (categoryName = null) => {
  return vfdCall(async (client) => {
    const url = categoryName ? `/billerlist?categoryName=${encodeURIComponent(categoryName)}` : '/billerlist';
    const { data } = await client.get(url);
    if (data.status !== '00') throw new Error(`Get biller list failed: ${data.message}`);
    return data.data;
  });
};

/**
 * Get payment items (plans/options) for a specific biller
 * GET /billerItems?billerId=&divisionId=&productId=
 */
const getBillerItems = async (billerId, divisionId, productId) => {
  return vfdCall(async (client) => {
    // Sanitize parameters to avoid 'undefined' strings in URL
    const dId = divisionId && divisionId !== 'undefined' ? divisionId : 'C';
    const pId = productId && productId !== 'undefined' ? productId : billerId;

    const { data } = await client.get(
      `/billerItems?billerId=${billerId}&divisionId=${dId}&productId=${pId}`
    );
    if (data.status !== '00') throw new Error(`Get biller items failed: ${data.message}`);
    return data.data.paymentitems;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a customer ID (meter number, decoder number, etc.) before payment
 * GET /customervalidate?divisionId=&paymentItem=&customerId=&billerId=
 *
 * NOTE: Optional for Airtime/Data, MANDATORY for Utility, Cable TV, Betting
 */
const validateCustomer = async ({ billerId, divisionId, paymentItem, customerId }) => {
  return vfdCall(async (client) => {
    const { data } = await client.get('/customervalidate', {
      params: { billerId, divisionId, paymentItem, customerId },
    });
    return { success: data.status === '00', message: data.message };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pay a bill
 * POST /pay
 *
 * @param {Object} params
 * @param {string} params.customerId   - Phone number, meter number, smart card number, etc.
 * @param {string} params.amount       - Exact amount in Naira
 * @param {string} params.division     - From biller list (division field)
 * @param {string} params.paymentItem  - paymentCode from biller items
 * @param {string} params.productId    - From biller list
 * @param {string} params.billerId     - From biller list (id field)
 * @param {string} params.reference    - Unique reference (wallet-name prefixed)
 * @param {string} [params.phoneNumber]- Customer phone number (required for some billers)
 */
const payBill = async ({ customerId, amount, division, paymentItem, productId, billerId, reference, phoneNumber }) => {
  const walletName = getWalletName();
  const ref = reference.startsWith(walletName) ? reference : `${walletName}-${reference}`;

  return vfdCall(async (client) => {
    const payload = {
      customerId,
      amount: String(amount),
      division,
      paymentItem,
      productId: String(productId),
      billerId,
      reference: ref,
    };
    if (phoneNumber) payload.phoneNumber = phoneNumber;

    const { data } = await client.post('/pay', payload);

    if (data.status === '99') throw new Error(data.message || 'Bill payment failed');
    return { success: data.status === '00', status: data.status, reference: data.data?.reference, message: data.message };
  });
};

/**
 * Check the status of a bill payment transaction
 * GET /transactionStatus?transactionId=
 */
const getBillTransactionStatus = async (transactionId) => {
  return vfdCall(async (client) => {
    const { data } = await client.get(`/transactionStatus?transactionId=${transactionId}`);
    if (data.status === '108') throw new Error('Transaction not found');
    return data.data; // { transactionStatus, amount, token }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper: purchase airtime for a given network (MTN, Airtel, Glo, 9mobile)
 * Resolves the correct biller from the Airtime category automatically.
 *
 * @param {Object} params
 * @param {string} params.network    - e.g. 'MTN', 'AIRTEL', 'GLO', '9MOBILE'
 * @param {string} params.phone      - Recipient phone number
 * @param {number} params.amount     - Amount in Naira
 * @param {string} params.reference  - Unique transaction reference
 */
const buyAirtime = async ({ network, phone, amount, reference }) => {
  const billers = await getBillerList('Airtime');
  const biller = billers.find(
    (b) => b.name.toUpperCase() === network.toUpperCase() || b.id.toLowerCase().includes(network.toLowerCase().slice(0, 3))
  );
  if (!biller) throw new Error(`Airtime biller not found for network: ${network}`);

  const items = await getBillerItems(biller.id, biller.division, biller.product);
  const item = items[0]; // Airtime typically has one item
  if (!item) throw new Error('No payment item found for airtime biller');

  return payBill({
    customerId: phone,
    amount: String(amount),
    division: biller.division,
    paymentItem: item.paymentCode,
    productId: biller.product,
    billerId: biller.id,
    reference,
    phoneNumber: phone,
  });
};

/**
 * Helper: get data plans for a given network
 * @param {string} network - e.g. 'MTN', 'AIRTEL', 'GLO', '9MOBILE'
 */
const getDataPlans = async (network) => {
  const billers = await getBillerList('Data');
  const biller = billers.find(
    (b) => b.name.toUpperCase() === network.toUpperCase() || b.id.toLowerCase().includes(network.toLowerCase().slice(0, 3))
  );
  if (!biller) throw new Error(`Data biller not found for network: ${network}`);
  return getBillerItems(biller.id, biller.division, biller.product);
};

/**
 * Helper: purchase data bundle
 * @param {Object} params
 * @param {string} params.network     - e.g. 'MTN', 'AIRTEL', 'GLO', '9MOBILE'
 * @param {string} params.phone       - Recipient phone number
 * @param {string} params.paymentCode - From getBillerItems (item.paymentCode)
 * @param {number} params.amount      - Amount in Naira
 * @param {string} params.reference   - Unique transaction reference
 */
const buyData = async ({ network, phone, paymentCode, amount, reference }) => {
  const billers = await getBillerList('Data');
  const biller = billers.find(
    (b) => b.name.toUpperCase() === network.toUpperCase() || b.id.toLowerCase().includes(network.toLowerCase().slice(0, 3))
  );
  if (!biller) throw new Error(`Data biller not found for network: ${network}`);

  return payBill({
    customerId: phone,
    amount: String(amount),
    division: biller.division,
    paymentItem: paymentCode,
    productId: biller.product,
    billerId: biller.id,
    reference,
    phoneNumber: phone,
  });
};

module.exports = {
  getBillerCategories,
  getBillerList,
  getBillerItems,
  validateCustomer,
  payBill,
  getBillTransactionStatus,
  // Convenience helpers
  buyAirtime,
  getDataPlans,
  buyData,
};
