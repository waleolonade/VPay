import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const notificationService = {
  /**
   * Fetch the authenticated user's notification inbox.
   * @param {{ page?: number, limit?: number }} params
   */
  getNotifications: (params = {}) =>
    api.get(endpoints.NOTIFICATIONS, { params: { page: 1, limit: 20, ...params } }),

  /**
   * Mark a single notification as read.
   * @param {string} id  Notification ID
   */
  markAsRead: (id) =>
    api.patch(endpoints.NOTIFICATION_READ.replace(':id', id)),

  /** Mark every unread notification as read. */
  markAllAsRead: () => api.patch(endpoints.NOTIFICATIONS_READ_ALL),

  /**
   * Delete a notification.
   * @param {string} id  Notification ID
   */
  deleteNotification: (id) =>
    api.delete(endpoints.NOTIFICATION.replace(':id', id)),

  /**
   * Register or refresh the device push token on the server so the backend
   * can deliver push notifications to this device.
   * Call this once per app launch after the user is authenticated.
   * @param {string} token  Expo / FCM / APNs push token
   * @param {'expo'|'fcm'|'apns'} [type='expo']
   */
  registerPushToken: (token, type = 'expo') =>
    api.post(endpoints.NOTIFICATION_TOKEN, { token, type }),
};
