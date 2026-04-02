/**
 * Notification Service
 * Handles notification delivery via multiple channels (email, SMS, push, in-app)
 */

const logger = require('../utils/logger');
const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Send notification via email
   */
  static async sendViaEmail(userId, email, subject, message, htmlContent = null) {
    try {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc)
      logger.info(`[NOTIFICATION] Email queued for ${email}: ${subject}`);
      
      // Simulated email sending
      return {
        channel: 'email',
        status: 'queued',
        recipient: email,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`[NOTIFICATION] Error sending email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification via SMS
   */
  static async sendViaSMS(userId, phone, message) {
    try {
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc)
      logger.info(`[NOTIFICATION] SMS queued for ${phone}: ${message.substring(0, 50)}`);

      // Simulated SMS sending
      return {
        channel: 'sms',
        status: 'queued',
        recipient: phone,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`[NOTIFICATION] Error sending SMS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  static async sendPushNotification(userId, title, message, data = {}) {
    try {
      // TODO: Integrate with push service (Firebase Cloud Messaging, APN, etc)
      logger.info(`[NOTIFICATION] Push notification queued for user ${userId}`);

      // Simulated push notification
      return {
        channel: 'push',
        status: 'queued',
        userId,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`[NOTIFICATION] Error sending push notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send in-app notification
   */
  static async sendInAppNotification(userId, title, message, data = {}) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        channel: 'in-app',
        title,
        body: message,
        data,
        type: 'system'
      });

      logger.info(`[NOTIFICATION] In-app notification sent to user ${userId}`);

      return {
        channel: 'in_app',
        status: 'sent',
        notificationId: notification.id,
        userId,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`[NOTIFICATION] Error sending in-app notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send multi-channel notification
   */
  static async sendMultiChannel(userId, options) {
    try {
      const {
        email,
        phone,
        title,
        message,
        htmlContent,
        data = {},
        channels = ['in_app']
      } = options;

      const results = {};

      if (channels.includes('email') && email) {
        results.email = await this.sendViaEmail(userId, email, title, message, htmlContent);
      }

      if (channels.includes('sms') && phone) {
        results.sms = await this.sendViaSMS(userId, phone, message);
      }

      if (channels.includes('push')) {
        results.push = await this.sendPushNotification(userId, title, message, data);
      }

      if (channels.includes('in_app')) {
        results.inApp = await this.sendInAppNotification(userId, title, message, data);
      }

      logger.info(`[NOTIFICATION] Multi-channel notification sent to user ${userId}`);

      return {
        status: 'sent',
        channels: results,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`[NOTIFICATION] Error sending multi-channel notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Queue notification for later delivery
   */
  static async queueNotification(userId, options) {
    try {
      const {
        email,
        phone,
        title,
        message,
        htmlContent,
        data = {},
        channels = ['in_app'],
        scheduledTime = null
      } = options;

      // Store in queue table for scheduled delivery
      // TODO: Implement queue storage
      
      logger.info(`[NOTIFICATION] Notification queued for user ${userId}: ${title}`);

      return {
        status: 'queued',
        scheduledTime: scheduledTime || new Date(),
        channels
      };
    } catch (error) {
      logger.error(`[NOTIFICATION] Error queuing notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send admin alert notification
   */
  static async sendAdminAlert(title, message, severityLevel = 'info', recipients = []) {
    try {
      const adminAlertData = {
        severity: severityLevel,
        source: 'system',
        timestamp: new Date()
      };

      const results = await Promise.all(
        recipients.map(adminId =>
          this.sendInAppNotification(adminId, title, message, adminAlertData)
        )
      );

      logger.warn(`[NOTIFICATION] Admin alert sent to ${recipients.length} admins: ${title}`);

      return {
        status: 'sent',
        recipientCount: recipients.length,
        results
      };
    } catch (error) {
      logger.error(`[NOTIFICATION] Error sending admin alert: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send transaction notification
   */
  static async sendTransactionNotification(userId, transaction) {
    try {
      const title = `${transaction.type} Transaction`;
      const message = `${transaction.type} of ${transaction.amount} ${transaction.currency} ${transaction.status === 'success' ? 'completed' : 'failed'}`;

      return this.sendInAppNotification(userId, title, message, {
        transactionId: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status
      });
    } catch (error) {
      logger.error(`[NOTIFICATION] Error sending transaction notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send security alert notification
   */
  static async sendSecurityAlert(userId, alert) {
    try {
      const title = 'Security Alert';
      const message = alert.message;

      return this.sendInAppNotification(userId, title, message, {
        alertType: alert.type,
        severity: alert.severity,
        ipAddress: alert.ipAddress,
        timestamp: alert.timestamp
      });
    } catch (error) {
      logger.error(`[NOTIFICATION] Error sending security alert: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get notification templates
   */
  static getTemplates() {
    return {
      transaction: {
        title: '{{type}} Transaction {{status}}',
        message: '{{type}} of {{amount}} {{currency}} was {{status}}',
        variables: ['type', 'status', 'amount', 'currency']
      },
      login_alert: {
        title: 'New Login Detected',
        message: 'Your account was accessed from {{device}} at {{time}}',
        variables: ['device', 'time', 'location']
      },
      security_alert: {
        title: 'Security Alert',
        message: '{{message}}',
        variables: ['message', 'severity', 'action']
      },
      system_broadcast: {
        title: '{{title}}',
        message: '{{message}}',
        variables: ['title', 'message']
      }
    };
  }

  /**
   * Render template with variables
   */
  static renderTemplate(templateName, variables) {
    const templates = this.getTemplates();
    const template = templates[templateName];

    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let title = template.title;
    let message = template.message;

    Object.entries(variables).forEach(([key, value]) => {
      title = title.replace(`{{${key}}}`, value);
      message = message.replace(`{{${key}}}`, value);
    });

    return { title, message };
  }
}

module.exports = NotificationService;
