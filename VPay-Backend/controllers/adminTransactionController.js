const { pool } = require('../config/database');

// List all transactions (with filters, pagination)
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', type = '', status = '', startDate = '', endDate = '', category = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (reference LIKE ? OR user_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (type) { where += ' AND type = ?'; params.push(type); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (category) { where += ' AND category = ?'; params.push(category); }
    if (startDate) { where += ' AND created_at >= ?'; params.push(startDate); }
    if (endDate) { where += ' AND created_at <= ?'; params.push(endDate); }
    const [rows] = await pool.query(
      `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count FROM transactions ${where}`, params);
    res.json({ success: true, data: rows, pagination: { page: Number(page), limit: Number(limit), total: count } });
  } catch (err) { next(err); }
};

// Get summary stats for all transactions
exports.getTransactionSummary = async (req, res, next) => {
  try {
    const [[totals]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'credit' AND status IN ('completed','success') THEN amount ELSE 0 END), 0) AS totalCredit,
         COALESCE(SUM(CASE WHEN type = 'debit'  AND status IN ('completed','success') THEN amount ELSE 0 END), 0) AS totalDebit,
         COALESCE(SUM(CASE WHEN type = 'debit'  AND status IN ('completed','success') THEN fee  ELSE 0 END), 0) AS totalFees,
         COUNT(*) AS totalTransactions,
         COUNT(CASE WHEN status = 'pending'  THEN 1 END) AS pendingCount,
         COUNT(CASE WHEN status = 'failed'   THEN 1 END) AS failedCount,
         COUNT(CASE WHEN type = 'credit'     THEN 1 END) AS creditCount,
         COUNT(CASE WHEN type = 'debit'      THEN 1 END) AS debitCount
       FROM transactions`);
    res.json({ success: true, data: totals });
  } catch (err) { next(err); }
};

// Get single transaction details
exports.getTransaction = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const [rows] = await pool.query('SELECT * FROM transactions WHERE reference = ? OR id = ?', [reference, reference]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// Refund a transaction (admin)
exports.refundTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    // TODO: Implement refund logic (reverse transaction, update status, credit user, log reason)
    // Example: update status, log admin action
    await pool.query('UPDATE transactions SET status = ?, admin_note = ? WHERE id = ?', ['refunded', reason, id]);
    res.json({ success: true, message: 'Transaction refunded' });
  } catch (err) { next(err); }
};
