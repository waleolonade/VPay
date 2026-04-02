const admin = require('firebase-admin');
const logger = require('../utils/logger');

let initialized = false;

const initFirebase = () => {
  if (initialized) return;
  try {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    logger.info('Firebase Admin initialized');
  } catch (error) {
    logger.warn(`Firebase init skipped: ${error.message}`);
  }
};

const sendPushNotification = async (deviceToken, { title, body, data = {} }) => {
  initFirebase();
  if (!initialized) return { success: false, message: 'Firebase not configured' };

  try {
    const response = await admin.messaging().send({
      token: deviceToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    logger.info(`Push notification sent: ${response}`);
    return { success: true, response };
  } catch (error) {
    logger.error(`Push notification failed: ${error.message}`);
    return { success: false, message: error.message };
  }
};

const sendMulticastNotification = async (deviceTokens, { title, body, data = {} }) => {
  initFirebase();
  if (!initialized || !deviceTokens.length) return { success: false };

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: deviceTokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    logger.info(`Multicast push: ${response.successCount} success, ${response.failureCount} failed`);
    return { success: true, response };
  } catch (error) {
    logger.error(`Multicast push failed: ${error.message}`);
    return { success: false, message: error.message };
  }
};

module.exports = { sendPushNotification, sendMulticastNotification };
