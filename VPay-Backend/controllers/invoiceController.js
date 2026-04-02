const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const generateSlug = () => Math.random().toString(36).substring(2, 10);

// @desc    Create a new invoice/payment request
// @route   POST /api/v1/invoices
exports.createInvoice = async (req, res, next) => {
  try {
    const { customerName, customerEmail, amount, description, dueDate } = req.body;
    const userId = req.user.id;

    if (!customerName || !amount || amount <= 0 || !dueDate) {
      return res.status(400).json({ success: false, message: 'Customer name, valid amount, and due date are required' });
    }

    const id = uuidv4();
    const slug = generateSlug();

    await pool.query(
      `INSERT INTO invoices (id, user_id, customer_name, customer_email, amount, description, due_date, slug) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, customerName, customerEmail || null, amount, description || null, dueDate, slug]
    );

    res.status(201).json({
      success: true,
      message: 'Payment request created successfully',
      data: { id, slug, amount, customerName, dueDate }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices for a business user
// @route   GET /api/v1/invoices
exports.getInvoices = async (req, res, next) => {
  try {
    // optional query to filter by status (e.g. ?type=present for pending, ?type=previous for paid/cancelled)
    const { type } = req.query; 
    let query = 'SELECT * FROM invoices WHERE user_id = ?';
    const params = [req.user.id];

    if (type === 'present') {
      query += ' AND status IN ("pending", "overdue")';
    } else if (type === 'previous') {
      query += ' AND status IN ("paid", "cancelled")';
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stats for tracking and analysis
// @route   GET /api/v1/invoices/stats
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status IN ('pending', 'overdue') THEN amount ELSE 0 END) as pendingVolume,
        COUNT(CASE WHEN status IN ('pending', 'overdue') THEN 1 END) as pendingCount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paidVolume,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidCount,
        SUM(amount) as totalRequested
      FROM invoices 
      WHERE user_id = ?
    `, [req.user.id]);

    const stats = rows[0] || { pendingVolume: 0, pendingCount: 0, paidVolume: 0, paidCount: 0, totalRequested: 0 };
    
    res.status(200).json({
      success: true,
      data: {
        pendingVolume: parseFloat(stats.pendingVolume || 0),
        pendingCount: parseInt(stats.pendingCount || 0),
        paidVolume: parseFloat(stats.paidVolume || 0),
        paidCount: parseInt(stats.paidCount || 0),
        totalRequested: parseFloat(stats.totalRequested || 0),
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mock paying an invoice via public link
// @route   POST /api/v1/invoices/:slug/pay
exports.payInvoice = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Check if valid
    const [rows] = await pool.query('SELECT * FROM invoices WHERE slug = ?', [slug]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    const invoice = rows[0];
    if (invoice.status === 'paid') return res.status(400).json({ success: false, message: 'Invoice is already paid' });

    // Mark paid and transfer funds
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('UPDATE invoices SET status = "paid", paid_at = NOW() WHERE id = ?', [invoice.id]);

      // Add to business wallet
      await connection.query('UPDATE wallets SET balance = balance + ? WHERE user_id = ?', [invoice.amount, invoice.user_id]);

      // Record transaction
      const txnId = uuidv4();
      await connection.query(`
        INSERT INTO transactions (id, reference, user_id, type, category, amount, status, description)
        VALUES (?, ?, ?, 'credit', 'deposit', ?, 'completed', ?)
      `, [txnId, `INV-PAY-${Date.now()}`, invoice.user_id, invoice.amount, `Invoice payment from ${invoice.customer_name}`]);

      await connection.commit();
      res.status(200).json({ success: true, message: 'Payment processed successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
};
