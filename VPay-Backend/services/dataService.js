const { getDataPlans: vfdGetDataPlans, buyData: vfdBuyData } = require('./vfdBillsService');
const logger = require('../utils/logger');

/**
 * Get data plans for a network via VFD BaaS
 * @param {string} network - e.g. 'MTN', 'AIRTEL', 'GLO', '9MOBILE'
 */
const getDataPlans = async (network) => {
  try {
    const plans = await vfdGetDataPlans(network);
    return plans.map((p) => ({
      id: p.paymentitemid,
      name: p.paymentitemname,
      paymentCode: p.paymentCode,
      amount: p.amount,
      isAmountFixed: p.isAmountFixed === 'true',
      billerType: p.billerType,
    }));
  } catch (error) {
    logger.error(`Get data plans failed: ${error.message}`);
    throw new Error('Could not fetch data plans');
  }
};

/**
 * Purchase a data bundle via VFD BaaS
 * @param {Object} params
 * @param {string} params.phone       - Recipient phone number
 * @param {string} params.network     - e.g. 'MTN', 'AIRTEL', 'GLO', '9MOBILE'
 * @param {string} params.paymentCode - From getDataPlans() item.paymentCode
 * @param {number} params.amount      - Amount in Naira
 * @param {string} params.reference   - Unique reference
 */
const buyData = async ({ phone, network, paymentCode, amount, reference }) => {
  try {
    const result = await vfdBuyData({ network, phone, paymentCode, amount, reference });
    logger.info(`Data purchase via VFD: ${reference}`);
    return result;
  } catch (error) {
    logger.error(`Data purchase failed: ${error.message}`);
    throw error;
  }
};

module.exports = { getDataPlans, buyData };
