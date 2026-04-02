const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Referral = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      referrer: row.referrer_id,
      referee: row.referee_id,
      rewardAmount: row.reward_amount,
      rewardedAt: row.rewarded_at,
    };
  },

  async findOne(conditions) {
    const colMap = { referrer: 'referrer_id', referee: 'referee_id', id: 'id', code: 'code', status: 'status' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM referrals WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}) {
    const colMap = { referrer: 'referrer_id', referee: 'referee_id', status: 'status' };
    let sql = 'SELECT * FROM referrals';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async create(data) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO referrals (id, referrer_id, referee_id, code, status, reward_amount, rewarded_at) VALUES (?,?,?,?,?,?,?)',
      [id, data.referrer || data.referrer_id, data.referee || data.referee_id, data.code, data.status || 'pending', data.rewardAmount ?? data.reward_amount ?? 0, data.rewardedAt || data.rewarded_at || null]
    );
    return this.findOne({ id });
  },

  async updateOne(conditions, updates) {
    const colMap = { referrer: 'referrer_id', referee: 'referee_id', code: 'code', status: 'status' };
    const fieldMap = { status: 'status', reward_amount: 'reward_amount', rewardAmount: 'reward_amount', rewarded_at: 'rewarded_at', rewardedAt: 'rewarded_at' };
    const setClauses = [];
    const vals = [];
    const updData = updates.$set || updates;
    for (const [k, v] of Object.entries(updData)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(v); }
    }
    const whereParts = Object.keys(conditions).map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
    if (setClauses.length > 0) {
      await pool.query(`UPDATE referrals SET ${setClauses.join(', ')} WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    }
  },
};

module.exports = Referral;

