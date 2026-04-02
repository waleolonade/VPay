const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Reward = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      totalPoints: row.total_points,
      redeemedPoints: row.redeemed_points,
      isRedeemed: !!row.is_redeemed,
      redeemedAt: row.redeemed_at,
      expiresAt: row.expires_at,
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', reference: 'reference' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM rewards WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', type: 'type' };
    let sql = 'SELECT * FROM rewards';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    sql += ' ORDER BY created_at DESC';
    if (opts.limit) { sql += ' LIMIT ?'; vals.push(opts.limit); }
    if (opts.skip) { sql += ' OFFSET ?'; vals.push(opts.skip); }
    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async create(data) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO rewards (id, user_id, type, points, total_points, redeemed_points, description, reference, is_redeemed, redeemed_at, expires_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, data.user || data.user_id, data.type, data.points, data.totalPoints ?? data.total_points ?? 0,
        data.redeemedPoints ?? data.redeemed_points ?? 0, data.description || null, data.reference || null,
        data.isRedeemed ?? data.is_redeemed ?? 0, data.redeemedAt || data.redeemed_at || null,
        data.expiresAt || data.expires_at || null]
    );
    return this.findOne({ id });
  },
};

module.exports = Reward;

