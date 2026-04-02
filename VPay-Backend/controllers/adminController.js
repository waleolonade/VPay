const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Notification = require('../models/Notification');
const { sendGenericNotificationEmail } = require('../services/emailService');
const { pool } = require('../config/database');
const { paginate, paginationMeta } = require('../utils/helpers');

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalWalletBalance, totalTransactions, totalLoans] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      Transaction.countDocuments({ status: 'completed' }),
      Loan.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalWalletBalance: totalWalletBalance[0]?.total || 0,
        totalTransactions,
        loanStats: totalLoans,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin)
// @route   GET /api/v1/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, kycStatus } = req.query;
    const { skip } = paginate(page, limit);
    const whereParts = ['role = ?'];
    const vals = ['user'];
    if (kycStatus) { whereParts.push('kyc_status = ?'); vals.push(kycStatus); }
    if (search) {
      whereParts.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const like = `%${search}%`;
      vals.push(like, like, like, like);
    }
    const where = whereParts.join(' AND ');
    const [userRows] = await pool.query(`SELECT * FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...vals, parseInt(limit), skip]);
    const [countRows] = await pool.query(`SELECT COUNT(*) AS cnt FROM users WHERE ${where}`, vals);
    const users = userRows.map((r) => User._map(r));
    const total = countRows[0].cnt;
    res.status(200).json({ success: true, data: users, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID (admin)
// @route   GET /api/v1/admin/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = User._map(rows[0]);
    
    // Get user's wallets
    const [wallets] = await pool.query('SELECT * FROM wallets WHERE user_id = ?', [req.params.id]);
    
    // Get transaction count and totals
    const [txStats] = await pool.query(
      `SELECT 
        COUNT(*) as totalTransactions,
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as totalCredit,
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as totalDebit
      FROM transactions 
      WHERE user_id = ? AND status = 'completed'`,
      [req.params.id]
    );
    
    // Get recent transactions
    const [recentTxs] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );
    
    const userData = {
      ...user,
      wallets: wallets.map(w => ({
        id: w.id,
        walletType: w.wallet_type || 'personal',
        balance: parseFloat(w.balance),
        accountNumber: w.account_number,
        isFrozen: w.is_frozen,
      })),
      walletBalance: wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0),
      totalTransactions: txStats[0].totalTransactions,
      totalCredit: parseFloat(txStats[0].totalCredit || 0),
      totalDebit: parseFloat(txStats[0].totalDebit || 0),
      recentTransactions: recentTxs,
    };
    
    res.status(200).json({ success: true, data: userData });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject KYC
// @route   PATCH /api/v1/admin/users/:id/kyc
exports.updateKYC = async (req, res, next) => {
  try {
    const { kycStatus, kycLevel } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { kycStatus, kycLevel }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Send KYC status notification
    try {
      await Notification.create({
        user: user.id,
        title: kycStatus === 'verified' ? 'KYC Verified' : 'KYC Rejected',
        body: kycStatus === 'verified' 
          ? `Congratulations! Your KYC has been verified. You are now Level ${kycLevel}.`
          : `Your KYC verification was rejected. Please check your profile for details.`,
        type: 'system',
        data: { kycStatus, kycLevel }
      });
    } catch (e) {}

    // Send KYC email
    sendGenericNotificationEmail(user.email, user.firstName, {
      title: kycStatus === 'verified' ? 'KYC Verified' : 'KYC Rejected',
      body: kycStatus === 'verified' 
        ? `Congratulations! Your KYC has been verified. You are now Level ${kycLevel}.`
        : `Your KYC verification was rejected. Please check your profile for details.`
    }).catch(err => logger.warn(`KYC email failed: ${err.message}`));
    res.status(200).json({ success: true, message: 'KYC updated', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Freeze/Unfreeze user wallet
// @route   PATCH /api/v1/admin/users/:id/wallet/freeze
exports.freezeWallet = async (req, res, next) => {
  try {
    const { isFrozen } = req.body;
    const wallet = await Wallet.findOneAndUpdate({ user: req.params.id }, { isFrozen }, { new: true });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });
    res.status(200).json({ success: true, message: `Wallet ${isFrozen ? 'frozen' : 'unfrozen'}`, data: wallet });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve loan
// @route   PATCH /api/v1/admin/loans/:id/approve
exports.approveLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status !== 'pending') return res.status(400).json({ success: false, message: 'Loan is not pending' });

    loan.status = 'approved';
    loan.approvedBy = req.user.id;
    await loan.save();

    // Disburse to wallet
    const wallet = await Wallet.findOne({ user: loan.user });
    wallet.balance += loan.amount;
    wallet.totalCredit += loan.amount;
    await wallet.save();

    loan.status = 'active';
    loan.disbursedAt = new Date();
    await loan.save();

    await Transaction.create({
      reference: `${loan.reference}-DISB`,
      user: loan.user,
      type: 'credit',
      category: 'loan',
      amount: loan.amount,
      balanceBefore: wallet.balance - loan.amount,
      balanceAfter: wallet.balance,
      description: `Loan disbursement - ${loan.reference}`,
      status: 'completed',
      completedAt: new Date(),
    });

    res.status(200).json({ success: true, message: 'Loan approved and disbursed', data: loan });

    // Send loan approval notification
    try {
      await Notification.create({
        user: loan.user,
        title: 'Loan Approved',
        body: `Your loan request for NGN ${loan.amount} has been approved and disbursed to your wallet.`,
        type: 'loan',
        data: { loanId: loan.id, amount: loan.amount }
      });
    } catch (e) {}

    // Send loan email
    const [uRows] = await pool.query('SELECT first_name, email FROM users WHERE id = ?', [loan.user]);
    if (uRows.length > 0) {
      sendGenericNotificationEmail(uRows[0].email, uRows[0].first_name, {
        title: 'Loan Approved',
        body: `Your loan request for NGN ${loan.amount} has been approved and disbursed to your wallet.`
      }).catch(err => logger.warn(`Loan approval email failed: ${err.message}`));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reject loan
// @route   PATCH /api/v1/admin/loans/:id/reject
exports.rejectLoan = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const loan = await Loan.findById(req.params.id);
    if (!loan || loan.status !== 'pending') return res.status(404).json({ success: false, message: 'Pending loan not found' });
    await Loan.updateRaw(loan.id, { status: 'rejected', rejectionReason: reason, approvedBy: req.user.id });

    // Send loan rejection notification
    try {
      await Notification.create({
        user: loan.user,
        title: 'Loan Rejected',
        body: `Your loan request for NGN ${loan.amount} was rejected. Reason: ${reason || 'N/A'}`,
        type: 'loan',
        data: { loanId: loan.id, reason }
      });
    } catch (e) {}

    // Send loan rejection email
    const [urRows] = await pool.query('SELECT first_name, email FROM users WHERE id = ?', [loan.user]);
    if (urRows.length > 0) {
      sendGenericNotificationEmail(urRows[0].email, urRows[0].first_name, {
        title: 'Loan Rejected',
        body: `Your loan request for NGN ${loan.amount} was rejected. Reason: ${reason || 'N/A'}`
      }).catch(err => logger.warn(`Loan rejection email failed: ${err.message}`));
    }
    res.status(200).json({ success: true, message: 'Loan rejected', data: loan });
  } catch (error) {
    next(error);
  }
};

// @desc    Send manual notification (admin)
// @route   POST /api/v1/admin/notifications
exports.sendNotification = async (req, res, next) => {
  try {
    const { userId, title, body, type = 'system', broadcast = false, target } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    // Handle target-based notifications
    const shouldBroadcast = broadcast || (target && target !== 'individual');

    if (shouldBroadcast) {
      // Build query based on target
      let query = 'SELECT id FROM users WHERE 1=1';
      const params = [];

      if (target === 'active') {
        query += ' AND is_active = 1 AND last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      } else if (target === 'business') {
        query += ' AND is_business = 1';
      } else {
        // 'all' or default broadcast
        query += ' AND role = "user"';
      }

      const [users] = await pool.query(query, params);
      const notifications = users.map(u => ({
        user: u.id,
        title,
        body,
        type,
        data: { isAdmin: true }
      }));
      
      // We can't use insertMany here because create() handles socket emission
      // For broadcast, we should probably loop or implement a broadcast socket emitter
      for (const n of notifications) {
        const fullNotif = await Notification.create(n);
        // Send individual email in broadcast loop
        const [u] = await pool.query('SELECT first_name, email FROM users WHERE id = ?', [n.user]);
        if (u.length > 0) {
          sendGenericNotificationEmail(u[0].email, u[0].first_name, { title, body }).catch(e => {});
        }
      }
      
      res.status(201).json({ success: true, message: `Notification sent to ${users.length} users` });
    } else {
      if (!userId) return res.status(400).json({ success: false, message: 'UserID is required for individual notifications' });
      const notification = await Notification.create({
        user: userId,
        title,
        body,
        type,
        data: { isAdmin: true }
      });

      // Send email
      const [u] = await pool.query('SELECT first_name, email FROM users WHERE id = ?', [userId]);
      if (u.length > 0) {
        sendGenericNotificationEmail(u[0].email, u[0].first_name, { title, body }).catch(e => {});
      }
      res.status(201).json({ success: true, data: notification });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard analytics data
// @route   GET /api/v1/admin/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    // 1. Revenue & Transaction volume over time
    const [revenueRows] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(CASE WHEN status IN ('completed', 'success') THEN fee ELSE 0 END) as revenue,
        SUM(CASE WHEN status IN ('completed', 'success') THEN amount ELSE 0 END) as volume
      FROM transactions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [days]
    );

    // 2. User growth over time
    const [userGrowthRows] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE role = 'user' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [days]
    );

    // 3. Transaction status breakdown
    const [statusRows] = await pool.query(
      `SELECT status, COUNT(*) as count 
      FROM transactions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY status`,
      [days]
    );

    // 4. Transaction type breakdown
    const [typeRows] = await pool.query(
      `SELECT type, COUNT(*) as count 
      FROM transactions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY type`,
      [days]
    );

    res.status(200).json({
      success: true,
      data: {
        revenue: revenueRows,
        userGrowth: userGrowthRows,
        statusBreakdown: statusRows,
        typeBreakdown: typeRows,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent platform activity
// @route   GET /api/v1/admin/recent-activity
exports.getRecentActivity = async (req, res, next) => {
  try {
    // Combine recent users, transactions, and loans into a single feed
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, created_at, "user_registration" as type FROM users WHERE role = "user" ORDER BY created_at DESC LIMIT 5'
    );
    const [transactions] = await pool.query(
      'SELECT id, reference, amount, type as txn_type, status, created_at, "transaction" as type FROM transactions ORDER BY created_at DESC LIMIT 5'
    );
    const [loans] = await pool.query(
      'SELECT id, reference, amount, status, created_at, "loan_request" as type FROM loans ORDER BY created_at DESC LIMIT 5'
    );

    const activity = [...users, ...transactions, ...loans]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};
