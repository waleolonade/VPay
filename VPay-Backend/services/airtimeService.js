const { buyAirtime: vfdBuyAirtime, getBillerList } = require('./vfdBillsService');
const logger = require('../utils/logger');

/**
 * Purchase airtime via VFD BaaS Bills Payment API
 */
const buyAirtime = async ({ phone, network, amount, reference }) => {
  try {
    const result = await vfdBuyAirtime({ network, phone, amount, reference });
    logger.info(`Airtime purchase via VFD: ${reference}`);
    return result;
  } catch (error) {
    logger.error(`Airtime purchase failed: ${error.message}`);
    throw error;
  }
};

/**
 * Get supported airtime networks from VFD Biller List
 */
const getAirtimeNetworks = async () => {
  try {
    const billers = await getBillerList('Airtime');
    return billers.map((b) => ({ id: b.id, name: b.name, division: b.division, product: b.product, convenienceFee: b.convenienceFee || 0 }));
  } catch (_) {
    return ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];
  }
};

module.exports = { buyAirtime, getAirtimeNetworks };
