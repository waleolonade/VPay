const { initiateTransfer: vfdTransfer, getBankList, getTransferRecipient } = require('./vfdWalletService');
const logger = require('../utils/logger');

/**
 * Initiate bank transfer via VFD BaaS
 * Wraps vfdWalletService.initiateTransfer with a compatible interface
 */
const initiateTransfer = async ({ toAccount, toBank, toName, transferType, amount, remark, reference }) => {
  return vfdTransfer({ toAccount, toBank, toName, transferType, amount, remark, reference });
};

/**
 * Get list of banks via VFD BaaS
 */
const listBanks = async () => getBankList();

/**
 * Resolve / verify an account number via VFD BaaS
 * @param {string} account_number
 * @param {string} bank_code
 * @param {string} [transferType='inter']
 */
const resolveAccountNumber = async (account_number, bank_code, transferType = 'inter') => {
  const result = await getTransferRecipient(account_number, bank_code, transferType);
  return { account_name: result.name, account_number: result.account.number };
};

module.exports = {
  initiateTransfer,
  resolveAccountNumber,
  listBanks,
};
