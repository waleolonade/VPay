// SuspiciousActivity.js - Model for suspicious activity logs
const { pool } = require('../config/database');

const SuspiciousActivity = {
  async create({ userId, activityType, details, ip, status }) {
    const sql = `INSERT INTO suspicious_activities (user_id, activity_type, details, ip, status) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [userId, activityType, details, ip, status]);
    return result.insertId;
  },

  async getAll({ limit = 100, skip = 0 } = {}) {
    const sql = `SELECT * FROM suspicious_activities ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [parseInt(limit), parseInt(skip)]);
    return rows;
  },

  async getByUser(userId, { limit = 100, skip = 0 } = {}) {
    const sql = `SELECT * FROM suspicious_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [userId, parseInt(limit), parseInt(skip)]);
    return rows;
  }
};

module.exports = SuspiciousActivity;
