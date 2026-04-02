const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Beneficiary = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      accountName: row.account_name,
      accountNumber: row.account_number,
      bankCode: row.bank_code,
      bankName: row.bank_name,
      billerId: row.biller_id,
      billerName: row.biller_name,
      isFavorite: !!row.is_favorite,
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', type: 'type' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM beneficiaries WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', type: 'type', isFavorite: 'is_favorite', is_favorite: 'is_favorite' };
    let sql = 'SELECT * FROM beneficiaries';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    sql += ' ORDER BY is_favorite DESC, created_at DESC';
    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async create(data) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO beneficiaries (id, user_id, type, nickname, account_name, account_number, bank_code, bank_name, phone, network, biller_id, biller_name, is_favorite)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, data.user || data.user_id, data.type, data.nickname || null, data.accountName || data.account_name || null,
        data.accountNumber || data.account_number || null, data.bankCode || data.bank_code || null,
        data.bankName || data.bank_name || null, data.phone || null, data.network || null,
        data.billerId || data.biller_id || null, data.billerName || data.biller_name || null,
        data.isFavorite ?? data.is_favorite ?? 0]
    );
    return this.findOne({ id });
  },

  async findOneAndUpdate(conditions, updates) {
    const ben = await this.findOne(conditions);
    if (!ben) return null;
    const fieldMap = { nickname: 'nickname', isFavorite: 'is_favorite', is_favorite: 'is_favorite', phone: 'phone', network: 'network' };
    const setClauses = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(v); }
    }
    if (setClauses.length > 0) { vals.push(ben.id); await pool.query(`UPDATE beneficiaries SET ${setClauses.join(', ')} WHERE id = ?`, vals); }
    return this.findOne({ id: ben.id });
  },

  async findOneAndDelete(conditions) {
    const ben = await this.findOne(conditions);
    if (!ben) return null;
    await pool.query('DELETE FROM beneficiaries WHERE id = ?', [ben.id]);
    return ben;
  },
};

module.exports = Beneficiary;

