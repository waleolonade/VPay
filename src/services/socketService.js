/**
 * socketService.js  (frontend)
 *
 * Manages a single Socket.IO-client connection for the lifetime of the
 * authenticated session.  Call connect(token) after login and
 * disconnect() on logout.
 */

import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants/apiEndpoints';

let socket = null;

const socketService = {
  /**
   * Open (or reuse) a socket connection authenticated with the JWT.
   * @param {string} token  The user's access token
   * @returns {Socket}
   */
  connect(token) {
    if (socket?.connected) return socket;

    socket = io(API_BASE_URL, {
      auth: { token },
      // Allow polling for handshake/fallback, but still prefer websocket
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      timeout: 10000,
    });

    socket.on('connect_error', (err) => {
      // Silently ignore auth errors or base connection polling issues
      if (err?.message === 'xhr poll error' || err?.type === 'TransportError') return;
      // console.warn('[Socket] Connection error:', err.message);
    });

    return socket;
  },

  /** Close the socket (call on logout). */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  /** Returns the active socket or null. */
  getSocket() {
    return socket;
  },
};

export default socketService;
