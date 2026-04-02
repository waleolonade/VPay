// LoginAlert.js - Model for login alerts
const { pool } = require('../config/database');

const LoginAlert = {
  async create({ userId, ip, device, location, alertType, status }) {
    const sql = `INSERT INTO login_alerts (user_id, ip, device, location, alert_type, status) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [userId, ip, device, location, alertType, status]);
    return result.insertId;
  },

  async getAll({ limit = 100, skip = 0 } = {}) {
    const sql = `SELECT * FROM login_alerts ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [parseInt(limit), parseInt(skip)]);
    return rows;
  },

  async getByUser(userId, { limit = 100, skip = 0 } = {}) {
    const sql = `SELECT * FROM login_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [userId, parseInt(limit), parseInt(skip)]);
    return rows;
  }
};

module.exports = LoginAlert;
