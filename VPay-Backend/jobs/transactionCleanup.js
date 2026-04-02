const cron = require('node-cron');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// Run every Sunday at 2 AM - clean up old failed/pending transactions
cron.schedule('0 2 * * 0', async () => {
  logger.info('Running transaction cleanup job...');
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Mark very old pending transactions as failed
    const [result] = await pool.query(
      "UPDATE transactions SET status = 'failed', failure_reason = 'Transaction expired after 60 days' WHERE status = 'pending' AND created_at < ?",
      [sixtyDaysAgo]
    );

    logger.info(`Cleaned up ${result.affectedRows} stale transactions`);
  } catch (error) {
    logger.error(`Transaction cleanup job failed: ${error.message}`);
  }
});
