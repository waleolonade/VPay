const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Savings = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      planName: row.plan_name,
      targetAmount: row.target_amount,
      currentBalance: row.current_balance,
      interestRate: row.interest_rate,
      interestEarned: row.interest_earned,
      frequency: row.frequency,
      autoSaveAmount: row.auto_save_amount,
      autoSaveRule: row.auto_save_rule,
      ruleValue: row.rule_value,
      startDate: row.start_date,
      maturityDate: row.maturity_date,
      isAutoSave: !!row.is_auto_save,
      completedAt: row.completed_at,
      async save() { await Savings.updateRaw(this.id, this); },
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', reference: 'reference', status: 'status' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM savings WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', status: 'status' };
    let sql = 'SELECT * FROM savings';
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
    let sql = 'SELECT COUNT(*) AS cnt FROM savings';
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
      `INSERT INTO savings (id, user_id, reference, plan_name, target_amount, current_balance, interest_rate,
        interest_earned, frequency, auto_save_amount, auto_save_rule, rule_value, is_auto_save, start_date, maturity_date, status, completed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.user || data.user_id, data.reference, data.planName || data.plan_name,
        data.targetAmount ?? data.target_amount, data.currentBalance ?? data.current_balance ?? 0,
        data.interestRate ?? data.interest_rate ?? 0.08,
        data.interestEarned ?? data.interest_earned ?? 0,
        data.frequency, data.autoSaveAmount ?? data.auto_save_amount ?? 0,
        data.autoSaveRule ?? data.auto_save_rule ?? null,
        data.ruleValue ?? data.rule_value ?? null,
        data.isAutoSave ?? data.is_auto_save ?? 0,
        data.startDate || data.start_date || new Date(),
        data.maturityDate || data.maturity_date || null,
        data.status || 'active',
        data.completedAt || data.completed_at || null,
      ]
    );
    return this.findOne({ id });
  },

  async updateRaw(id, data) {
    const fieldMap = {
      status: 'status', current_balance: 'current_balance', currentBalance: 'current_balance',
      interest_earned: 'interest_earned', interestEarned: 'interest_earned',
      auto_save_rule: 'auto_save_rule', autoSaveRule: 'auto_save_rule',
      rule_value: 'rule_value', ruleValue: 'rule_value',
      completed_at: 'completed_at', completedAt: 'completed_at',
      is_auto_save: 'is_auto_save', isAutoSave: 'is_auto_save',
      auto_save_amount: 'auto_save_amount', autoSaveAmount: 'auto_save_amount',
      frequency: 'frequency',
    };
    const setClauses = [];
    const vals = [];
    for (const [k, v] of Object.entries(data)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(v); }
    }
    if (setClauses.length > 0) { vals.push(id); await pool.query(`UPDATE savings SET ${setClauses.join(', ')} WHERE id = ?`, vals); }
  },

  /**
   * Get savings summary for a user
   * Returns total balance, total interest earned, and count of active plans
   */
  async getSummary(userId) {
    const sql = `
      SELECT 
        COALESCE(SUM(current_balance), 0) as totalBalance,
        COALESCE(SUM(interest_earned), 0) as totalInterest,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activePlans,
        COUNT(*) as totalPlans
      FROM savings 
      WHERE user_id = ?
    `;
    const [rows] = await pool.query(sql, [userId]);
    return {
      totalBalance: parseFloat(rows[0].totalBalance) || 0,
      totalInterest: parseFloat(rows[0].totalInterest) || 0,
      activePlans: parseInt(rows[0].activePlans) || 0,
      totalPlans: parseInt(rows[0].totalPlans) || 0,
    };
  },
};

module.exports = Savings;

