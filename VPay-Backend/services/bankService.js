const { getBankList, getTransferRecipient } = require('./vfdWalletService');
const logger = require('../utils/logger');

/**
 * Get list of Nigerian banks from VFD BaaS
 */
const getBanks = async () => {
  return getBankList();
};

/**
 * Verify an account number via VFD BaaS API
 * @param {string} accountNumber - 10-digit account number
 * @param {string} bankCode - 6-digit bank code (e.g., '000014' for GTBank)
 * @param {string} [transferType='inter'] - 'intra' for VFD-to-VFD, 'inter' for other banks
 * @returns {Promise<Object>} Account verification result with account holder name and details
 */
const verifyAccountNumber = async (accountNumber, bankCode, transferType = 'inter') => {
  try {
    if (!accountNumber || !bankCode) {
      throw new Error('Account number and bank code are required');
    }
    
    // Validate account number format (should be 10 digits)
    if (!/^\d{10}$/.test(accountNumber)) {
      throw new Error(`Invalid account number format. Expected 10 digits, got: ${accountNumber}`);
    }
    
    // Validate bank code format (should be 6 digits)
    if (!/^\d{6}$/.test(bankCode)) {
      throw new Error(`Invalid bank code format. Expected 6 digits, got: ${bankCode}`);
    }
    
    logger.info(`[BankService] Verifying account: ${accountNumber} @ bank ${bankCode} (${transferType})`);
    
    const result = await getTransferRecipient(accountNumber, bankCode, transferType);
    
    if (!result || !result.name) {
      logger.warn(`[BankService] Verification returned empty account name for ${accountNumber}@${bankCode}`);
      throw new Error('Account name not found in verification response');
    }
    
    logger.info(`[BankService] ✓ Account verified: ${result.name}`);
    
    return {
      success: true,
      accountName: result.name,
      accountNumber: result.account?.number || accountNumber,
      clientId: result.clientId || '',
      bvn: result.bvn || '',
      bank: result.bank || { code: bankCode },
      savingsId: result.account?.id || '',
    };
  } catch (error) {
    logger.error(`[BankService] Verification failed for ${accountNumber}@${bankCode}: ${error.message}`);
    
    // Provide user-friendly error messages
    if (error.message.includes('Invalid') || error.message.includes('format')) {
      throw new Error(error.message);
    }
    
    if (error.message.includes('not found')) {
      throw new Error(`Account ${accountNumber} not found at bank ${bankCode}. Please verify the details.`);
    }

    // Check if it's a network/API error
    if (error.response?.status === 404) {
      throw new Error(`Account ${accountNumber} not found at bank ${bankCode}. Please verify the account number and bank code.`);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authorization failed. Unable to verify account at this time.');
    }

    throw new Error(error.message || 'Could not verify account number. Please try again later.');
  }
};

module.exports = { getBanks, verifyAccountNumber };
