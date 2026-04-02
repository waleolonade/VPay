const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Loan = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      interestRate: row.interest_rate,
      totalRepayable: row.total_repayable,
      amountRepaid: row.amount_repaid,
      outstandingBalance: row.outstanding_balance,
      dueDate: row.due_date,
      disbursedAt: row.disbursed_at,
      completedAt: row.completed_at,
      rejectionReason: row.rejection_reason,
      approvedBy: row.approved_by,
      repaymentSchedule: [],
      async save() { await Loan.updateRaw(this.id, this); },
    };
  },

  async _withSchedule(loan) {
    if (!loan) return null;
    const [rows] = await pool.query('SELECT * FROM loan_repayment_schedule WHERE loan_id = ? ORDER BY due_date ASC', [loan.id]);
    loan.repaymentSchedule = rows.map((r) => ({ ...r, isPaid: !!r.is_paid, paidAt: r.paid_at, dueDate: r.due_date }));
    return loan;
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', reference: 'reference', status: 'status' };
    const keys = Object.keys(conditions);
    const whereParts = [];
    const vals = [];
    for (const k of keys) {
      const v = conditions[k];
      const col = colMap[k] || k;
      if (typeof v === 'object' && v !== null && v.$in) {
        whereParts.push(`${col} IN (?)`);
        vals.push(v.$in);
      } else {
        whereParts.push(`${col} = ?`);
        vals.push(v);
      }
    }
    const [rows] = await pool.query(`SELECT * FROM loans WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._withSchedule(this._map(rows[0]));
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM loans WHERE id = ? LIMIT 1', [id]);
    return this._withSchedule(this._map(rows[0]));
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', status: 'status' };
    let sql = 'SELECT * FROM loans';
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
    return Promise.all(rows.map((r) => this._withSchedule(this._map(r))));
  },

  async countDocuments(conditions = {}) {
    const colMap = { user: 'user_id', status: 'status' };
    let sql = 'SELECT COUNT(*) AS cnt FROM loans';
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
      `INSERT INTO loans (id, user_id, reference, amount, interest_rate, duration, total_repayable,
        amount_repaid, outstanding_balance, purpose, status, due_date, disbursed_at, completed_at,
        rejection_reason, approved_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.user || data.user_id, data.reference, data.amount, data.interestRate || data.interest_rate,
        data.duration, data.totalRepayable || data.total_repayable,
        data.amountRepaid ?? data.amount_repaid ?? 0,
        data.outstandingBalance ?? data.outstanding_balance ?? null,
        data.purpose || null, data.status || 'pending',
        data.dueDate || data.due_date || null,
        data.disbursedAt || data.disbursed_at || null,
        data.completedAt || data.completed_at || null,
        data.rejectionReason || data.rejection_reason || null,
        data.approvedBy || data.approved_by || null,
      ]
    );
    // Insert repayment schedule
    if (data.repaymentSchedule && data.repaymentSchedule.length > 0) {
      for (const s of data.repaymentSchedule) {
        await pool.query(
          'INSERT INTO loan_repayment_schedule (id, loan_id, due_date, amount, is_paid, paid_at) VALUES (?,?,?,?,?,?)',
          [uuidv4(), id, s.dueDate || s.due_date, s.amount, s.isPaid ? 1 : 0, s.paidAt || s.paid_at || null]
        );
      }
    }
    return this.findById(id);
  },

  async updateRaw(id, data) {
    const fieldMap = {
      status: 'status', amount_repaid: 'amount_repaid', amountRepaid: 'amount_repaid',
      outstanding_balance: 'outstanding_balance', outstandingBalance: 'outstanding_balance',
      completed_at: 'completed_at', completedAt: 'completed_at',
      disbursed_at: 'disbursed_at', disbursedAt: 'disbursed_at',
      approved_by: 'approved_by', approvedBy: 'approved_by',
      rejection_reason: 'rejection_reason', rejectionReason: 'rejection_reason',
    };
    const setClauses = [];
    const vals = [];
    for (const [k, v] of Object.entries(data)) {
      const col = fieldMap[k];
      if (col) { setClauses.push(`${col} = ?`); vals.push(v); }
    }
    if (setClauses.length > 0) { vals.push(id); await pool.query(`UPDATE loans SET ${setClauses.join(', ')} WHERE id = ?`, vals); }
  },

  async aggregate(pipeline) {
    const groupStage = pipeline.find((s) => s.$group);
    if (groupStage && groupStage.$group && groupStage.$group._id === '$status') {
      const [rows] = await pool.query('SELECT status AS _id, COUNT(*) AS count, SUM(amount) AS total FROM loans GROUP BY status');
      return rows;
    }
    return [];
  },
};

module.exports = Loan;

