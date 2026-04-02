const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const socketService = require('../services/socketService');

const Notification = {
    /**
     * Fetch notifications for a user with pagination and unread filter
     * @param {string} userId
     * @param {number} page
     * @param {number} limit
     * @param {boolean} unreadOnly
     */
    async getUserNotifications(userId, page = 1, limit = 50, unreadOnly = false) {
      const conditions = { user_id: userId };
      if (unreadOnly) conditions.is_read = false;
      const skip = (page - 1) * limit;
      return this.find(conditions, { limit, skip });
    },
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      isRead: !!row.is_read,
      readAt: row.read_at,
      data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : null,
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', isRead: 'is_read', is_read: 'is_read' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => { const v = conditions[k]; return typeof v === 'boolean' ? (v ? 1 : 0) : v; });
    const [rows] = await pool.query(`SELECT * FROM notifications WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', isRead: 'is_read', is_read: 'is_read' };
    let sql = 'SELECT * FROM notifications';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => {
        const v = conditions[k];
        vals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
        return `${colMap[k] || k} = ?`;
      });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    sql += ' ORDER BY created_at DESC';
    if (opts.limit) { sql += ' LIMIT ?'; vals.push(opts.limit); }
    if (opts.skip) { sql += ' OFFSET ?'; vals.push(opts.skip); }
    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async countDocuments(conditions = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', isRead: 'is_read', is_read: 'is_read' };
    let sql = 'SELECT COUNT(*) AS cnt FROM notifications';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => {
        const v = conditions[k];
        vals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
        return `${colMap[k] || k} = ?`;
      });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    const [rows] = await pool.query(sql, vals);
    return rows[0].cnt;
  },

  async create(data) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, body, type, is_read, read_at, data, channel) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, data.user || data.user_id, data.title, data.body, data.type || 'system',
        data.isRead ?? data.is_read ?? 0, data.readAt || data.read_at || null,
        data.data ? JSON.stringify(data.data) : null, data.channel || 'in-app']
    );
    const notification = await this.findOne({ id });
    // Emit real-time event so connected clients update instantly
    socketService.emitToUser(data.user || data.user_id, 'new_notification', notification);
    return notification;
  },

  async findOneAndUpdate(conditions, updates) {
    const notif = await this.findOne(conditions);
    if (!notif) return null;
    const fieldMap = { isRead: 'is_read', is_read: 'is_read', readAt: 'read_at', read_at: 'read_at' };
    const setClauses = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v); }
    }
    if (setClauses.length > 0) { vals.push(notif.id); await pool.query(`UPDATE notifications SET ${setClauses.join(', ')} WHERE id = ?`, vals); }
    return this.findOne({ id: notif.id });
  },

  async updateMany(conditions, updates) {
    const colMap = { user: 'user_id', user_id: 'user_id', isRead: 'is_read', is_read: 'is_read' };
    const fieldMap = { isRead: 'is_read', is_read: 'is_read', readAt: 'read_at', read_at: 'read_at' };
    const setClauses = [];
    const setVals = [];
    for (const [k, v] of Object.entries(updates)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); setVals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v); }
    }
    const whereParts = [];
    const whereVals = [];
    for (const [k, v] of Object.entries(conditions)) {
      whereParts.push(`${colMap[k] || k} = ?`);
      whereVals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
    }
    if (setClauses.length > 0 && whereParts.length > 0) {
      await pool.query(`UPDATE notifications SET ${setClauses.join(', ')} WHERE ${whereParts.join(' AND ')}`, [...setVals, ...whereVals]);
    }
  },

  async findOneAndDelete(conditions) {
    const notif = await this.findOne(conditions);
    if (!notif) return null;
    await pool.query('DELETE FROM notifications WHERE id = ?', [notif.id]);
    return notif;
  },

  async markAsRead(id) {
    return this.findOneAndUpdate({ id }, { isRead: true, readAt: new Date() });
  },

  async markAllAsRead(userId) {
    return this.updateMany({ user_id: userId, isRead: false }, { isRead: true, readAt: new Date() });
  },

  async delete(id) {
    return this.findOneAndDelete({ id });
  },

  async getUnreadCount(userId) {
    return this.countDocuments({ user_id: userId, isRead: false });
  },

  async getStats(userId) {
    const total = await this.countDocuments({ user_id: userId });
    const unread = await this.getUnreadCount(userId);
    return { totalNotifications: total, unreadCount: unread };
  },

  async broadcastNotification(title, body, userIds = [], channels = ['in_app']) {
    const results = await Promise.all(
      userIds.map(userId => this.create({
        user_id: userId,
        title,
        body,
        type: 'system',
        isRead: false,
        channel: channels.includes('in_app') ? 'in-app' : (channels[0] || 'in-app')
      }))
    );
    return results;
  },
};

module.exports = Notification;

