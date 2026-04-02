const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { pool } = require('../config/database');
const { sendSMS } = require('../services/smsService');
const logger = require('../utils/logger');

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  logger.info('Running loan repayment reminder job...');
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const [loanRows] = await pool.query(
      "SELECT l.*, u.first_name, u.phone, u.email FROM loans l JOIN users u ON l.user_id = u.id WHERE l.status = 'active' AND l.due_date >= ? AND l.due_date <= ?",
      [now, threeDaysFromNow]
    );

    for (const row of loanRows) {
      const message = `Dear ${row.first_name}, your loan repayment of ₦${Number(row.outstanding_balance).toLocaleString()} is due on ${new Date(row.due_date).toDateString()}. Please ensure sufficient wallet balance.`;

      await Notification.create({
        user: row.user_id,
        title: 'Loan Repayment Reminder',
        body: message,
        type: 'loan',
      });

      await sendSMS(row.phone, message).catch(() => {});
    }

    logger.info(`Sent ${loanRows.length} loan reminders`);
  } catch (error) {
    logger.error(`Loan reminder job failed: ${error.message}`);
  }
});
