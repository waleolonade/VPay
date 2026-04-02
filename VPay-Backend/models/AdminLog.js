// AdminLog.js - Model for admin/audit logs
const { pool } = require('../config/database');

const AdminLog = {
  async create({ adminId, action, details, ip, status }) {
    const sql = `INSERT INTO admin_logs (admin_id, action, details, ip, status) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [adminId, action, details, ip, status]);
    return result.insertId;
  },

  async getAll({ limit = 100, skip = 0 } = {}) {
    const sql = `SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [parseInt(limit), parseInt(skip)]);
    return rows;
  },

  async getByAdmin(adminId, { limit = 100, skip = 0 } = {}) {
    const sql = `SELECT * FROM admin_logs WHERE admin_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [adminId, parseInt(limit), parseInt(skip)]);
    return rows;
  }
};

module.exports = AdminLog;
