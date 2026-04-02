const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Investment = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      planName: row.plan_name,
      currentValue: row.current_value,
      returnRate: row.return_rate,
      maturityDate: row.maturity_date,
      startDate: row.start_date,
      isRolledOver: !!row.is_rolled_over,
      maturedAt: row.matured_at,
      async save() { await Investment.updateRaw(this.id, this); },
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', reference: 'reference', status: 'status' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM investments WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', status: 'status' };
    let sql = 'SELECT * FROM investments';
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
    const colMap = { user: 'user_id', status: 'status' };
    let sql = 'SELECT COUNT(*) AS cnt FROM investments';
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
      `INSERT INTO investments (id, user_id, reference, plan_name, amount, current_value, returns,
        return_rate, duration, maturity_date, start_date, status, is_rolled_over, matured_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.user || data.user_id, data.reference, data.planName || data.plan_name,
        data.amount, data.currentValue ?? data.current_value ?? data.amount,
        data.returns ?? 0, data.returnRate ?? data.return_rate,
        data.duration, data.maturityDate || data.maturity_date,
        data.startDate || data.start_date || new Date(),
        data.status || 'active',
        data.isRolledOver ?? data.is_rolled_over ?? 0,
        data.maturedAt || data.matured_at || null,
      ]
    );
    return this.findOne({ id });
  },

  async updateRaw(id, data) {
    const fieldMap = {
      status: 'status', returns: 'returns', current_value: 'current_value', currentValue: 'current_value',
      is_rolled_over: 'is_rolled_over', isRolledOver: 'is_rolled_over',
      matured_at: 'matured_at', maturedAt: 'matured_at',
    };
    const setClauses = [];
    const vals = [];
    for (const [k, v] of Object.entries(data)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(v); }
    }
    if (setClauses.length > 0) { vals.push(id); await pool.query(`UPDATE investments SET ${setClauses.join(', ')} WHERE id = ?`, vals); }
  },
};

module.exports = Investment;

