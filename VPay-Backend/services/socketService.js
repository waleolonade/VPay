/**
 * socketService.js
 * Thin wrapper around the Socket.IO instance.
 * Call `init(io)` once from server.js, then use
 * `emitToUser(userId, event, payload)` from anywhere in the backend.
 */

let _io = null;

const socketService = {
  /** Called once during server bootstrap with the Socket.IO server instance. */
  init(io) {
    _io = io;
  },

  /**
   * Emit a Socket.IO event to a single authenticated user.
   * Each user joins a private room named after their user-id on connect.
   * @param {string} userId
   * @param {string} event    e.g. 'new_notification'
   * @param {object} payload
   */
  emitToUser(userId, event, payload) {
    if (_io) {
      _io.to(`user:${userId}`).emit(event, payload);
    }
  },
};

module.exports = socketService;
