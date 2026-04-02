const cron = require('node-cron');
const Savings = require('../models/Savings');
const { pool } = require('../config/database');
const { calculateSimpleInterest } = require('../utils/calculateInterest');
const logger = require('../utils/logger');

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  logger.info('Running interest calculator job...');
  try {
    // Mark matured investments
    const now = new Date();
    const [maturedResult] = await pool.query(
      "UPDATE investments SET status = 'matured', matured_at = ? WHERE status = 'active' AND maturity_date <= ?",
      [now, now]
    );
    logger.info(`Marked ${maturedResult.affectedRows} investments as matured`);

    // Accrue daily savings interest (simplified)
    const [savingsRows] = await pool.query(
      "SELECT * FROM savings WHERE status = 'active' AND current_balance > 0"
    );
    const activeSavings = savingsRows.map((r) => Savings._map(r));
    for (const savings of activeSavings) {
      const dailyInterest = calculateSimpleInterest(savings.currentBalance, savings.interestRate, 1);
      savings.interestEarned = (savings.interestEarned || 0) + dailyInterest;
      await savings.save();
    }
    logger.info(`Accrued interest for ${activeSavings.length} savings plans`);
  } catch (error) {
    logger.error(`Interest calculator job failed: ${error.message}`);
  }
});
