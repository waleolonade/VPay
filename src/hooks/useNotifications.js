/**
 * useNotifications.js
 *
 * - Fetches the initial unread notification count from the backend REST API.
 * - Opens a Socket.IO connection and listens for `new_notification` events
 *   to increment the badge count in real time.
 * - Returns { unreadCount, resetUnread }
 *   Call resetUnread() after the user opens the notification screen.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import socketService from '../services/socketService';

export default function useNotifications(accessToken) {
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  // Fetch current unread count from REST endpoint
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 1 });
      if (res.success && mountedRef.current) {
        setUnreadCount(res.unreadCount ?? 0);
      }
    } catch {
      // non-critical, silently ignore
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!accessToken) return;

    // 1. Seed badge with current count
    fetchNotifications();

    // 2. Open real-time socket connection
    const socket = socketService.connect(accessToken);

    // 3. Each new notification bumps the badge by 1 immediately
    const onNew = () => {
      if (mountedRef.current) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('new_notification', onNew);

    return () => {
      mountedRef.current = false;
      socket.off('new_notification', onNew);
    };
  }, [accessToken, fetchNotifications]);

  /** Call this when the user opens the notifications screen */
  const resetUnread = useCallback(() => setUnreadCount(0), []);

  return { unreadCount, resetUnread, fetchNotifications };
}
