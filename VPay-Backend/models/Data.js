const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Data = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      planId: row.plan_id,
      planName: row.plan_name,
      dataSize: row.data_size,
      providerReference: row.provider_reference,
      completedAt: row.completed_at,
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', reference: 'reference' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM data_purchases WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', status: 'status' };
    let sql = 'SELECT * FROM data_purchases';
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

  async countDocuments(conditions = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id' };
    let sql = 'SELECT COUNT(*) AS cnt FROM data_purchases';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    const [rows] = await pool.query(sql, vals);
    return rows[0].cnt;
  },

  async create(data) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO data_purchases (id, user_id, reference, phone, network, plan_id, plan_name, amount, data_size, validity, fee, status, provider_reference, completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, data.user || data.user_id, data.reference, data.phone, data.network,
        data.planId || data.plan_id, data.planName || data.plan_name, data.amount,
        data.dataSize || data.data_size || null, data.validity || null, data.fee ?? 0,
        data.status || 'pending', data.providerReference || data.provider_reference || null,
        data.completedAt || data.completed_at || null]
    );
    return this.findOne({ id });
  },
};

module.exports = Data;

