const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const BankAccount = {
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
      isDefault: !!row.is_default,
      isVerified: !!row.is_verified,
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM bank_accounts WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id' };
    let sql = 'SELECT * FROM bank_accounts';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async create(data) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO bank_accounts (id, user_id, account_name, account_number, bank_code, bank_name, is_default, is_verified) VALUES (?,?,?,?,?,?,?,?)',
      [id, data.user || data.user_id, data.accountName || data.account_name, data.accountNumber || data.account_number,
        data.bankCode || data.bank_code, data.bankName || data.bank_name,
        data.isDefault ?? data.is_default ?? 0, data.isVerified ?? data.is_verified ?? 0]
    );
    return this.findOne({ id });
  },

  async findOneAndDelete(conditions) {
    const acc = await this.findOne(conditions);
    if (!acc) return null;
    await pool.query('DELETE FROM bank_accounts WHERE id = ?', [acc.id]);
    return acc;
  },

  async update(id, data) {
    const keys = Object.keys(data);
    const colMap = {
      user: 'user_id',
      accountName: 'account_name',
      accountNumber: 'account_number',
      bankCode: 'bank_code',
      bankName: 'bank_name',
      isDefault: 'is_default',
      isVerified: 'is_verified'
    };
    const setParts = keys.map(k => `${colMap[k] || k} = ?`);
    const vals = [...keys.map(k => data[k]), id];
    await pool.query(`UPDATE bank_accounts SET ${setParts.join(', ')} WHERE id = ?`, vals);
    return this.findOne({ id });
  },
};

module.exports = BankAccount;

