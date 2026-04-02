const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Wallet = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      accountNumber: row.account_number,
      isActive: !!row.is_active,
      isFrozen: !!row.is_frozen,
      dailyLimit: row.daily_limit,
      transactionLimit: row.transaction_limit,
      totalCredit: parseFloat(row.total_credit) || 0,
      totalDebit: parseFloat(row.total_debit) || 0,
      balance: parseFloat(row.balance) || 0,
      toObject() { return { ...this }; },
      async save() { await Wallet.updateRaw(this.id, this); },
    };
  },

  async findOne(conditions) {
    const keys = Object.keys(conditions);
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', walletType: 'wallet_type', wallet_type: 'wallet_type' };
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM wallets WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions) {
    const keys = Object.keys(conditions);
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', walletType: 'wallet_type', wallet_type: 'wallet_type' };
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM wallets WHERE ${whereParts.join(' AND ')}`, vals);
    return rows.map(r => this._map(r));
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM wallets WHERE id = ? LIMIT 1', [id]);
    return this._map(rows[0]);
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO wallets (user_id, balance, currency, account_number, account_name, bank_name, wallet_type, is_active, is_frozen, daily_limit, transaction_limit, total_credit, total_debit)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.user || data.user_id,
        data.balance ?? 0,
        data.currency || 'NGN',
        data.accountNumber || data.account_number || null,
        data.accountName || data.account_name || null,
        data.bankName || data.bank_name || 'VPay MFB',
        data.walletType || data.wallet_type || 'personal',
        data.isActive ?? data.is_active ?? 1,
        data.isFrozen ?? data.is_frozen ?? 0,
        data.dailyLimit ?? data.daily_limit ?? 500000,
        data.transactionLimit ?? data.transaction_limit ?? 200000,
        data.totalCredit ?? data.total_credit ?? 0,
        data.totalDebit ?? data.total_debit ?? 0,
      ]
    );
    return this.findById(result.insertId);
  },

  async updateRaw(id, data) {
    const fieldMap = {
      balance: 'balance', currency: 'currency', account_number: 'account_number',
      accountNumber: 'account_number', bank_name: 'bank_name', bankName: 'bank_name',
      is_active: 'is_active', isActive: 'is_active', is_frozen: 'is_frozen', isFrozen: 'is_frozen',
      daily_limit: 'daily_limit', dailyLimit: 'daily_limit',
      transaction_limit: 'transaction_limit', transactionLimit: 'transaction_limit',
      total_credit: 'total_credit', totalCredit: 'total_credit',
      total_debit: 'total_debit', totalDebit: 'total_debit',
    };
    const setClauses = [];
    const vals = [];
    for (const [k, v] of Object.entries(data)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(v); }
    }
    if (setClauses.length > 0) {
      vals.push(id);
      await pool.query(`UPDATE wallets SET ${setClauses.join(', ')} WHERE id = ?`, vals);
    }
  },

  async findOneAndUpdate(conditions, updates) {
    const wallet = await this.findOne(conditions);
    if (!wallet) return null;
    await this.updateRaw(wallet.id, updates);
    return this.findById(wallet.id);
  },

  // ─── Atomic balance operations ────────────────────────────────────────────────
  // These use SQL-level arithmetic to prevent race conditions and ensure
  // total_credit / total_debit are always 100% accurate.

  /**
   * Atomic debit: subtracts (amount + fee) from balance, adds amount to total_debit.
   * - balance decreases by the FULL amount paid (including fee)
   * - total_debit increases only by the BASE amount (mirrors bank statement behaviour)
   * @param {string} walletId
   * @param {number} amount - base transaction amount
   * @param {number} fee    - transaction fee (default 0)
   */
  async atomicDebit(walletId, amount, fee = 0) {
    const totalDeduction = parseFloat(amount) + parseFloat(fee);
    await pool.query(
      `UPDATE wallets
          SET balance     = balance     - ?,
              total_debit = total_debit + ?,
              updated_at  = NOW()
        WHERE id = ?`,
      [totalDeduction, parseFloat(amount), walletId]
    );
    return this.findById(walletId);
  },

  /**
   * Atomic credit: adds amount to balance and to total_credit.
   * @param {string} walletId
   * @param {number} amount
   */
  async atomicCredit(walletId, amount) {
    await pool.query(
      `UPDATE wallets
          SET balance      = balance      + ?,
              total_credit = total_credit + ?,
              updated_at   = NOW()
        WHERE id = ?`,
      [parseFloat(amount), parseFloat(amount), walletId]
    );
    return this.findById(walletId);
  },

  /**
   * Re-reads balance from DB — always fresh (avoids stale cached values).
   * @param {string} walletId
   * @param {number} requiredAmount
   */
  async hasSufficientBalance(walletId, requiredAmount) {
    const [rows] = await pool.query('SELECT balance FROM wallets WHERE id = ? LIMIT 1', [walletId]);
    return rows.length > 0 && parseFloat(rows[0].balance) >= parseFloat(requiredAmount);
  },

  async aggregate(pipeline) {
    // Support simple $group with $sum for admin stats
    const stage = pipeline.find((s) => s.$group);
    if (stage && stage.$group && stage.$group._id === null && stage.$group.total) {
      const field = stage.$group.total.$sum.replace('$', '');
      const colMap = { balance: 'balance', totalCredit: 'total_credit', totalDebit: 'total_debit' };
      const col = colMap[field] || field;
      const [rows] = await pool.query(`SELECT SUM(${col}) AS total FROM wallets`);
      return [{ _id: null, total: rows[0].total || 0 }];
    }
    return [];
  },
};

module.exports = Wallet;
