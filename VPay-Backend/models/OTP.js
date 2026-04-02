const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const OTP = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      isUsed: !!row.is_used,
      expiresAt: row.expires_at,
      async save() { await OTP._update(this.id, this); },
    };
  },

  async _update(id, data) {
    const fieldMap = { is_used: 'is_used', isUsed: 'is_used', attempts: 'attempts' };
    const setClauses = [];
    const vals = [];
    for (const [k, v] of Object.entries(data)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(v ? 1 : 0); }
    }
    if (setClauses.length > 0) { vals.push(id); await pool.query(`UPDATE otps SET ${setClauses.join(', ')} WHERE id = ?`, vals); }
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', phone: 'phone', email: 'email', type: 'type', isUsed: 'is_used', is_used: 'is_used' };
    const keys = Object.keys(conditions);
    const whereParts = [];
    const vals = [];
    for (const k of keys) {
      const col = colMap[k] || k;
      const v = conditions[k];
      if (typeof v === 'object' && v !== null && v.$gt !== undefined) {
        whereParts.push(`${col} > ?`);
        vals.push(v.$gt);
      } else {
        whereParts.push(`${col} = ?`);
        vals.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
      }
    }
    const [rows] = await pool.query(`SELECT * FROM otps WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async create(data) {
    const id = uuidv4();
    const otpHash = data.otp ? await bcrypt.hash(data.otp, 10) : null;
    await pool.query(
      `INSERT INTO otps (id, user_id, phone, email, otp_hash, type, is_used, attempts, expires_at) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, data.user || data.user_id || null, data.phone || null, data.email || null, otpHash, data.type, 0, data.attempts ?? 0, data.expiresAt || data.expires_at]
    );
    return this.findOne({ id });
  },

  async verifyOtp(id, candidate) {
    const [rows] = await pool.query('SELECT otp_hash FROM otps WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return false;
    return bcrypt.compare(candidate, rows[0].otp_hash);
  },

  async markUsed(id) {
    await pool.query('UPDATE otps SET is_used = 1 WHERE id = ?', [id]);
  },

  async deleteOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', phone: 'phone', type: 'type', id: 'id' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    await pool.query(`DELETE FROM otps WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
  },
};

module.exports = OTP;
