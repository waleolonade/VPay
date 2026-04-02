const logger = require('../utils/logger');

/**
 * Handle VFD inward credit webhook events.
 * The actual wallet credit logic lives in paymentController.vfdCreditWebhook.
 * This service provides any shared processing helpers.
 */
const handleVfdCreditWebhook = async (payload) => {
  const { reference, amount, originator_account_name, originator_bank } = payload;
  logger.info(`VFD credit webhook: ref=${reference} amount=${amount} from=${originator_account_name} (${originator_bank})`);
  // Processing is delegated to paymentController.vfdCreditWebhook
};

module.exports = { handleVfdCreditWebhook };
