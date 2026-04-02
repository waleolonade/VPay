const vfdBillsService = require('./vfdBillsService');
const logger = require('../utils/logger');

/**
 * Validate a bill customer ID before payment.
 * Mandatory for Utility, Cable TV, Betting. Optional for Airtime/Data.
 */
const verifyBill = async (billerId, customerNumber, { divisionId, paymentItem } = {}) => {
  try {
    const result = await vfdBillsService.validateCustomer({
      billerId,
      customerId: customerNumber,
      divisionId: divisionId || 'C',
      paymentItem: paymentItem || billerId,
    });
    logger.info(`Bill verification for ${billerId}: ${result.message}`);
    return result;
  } catch (error) {
    logger.error(`Bill verification failed: ${error.message}`);
    throw error;
  }
};

/**
 * Pay a bill via VFD BaaS.
 * @param {Object} params
 * @param {string} params.billerId      - From biller list
 * @param {string} params.customerNumber- Customer ID (phone, meter number, etc.)
 * @param {string} params.division      - From biller list
 * @param {string} params.paymentItem   - paymentCode from biller items
 * @param {string} params.productId     - From biller list
 * @param {number} params.amount        - Amount in Naira
 * @param {string} params.reference     - Unique reference
 * @param {string} [params.phoneNumber] - Customer phone (some billers require this)
 */
const payBill = async ({ billerId, customerNumber, division, paymentItem, productId, amount, reference, phoneNumber }) => {
  try {
    const result = await vfdBillsService.payBill({
      customerId: customerNumber,
      amount,
      division,
      paymentItem,
      productId,
      billerId,
      reference,
      phoneNumber,
    });
    logger.info(`Bill payment via VFD: ${reference} - biller: ${billerId}`);
    return result;
  } catch (error) {
    logger.error(`Bill payment failed: ${error.message}`);
    throw error;
  }
};

/**
 * Get biller categories from VFD BaaS.
 */
const getBillerCategories = async () => {
  try {
    return await vfdBillsService.getBillerCategories();
  } catch (error) {
    logger.error(`Get biller categories failed: ${error.message}`);
    throw error;
  }
};

/**
 * Get biller list for a category.
 */
const getBillerList = async (categoryName) => vfdBillsService.getBillerList(categoryName);

/**
 * Get payment items/plans for a specific biller.
 */
const getBillerItems = async (billerId, divisionId, productId) =>
  vfdBillsService.getBillerItems(billerId, divisionId, productId);

/**
 * Check bill transaction status.
 */
const getBillStatus = async (transactionId) => vfdBillsService.getBillTransactionStatus(transactionId);

module.exports = { verifyBill, payBill, getBillerCategories, getBillerList, getBillerItems, getBillStatus };
