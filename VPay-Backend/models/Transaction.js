const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Transaction = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      channel: row.channel || 'app',
      balanceBefore: row.balance_before,
      balanceAfter: row.balance_after,
      completedAt: row.completed_at,
      failureReason: row.failure_reason,
      providerReference: row.provider_reference,
      recipient: row.recipient ? (typeof row.recipient === 'string' ? JSON.parse(row.recipient) : row.recipient) : null,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', reference: 'reference', status: 'status', type: 'type' };
    let sql = 'SELECT * FROM transactions';
    const vals = [];

    if (conditions.$or) {
      const clauses = conditions.$or.map((c) => {
        const k = Object.keys(c)[0];
        vals.push(Object.values(c)[0]);
        return `${colMap[k] || k} = ?`;
      });
      const rest = Object.entries(conditions).filter(([k]) => k !== '$or');
      const restClauses = rest.map(([k, v]) => { vals.push(v); return `${colMap[k] || k} = ?`; });
      const all = [...clauses, ...restClauses];
      // $or clauses grouped, rest are AND
      if (clauses.length > 0 && rest.length > 0) {
        sql += ` WHERE (${clauses.join(' OR ')}) AND ${restClauses.join(' AND ')}`;
        vals.splice(0);
        conditions.$or.forEach((c) => vals.push(Object.values(c)[0]));
        rest.forEach(([, v]) => vals.push(v));
      } else {
        sql += ` WHERE ${clauses.join(' OR ')}`;
      }
    } else {
      const keys = Object.keys(conditions);
      if (keys.length > 0) {
        const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
        sql += ` WHERE ${whereParts.join(' AND ')}`;
      }
    }
    sql += ' LIMIT 1';
    const [rows] = await pool.query(sql, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', reference: 'reference', status: 'status', type: 'type', category: 'category' };
    let sql = 'SELECT * FROM transactions';
    const vals = [];
    const whereParts = [];

    for (const [k, v] of Object.entries(conditions)) {
      const col = colMap[k] || k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        if (v.$gte !== undefined) { whereParts.push(`${col} >= ?`); vals.push(v.$gte); }
        if (v.$lte !== undefined) { whereParts.push(`${col} <= ?`); vals.push(v.$lte); }
      } else {
        whereParts.push(`${col} = ?`);
        vals.push(v);
      }
    }
    if (whereParts.length) sql += ` WHERE ${whereParts.join(' AND ')}`;
    sql += ' ORDER BY created_at DESC';
    if (opts.limit) { sql += ' LIMIT ?'; vals.push(opts.limit); }
    if (opts.skip) { sql += ' OFFSET ?'; vals.push(opts.skip); }

    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async countDocuments(conditions = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', status: 'status', type: 'type', category: 'category' };
    let sql = 'SELECT COUNT(*) AS cnt FROM transactions';
    const vals = [];
    const whereParts = [];

    for (const [k, v] of Object.entries(conditions)) {
      const col = colMap[k] || k;
      if (typeof v === 'object' && v !== null) {
        if (v.$gte !== undefined) { whereParts.push(`${col} >= ?`); vals.push(v.$gte); }
        if (v.$lte !== undefined) { whereParts.push(`${col} <= ?`); vals.push(v.$lte); }
      } else {
        whereParts.push(`${col} = ?`);
        vals.push(v);
      }
    }
    if (whereParts.length) sql += ` WHERE ${whereParts.join(' AND ')}`;
    const [rows] = await pool.query(sql, vals);
    return rows[0].cnt;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO transactions (reference, user_id, type, channel, category, amount, fee, currency,
        balance_before, balance_after, description, narration, status, metadata, 
        recipient_name, recipient_account, recipient_bank_code, recipient_bank_name, recipient_phone,
        provider, provider_reference, completed_at, failure_reason)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.reference,
        data.user || data.user_id,
        data.type,
        data.channel || 'app',
        data.category,
        data.amount,
        data.fee ?? 0,
        data.currency || 'NGN',
        data.balanceBefore ?? data.balance_before ?? null,
        data.balanceAfter ?? data.balance_after ?? null,
        data.description || null,
        data.narration || null,
        data.status || 'pending',
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.recipient?.name || data.recipient_name || null,
        data.recipient?.accountNumber || data.recipient_account || null,
        data.recipient?.bankCode || data.recipient_bank_code || null,
        data.recipient?.bankName || data.recipient_bank_name || null,
        data.recipient?.phone || data.recipient_phone || null,
        data.provider || null,
        data.providerReference || data.provider_reference || null,
        data.completedAt || data.completed_at || null,
        data.failureReason || data.failure_reason || null,
      ]
    );
    return this.findOne({ reference: data.reference });
  },

  async insertMany(records) {
    return Promise.all(records.map((r) => this.create(r)));
  },

  async findOneAndUpdate(conditions, updates) {
    const txn = await this.findOne(conditions);
    if (!txn) return null;
    const fieldMap = {
      status: 'status', balanceAfter: 'balance_after', balance_after: 'balance_after',
      completedAt: 'completed_at', completed_at: 'completed_at',
      failureReason: 'failure_reason', failure_reason: 'failure_reason',
      providerReference: 'provider_reference', provider_reference: 'provider_reference',
    };
    const setClauses = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(v); }
    }
    if (setClauses.length > 0) {
      vals.push(txn.id);
      await pool.query(`UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ?`, vals);
    }
    return this.findOne({ reference: txn.reference });
  },
};

module.exports = Transaction;

