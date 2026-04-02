const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Lazy-load transporter to avoid crashes on missing credentials
let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Check if credentials are properly configured (not placeholder values)
    if (!smtpUser || !smtpPass || smtpUser.includes('your_') || smtpPass.includes('your_')) {
      logger.warn('Email service not configured. Using null transporter (emails will not be sent)');
      return null;
    }

    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
  return _transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();
    
    // If transporter is null, email service is not configured
    if (!transporter) {
      logger.warn(`Email service not configured. Skipping email to ${to}`);
      return { success: true, skipped: true, reason: 'Email service not configured' };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@vpay.com',
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to} - MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email failed to ${to}: ${error.message}`);
    // Don't throw - this allows the app to continue if email service is down
    return { success: false, error: error.message };
  }
};

const sendOTPEmail = async (email, otp, name = 'User') => {
  return sendEmail({
    to: email,
    subject: 'VPay - Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6200EE;">VPay Verification Code</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <h1 style="color: #6200EE; letter-spacing: 8px;">${otp}</h1>
        <p>This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br/>
        <p>The VPay Team</p>
      </div>
    `,
  });
};

const sendWelcomeEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to VPay!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6200EE;">Welcome to VPay, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Start exploring: send money, buy airtime, pay bills and more.</p>
        <p>The VPay Team</p>
      </div>
    `,
  });
};

const sendTransactionEmail = async (email, name, { type, amount, reference, description }) => {
  const action = type === 'credit' ? 'credited' : 'debited';
  return sendEmail({
    to: email,
    subject: `VPay Transaction - ${reference}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6200EE;">Transaction Notification</h2>
        <p>Hi ${name},</p>
        <p>Your account has been <strong>${action}</strong> with <strong>₦${amount.toLocaleString()}</strong>.</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p>If you did not authorize this transaction, contact support immediately.</p>
        <p>The VPay Team</p>
      </div>
    `,
  });
};

const sendLoginEmail = async (email, name, details) => {
  const { ip, userAgent, timestamp } = details;
  return sendEmail({
    to: email,
    subject: 'VPay - Security Alert: New Login',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6200EE;">Security Alert: New Login</h2>
        <p>Hi ${name || 'User'},</p>
        <p>Your VPay account was just logged into from a new session.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Time:</strong> ${timestamp || new Date().toLocaleString()}</p>
          <p><strong>IP Address:</strong> ${ip || 'Unknown'}</p>
          <p><strong>Device/Browser:</strong> ${userAgent || 'Unknown'}</p>
        </div>
        <p>If this was you, you can safely ignore this email.</p>
        <p><strong style="color: red;">If you did not authorize this login, please change your password immediately and contact support.</strong></p>
        <br/>
        <p>The VPay Team</p>
      </div>
    `,
  });
};

const sendGenericNotificationEmail = async (email, name, { title, body }) => {
  return sendEmail({
    to: email,
    subject: `VPay Notification - ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6200EE;">${title}</h2>
        <p>Hi ${name || 'User'},</p>
        <p>${body}</p>
        <br/>
        <p>The VPay Team</p>
      </div>
    `,
  });
};

module.exports = { 
  sendEmail, 
  sendOTPEmail, 
  sendWelcomeEmail, 
  sendTransactionEmail, 
  sendLoginEmail,
  sendGenericNotificationEmail
};
