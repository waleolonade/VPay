const axios = require('axios');
const crypto = require('crypto');
const { getAuthHeaders } = require('./vfdAuthService');
const logger = require('../utils/logger');

const getBaseUrl = () =>
  process.env.NODE_ENV === 'production'
    ? 'https://api-apps.vfdbank.systems/vtech-wallet/api/v2/wallet2'
    : 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2';

const getWalletName = () => process.env.VFD_WALLET_NAME || 'vpay';

/**
 * Build an axios client with fresh VFD auth headers
 */
const buildClient = async () => {
  const headers = await getAuthHeaders();
  return axios.create({ baseURL: getBaseUrl(), headers, timeout: 30_000 });
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFER SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get pool account details (or a specific sub-account if accountNumber provided)
 * GET /account/enquiry[?accountNumber=]
 */
const getAccountEnquiry = async (accountNumber = null) => {
  const client = await buildClient();
  const url = accountNumber
    ? `/account/enquiry?accountNumber=${accountNumber}`
    : '/account/enquiry';
  const { data } = await client.get(url);
  if (data.status !== '00') throw new Error(`Account enquiry failed: ${data.message}`);
  return data.data;
};

/**
 * Get list of all Nigerian banks
 * GET /bank
 */
const getBankList = async () => {
  const client = await buildClient();
  const { data } = await client.get('/bank');
  if (data.status !== '00') throw new Error(`Get bank list failed: ${data.message}`);
  return data.data;
};

/**
 * Resolve transfer recipient details
 * Tries multiple endpoint formats to be compatible with different VFD API versions
 * 
 * @param {string} accountNo - Recipient account number (10 digits)
 * @param {string} bankCode - Bank code (6 digits)
 * @param {string} transferType - 'intra' for VFD accounts, 'inter' for other banks
 * @returns {Promise<Object>} Recipient details including name, account info, etc.
 */
const getTransferRecipient = async (accountNo, bankCode, transferType = 'inter') => {
  const logger = require('../utils/logger');
  
  if (!accountNo || !bankCode) {
    throw new Error('Account number and bank code are required');
  }

  logger.info(`[VFD] getTransferRecipient: Resolving ${accountNo} @ bank ${bankCode} (${transferType})`);

  const client = await buildClient();
  
  const attempts = [
    {
      name: 'GET /transfer/recipient (snake_case)',
      method: 'get',
      url: `/transfer/recipient?accountNo=${accountNo}&bank=${bankCode}&transfer_type=${transferType}`,
    },
    {
      name: 'GET /transfer/recipient (camelCase)',
      method: 'get',
      url: `/transfer/recipient?accountNumber=${accountNo}&bankCode=${bankCode}&transferType=${transferType}`,
    },
    {
      name: 'POST /transfer/recipient (snake_case)',
      method: 'post',
      url: '/transfer/recipient',
      data: { accountNo, bank: bankCode, transfer_type: transferType },
    },
    {
      name: 'POST /transfer/resolve',
      method: 'post',
      url: '/transfer/resolve',
      data: { accountNo, bankCode, transferType },
    },
    {
      name: 'GET /beneficiary',
      method: 'get',
      url: `/beneficiary?accountNo=${accountNo}&bank=${bankCode}`,
    },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      logger.info(`[VFD] Attempting: ${attempt.name} → ${attempt.url}`);
      
      let response;
      if (attempt.method === 'get') {
        response = await client.get(attempt.url);
      } else {
        response = await client.post(attempt.url, attempt.data);
      }

      logger.info(`[VFD] Response status: ${response.status}, data.status: ${response.data?.status}`);

      // Check if response indicates success
      if (response.data?.status === '00') {
        const recipientData = response.data.data;
        logger.info(`[VFD] ✓ Resolution successful via ${attempt.name}`);
        logger.info(`[VFD] Recipient: ${recipientData?.name || recipientData?.accountName || 'N/A'}`);
        
        // Normalize response to expected format
        return normalizeRecipientResponse(recipientData);
      } else {
        const message = response.data?.message || 'Unknown error';
        logger.warn(`[VFD] ${attempt.name} returned status ${response.data?.status}: ${message}`);
        lastError = new Error(message);
      }
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      
      logger.warn(`[VFD] ${attempt.name} failed (${statusCode}): ${errorMsg}`);
      lastError = error;
      
      // Don't continue if we get a 401 (auth error) - that's terminal
      if (statusCode === 401) {
        logger.error('[VFD] Authentication failed - token may be invalid');
        throw new Error('VFD authentication failed. Please check credentials.');
      }
    }
  }

  // All attempts failed
  logger.error(`[VFD] All attempts to resolve account failed. Last error: ${lastError?.message}`);
  
  if (lastError?.response?.status === 404) {
    throw new Error(`Account ${accountNo} not found at bank ${bankCode}. Please verify the account number and bank code.`);
  }
  
  throw new Error(`Could not resolve account. ${lastError?.message || 'Please try again later.'}`);
};

/**
 * Normalize VFD recipient response to standard format
 * VFD API response structure may vary, so normalize to ensure consistency
 */
const normalizeRecipientResponse = (data) => {
  const logger = require('../utils/logger');
  
  logger.info(`[VFD] Normalizing response data structure...`);
  
  return {
    name: data.name || data.accountName || data.recipient_name || '',
    account: {
      number: data.account?.number || data.accountNumber || data.account_number || '',
      id: data.account?.id || data.accountId || data.account_id || '',
    },
    clientId: data.clientId || data.client_id || '',
    bvn: data.bvn || '',
    bank: data.bank || { code: '', name: '' },
  };
};

/**
 * Generate transfer signature: SHA512(fromAccount + toAccount)
 */
const generateTransferSignature = (fromAccount, toAccount) =>
  crypto.createHash('sha512').update(fromAccount + toAccount).digest('hex');

/**
 * Initiate a fund transfer (intra or inter-bank)
 * POST /transfer
 *
 * @param {Object} params
 * @param {string} params.toAccount    - Destination account number
 * @param {string} params.toBank       - Destination bank code
 * @param {string} params.toName       - Destination account holder name
 * @param {string} params.transferType - 'intra' | 'inter'
 * @param {number} params.amount       - Amount in Naira
 * @param {string} params.remark       - Narration
 * @param {string} params.reference    - Unique reference (prefixed with wallet name)
 */
const initiateTransfer = async ({
  toAccount,
  toBank,
  toName,
  transferType = 'inter',
  amount,
  remark,
  reference,
}) => {
  // Step 1: Get our pool account details
  const from = await getAccountEnquiry();

  // Step 2: Lookup beneficiary
  const recipient = await getTransferRecipient(toAccount, toBank, transferType);

  // Step 3: Build signature
  const signature = generateTransferSignature(from.accountNo, toAccount);

  // Step 4: Build payload
  const walletName = getWalletName();
  const ref = reference.startsWith(walletName) ? reference : `${walletName}-${reference}`;

  const payload = {
    fromAccount: from.accountNo,
    uniqueSenderAccountId: '',
    fromClientId: from.clientId,
    fromClient: `${walletName}-${from.client}`,
    fromSavingsId: from.accountId,
    fromBvn: from.bvn || '',
    toClientId: recipient.clientId || '',
    toClient: recipient.name || toName,
    toSavingsId: transferType === 'intra' ? recipient.account.id : '',
    toSession: transferType === 'inter' ? recipient.account.id : '',
    toBvn: recipient.bvn || '',
    toAccount,
    toBank,
    signature,
    amount: String(amount),
    remark,
    transferType,
    reference: ref,
  };

  const client = await buildClient();
  const { data } = await client.post('/transfer', payload);

  if (data.status !== '00' && data.status !== '01' && data.status !== '02') {
    throw new Error(data.message || 'Transfer failed');
  }
  return { ...data.data, vfdStatus: data.status };
};

/**
 * Query transaction status by reference (TSQ)
 * GET /transactions?reference=
 */
const getTransactionStatus = async (reference) => {
  const client = await buildClient();
  const { data } = await client.get(`/transactions?reference=${reference}`);
  if (data.status !== '00') throw new Error(`TSQ failed: ${data.message}`);
  return data.data;
};

/**
 * Query transaction reversal status (TRSQ)
 * GET /transactions/reversal?reference=
 */
const getReversalStatus = async (reference) => {
  const client = await buildClient();
  const { data } = await client.get(`/transactions/reversal?reference=${reference}`);
  return data.data;
};

/**
 * Get account transaction history
 * GET /account/transactions?accountNo=&startDate=&endDate=&transactionType=&page=&size=
 */
const getAccountTransactions = async ({
  accountNo,
  startDate,
  endDate,
  transactionType = 'wallet',
  page = 0,
  size = 20,
}) => {
  const client = await buildClient();
  const { data } = await client.get('/account/transactions', {
    params: { accountNo, startDate, endDate, transactionType, page, size },
  });
  if (data.status !== '00') throw new Error(`Get transactions failed: ${data.message}`);
  return data.data;
};

/**
 * Simulate inward credit (DEV/test environment only)
 * POST /credit
 */
const simulateCredit = async ({ amount, accountNo }) => {
  const client = await buildClient();
  const { data } = await client.post('/credit', {
    amount: String(amount),
    accountNo,
    senderAccountNo: '5050104070',
    senderBank: '000002',
    senderNarration: 'Wallet funding simulation',
  });
  if (data.status !== '00') throw new Error(`Simulate credit failed: ${data.message}`);
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT CREATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an individual VFD sub-account (tier 1 — BVN + DOB)
 * POST /client/tiers/individual?bvn=&dateOfBirth=
 */
const createIndividualAccount = async (bvn, dateOfBirth) => {
  const client = await buildClient();
  const { data } = await client.post(
    `/client/tiers/individual?bvn=${bvn}&dateOfBirth=${encodeURIComponent(dateOfBirth)}`
  );
  if (data.status !== '00' && data.status !== '01') {
    throw new Error(data.message || 'Account creation failed');
  }
  return data.data;
};

/**
 * Create individual account (no consent / BVN+DOB only — legacy method)
 * POST /client/create?bvn=&dateOfBirth=
 */
const createClientLegacy = async (bvn, dateOfBirth) => {
  const client = await buildClient();
  const { data } = await client.post(
    `/client/create?bvn=${bvn}&dateOfBirth=${encodeURIComponent(dateOfBirth)}`
  );
  if (data.status !== '00' && data.status !== '01') {
    throw new Error(data.message || 'Client creation failed');
  }
  return data.data;
};

/**
 * Create a one-time virtual account for payment collection
 * POST /virtualaccount
 */
const createVirtualAccount = async ({ amount, merchantName, merchantId, reference, validityTime = '4320' }) => {
  const walletName = getWalletName();
  const ref = reference.startsWith(walletName) ? reference : `${walletName}-${reference}`;
  const client = await buildClient();
  const { data } = await client.post('/virtualaccount', {
    amount: String(amount),
    merchantName,
    merchantId,
    reference: ref,
    validityTime,
    amountValidation: 'A5', // any amount
  });
  if (data.status !== '00') throw new Error(data.message || 'Virtual account creation failed');
  return { accountNumber: data.accountNumber, reference: data.reference };
};

// ─────────────────────────────────────────────────────────────────────────────
// KYC / ACCOUNT ENQUIRY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get client info by BVN
 * GET /client?bvn=
 */
const getClientByBvn = async (bvn) => {
  const client = await buildClient();
  const { data } = await client.get(`/client?bvn=${bvn}`);
  if (data.status !== '00') throw new Error(data.message || 'BVN lookup failed');
  return data.data;
};

/**
 * Get all sub-accounts
 * GET /sub-accounts?entity=&size=&page=
 */
const getSubAccounts = async ({ entity = 'individual', size = 20, page = 0 }) => {
  const client = await buildClient();
  const { data } = await client.get(`/sub-accounts?entity=${entity}&size=${size}&page=${page}`);
  if (data.status !== '00') throw new Error(data.message || 'Fetch sub-accounts failed');
  return data.data;
};

module.exports = {
  getAccountEnquiry,
  getBankList,
  getTransferRecipient,
  generateTransferSignature,
  initiateTransfer,
  getTransactionStatus,
  getReversalStatus,
  getAccountTransactions,
  simulateCredit,
  createIndividualAccount,
  createClientLegacy,
  createVirtualAccount,
  getClientByBvn,
  getSubAccounts,
};
