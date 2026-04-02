const { pool } = require('../config/database');

const BusinessAnalytics = {
  async getOverview(userId) {
    // Get business transactions summary
    const [transactions] = await pool.query(
      `SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as totalExpenses,
        SUM(CASE WHEN type = 'credit' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN amount ELSE 0 END) as monthlyIncome,
        SUM(CASE WHEN type = 'debit' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN amount ELSE 0 END) as monthlyExpenses
       FROM transactions
       WHERE user_id = ?`,
      [userId]
    );

    // Get customer count (unique recipients)
    const [customers] = await pool.query(
      `SELECT COUNT(DISTINCT recipient_account) as uniqueCustomers
       FROM transactions
       WHERE user_id = ? AND type = 'credit'`,
      [userId]
    );

    // Get average transaction value
    const [avgTransaction] = await pool.query(
      `SELECT AVG(amount) as avgTransactionValue
       FROM transactions
       WHERE user_id = ? AND type = 'credit'`,
      [userId]
    );

    return {
      totalTransactions: transactions[0].totalTransactions || 0,
      totalIncome: parseFloat(transactions[0].totalIncome || 0),
      totalExpenses: parseFloat(transactions[0].totalExpenses || 0),
      monthlyIncome: parseFloat(transactions[0].monthlyIncome || 0),
      monthlyExpenses: parseFloat(transactions[0].monthlyExpenses || 0),
      netProfit: parseFloat(transactions[0].totalIncome || 0) - parseFloat(transactions[0].totalExpenses || 0),
      uniqueCustomers: customers[0].uniqueCustomers || 0,
      avgTransactionValue: parseFloat(avgTransaction[0].avgTransactionValue || 0),
    };
  },

  async getMonthlyTrends(userId, months = 6) {
    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as expenses,
        COUNT(*) as transactions
       FROM transactions
       WHERE user_id = ? 
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`,
      [userId, months]
    );

    return rows.map((row) => ({
      month: row.month,
      income: parseFloat(row.income || 0),
      expenses: parseFloat(row.expenses || 0),
      profit: parseFloat(row.income || 0) - parseFloat(row.expenses || 0),
      transactions: row.transactions,
    }));
  },

  async getTopCustomers(userId, limit = 10) {
    const [rows] = await pool.query(
      `SELECT 
        recipient_account,
        recipient_name,
        COUNT(*) as transactionCount,
        SUM(amount) as totalSpent,
        MAX(created_at) as lastTransaction
       FROM transactions
       WHERE user_id = ? 
       AND type = 'credit'
       AND recipient_account IS NOT NULL
       GROUP BY recipient_account, recipient_name
       ORDER BY totalSpent DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map((row) => ({
      customerId: row.recipient_account,
      customerName: row.recipient_name,
      transactionCount: row.transactionCount,
      totalSpent: parseFloat(row.totalSpent || 0),
      lastTransaction: row.lastTransaction,
    }));
  },

  async getCategoryBreakdown(userId) {
    const [rows] = await pool.query(
      `SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
       FROM transactions
       WHERE user_id = ? 
       AND category IS NOT NULL
       GROUP BY category
       ORDER BY total DESC`,
      [userId]
    );

    return rows.map((row) => ({
      category: row.category || 'Uncategorized',
      count: row.count,
      total: parseFloat(row.total || 0),
    }));
  },

  async getRecentActivity(userId, limit = 20) {
    const [rows] = await pool.query(
      `SELECT 
        id,
        type,
        amount,
        description,
        recipient_name,
        status,
        created_at
       FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount || 0),
      description: row.description,
      recipientName: row.recipient_name,
      status: row.status,
      createdAt: row.created_at,
    }));
  },

  async getGrowthRate(userId) {
    const [rows] = await pool.query(
      `SELECT 
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN amount ELSE 0 END) as currentMonth,
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) 
                  AND DATE(created_at) < DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN amount ELSE 0 END) as previousMonth
       FROM transactions
       WHERE user_id = ? AND type = 'credit'`,
      [userId]
    );

    const current = parseFloat(rows[0].currentMonth || 0);
    const previous = parseFloat(rows[0].previousMonth || 0);
    const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      currentMonth: current,
      previousMonth: previous,
      growthRate: parseFloat(growthRate.toFixed(2)),
      trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
    };
  },
};

module.exports = BusinessAnalytics;
