const cron = require('node-cron');
const { pool } = require('../config/database');
const { sendMulticastNotification } = require('../services/pushNotificationService');
const logger = require('../utils/logger');

// Run every hour - send queued push notifications
cron.schedule('0 * * * *', async () => {
  logger.info('Running notification sender job...');
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [rows] = await pool.query(
      `SELECT n.*, GROUP_CONCAT(dt.token) AS device_tokens
       FROM notifications n
       JOIN user_device_tokens dt ON n.user_id = dt.user_id
       WHERE n.channel = 'push' AND n.is_read = 0 AND n.created_at >= ?
       GROUP BY n.id`,
      [oneHourAgo]
    );

    for (const row of rows) {
      const tokens = row.device_tokens ? row.device_tokens.split(',') : [];
      if (tokens.length > 0) {
        await sendMulticastNotification(tokens, {
          title: row.title,
          body: row.body,
          data: row.data ? JSON.parse(row.data) : {},
        });
      }
    }

    logger.info(`Processed ${rows.length} push notifications`);
  } catch (error) {
    logger.error(`Notification sender job failed: ${error.message}`);
  }
});
