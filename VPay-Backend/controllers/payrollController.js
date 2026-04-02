const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * @desc    Add new staff member
 * @route   POST /api/v1/business/payroll/staff
 */
exports.addStaff = async (req, res, next) => {
  try {
    const { name, phone, account_number, bank_name, bank_code, base_salary } = req.body;
    const business_id = req.user.id; // Correct assuming business owner is the auth user

    if (!name || !account_number || !bank_name) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const [result] = await pool.query(
      'INSERT INTO business_staff (business_id, name, phone, account_number, bank_name, bank_code, base_salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [business_id, name, phone, account_number, bank_name, bank_code, base_salary || 0]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId, name, base_salary }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all staff for business
 * @route   GET /api/v1/business/payroll/staff
 */
exports.getStaff = async (req, res, next) => {
  try {
    const business_id = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM business_staff WHERE business_id = ? AND status != "inactive" ORDER BY created_at DESC',
      [business_id]
    );

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update staff details (inc. status and salary)
 * @route   PUT /api/v1/business/payroll/staff/:id
 */
exports.updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status, base_salary, account_number, bank_name } = req.body;
    
    // Simple dynamic update
    let query = 'UPDATE business_staff SET ';
    const params = [];
    if (name) { query += 'name = ?, '; params.push(name); }
    if (status) { query += 'status = ?, '; params.push(status); }
    if (base_salary !== undefined) { query += 'base_salary = ?, '; params.push(base_salary); }
    if (account_number) { query += 'account_number = ?, '; params.push(account_number); }
    if (bank_name) { query += 'bank_name = ?, '; params.push(bank_name); }
    
    query = query.slice(0, -2) + ' WHERE id = ? AND business_id = ?';
    params.push(id, req.user.id);

    await pool.query(query, params);
    res.status(200).json({ success: true, message: 'Staff updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process Payroll (Individual or Bulk)
 * @route   POST /api/v1/business/payroll/pay
 */
exports.processPayroll = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { staffId, isBulk, narration } = req.body;
    const business_id = req.user.id;
    
    let staffToPay = [];
    if (isBulk) {
      const [rows] = await connection.query(
        'SELECT id, name, base_salary FROM business_staff WHERE business_id = ? AND status = "active"',
        [business_id]
      );
      staffToPay = rows;
    } else {
      const [rows] = await connection.query(
        'SELECT id, name, base_salary FROM business_staff WHERE id = ? AND business_id = ? AND status = "active"',
        [staffId, business_id]
      );
      staffToPay = rows;
    }

    if (staffToPay.length === 0) {
      throw new Error('No active staff found for payment');
    }

    const totalAmount = staffToPay.reduce((acc, s) => acc + parseFloat(s.base_salary), 0);

    // 1. Check Business Wallet Balance
    const [wallets] = await connection.query('SELECT balance FROM wallets WHERE user_id = ?', [business_id]);
    if (!wallets[0] || wallets[0].balance < totalAmount) {
      throw new Error('Insufficient business wallet balance');
    }

    // 2. Deduct from Business Wallet
    await connection.query('UPDATE wallets SET balance = balance - ? WHERE user_id = ?', [totalAmount, business_id]);

    // 3. Log into payroll_logs and create individual transactions
    for (const staff of staffToPay) {
      const ref = `SAL-${Date.now()}-${staff.id}`;
      await connection.query(
        'INSERT INTO payroll_logs (business_id, staff_id, amount, reference, narration) VALUES (?, ?, ?, ?, ?)',
        [business_id, staff.id, staff.base_salary, ref, narration || `Salary Payment for ${staff.name}`]
      );
      
      // Also log as a standard transaction for general history
      await connection.query(
        'INSERT INTO transactions (user_id, amount, type, category, description, reference, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [business_id, -staff.base_salary, 'debit', 'Payroll', `Salary: ${staff.name}`, ref, 'completed']
      );
    }

    await connection.commit();
    res.status(200).json({ success: true, message: `Processed payment for ${staffToPay.length} staff`, total: totalAmount });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Get Payroll Analytics
 * @route   GET /api/v1/business/payroll/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const business_id = req.user.id;
    
    const [totalSpent] = await pool.query(
      'SELECT SUM(amount) as total FROM payroll_logs WHERE business_id = ? AND status = "success"',
      [business_id]
    );

    const [monthlyBreakdown] = await pool.query(
      'SELECT DATE_FORMAT(created_at, "%Y-%m") as month, SUM(amount) as amount FROM payroll_logs WHERE business_id = ? GROUP BY month ORDER BY month DESC LIMIT 6',
      [business_id]
    );

    const [staffCount] = await pool.query(
      'SELECT COUNT(*) as count FROM business_staff WHERE business_id = ? AND status = "active"',
      [business_id]
    );

    res.status(200).json({
      success: true,
      data: {
        totalSpent: totalSpent[0].total || 0,
        activeStaff: staffCount[0].count || 0,
        monthlyHistory: monthlyBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};
