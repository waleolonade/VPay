const twilio = require('twilio');
const logger = require('../utils/logger');

let _client = null;
const getClient = () => {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !sid.startsWith('AC')) {
      throw new Error('TWILIO_ACCOUNT_SID is missing or invalid (must start with AC)');
    }
    _client = twilio(sid, token);
  }
  return _client;
};

const sendSMS = async (to, message) => {
  try {
    const result = await getClient().messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    logger.info(`SMS sent to ${to} - SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    logger.error(`SMS failed to ${to}: ${error.message}`);
    throw new Error('Failed to send SMS');
  }
};

const sendOTPSMS = async (phone, otp) => {
  const message = `Your VPay verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phone, message);
};

module.exports = { sendSMS, sendOTPSMS };
