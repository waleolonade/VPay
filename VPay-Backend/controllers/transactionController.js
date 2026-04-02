const Transaction = require('../models/Transaction');
const { pool } = require('../config/database');
const { paginate, paginationMeta } = require('../utils/helpers');

// @desc    Get user transactions
// @route   GET /api/v1/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, status, startDate, endDate } = req.query;
    const { skip } = paginate(page, limit);

    const filter = { user: req.user.id };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) filter.created_at.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter, { limit: parseInt(limit), skip }),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:reference
const getTransaction = async (req, res, next) => {
  try {
    const { reference } = req.params;

    // Try SQL first (as per professional standard)
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE (reference = ? OR id = ?) AND user_id = ?',
      [reference, reference, req.user.id]
    );

    if (rows.length > 0) {
      return res.status(200).json({ success: true, data: rows[0] });
    }

    // Fallback to Mongo for legacy support
    const transaction = await Transaction.findOne({ reference, user: req.user.id });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction summary (totals by type)
// @route   GET /api/v1/transactions/summary
const getTransactionSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ── Core totals ──────────────────────────────────────────────────────────
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
       FROM transactions WHERE user_id = ?`,
      [userId]
    );

    // ── Category breakdown (top 5 expense categories) ────────────────────────
    const [categories] = await pool.query(
      `SELECT category,
              COUNT(*) AS count,
              COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = ? AND type = 'debit' AND status IN ('completed','success')
       GROUP BY category ORDER BY total DESC LIMIT 5`,
      [userId]
    );

    // ── Last 6 months monthly summary ────────────────────────────────────────
    const [monthly] = await pool.query(
      `SELECT
         DATE_FORMAT(created_at, '%Y-%m') AS month,
         COALESCE(SUM(CASE WHEN type = 'credit' AND status IN ('completed','success') THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'debit'  AND status IN ('completed','success') THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        totalCredit:       Number(totals.totalCredit),
        totalDebit:        Number(totals.totalDebit),
        totalFees:         Number(totals.totalFees),
        netBalance:        Number(totals.totalCredit) - Number(totals.totalDebit),
        totalTransactions: Number(totals.totalTransactions),
        pendingCount:      Number(totals.pendingCount),
        failedCount:       Number(totals.failedCount),
        creditCount:       Number(totals.creditCount),
        debitCount:        Number(totals.debitCount),
        topCategories:     categories.map(c => ({ category: c.category, count: Number(c.count), total: Number(c.total) })),
        monthly:           monthly.map(m => ({ month: m.month, income: Number(m.income), expense: Number(m.expense) })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Finance Advisor — analyse user's transactions and give insights
// @route   POST /api/v1/transactions/ai-advice
const getAIAdvice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { question } = req.body; // Optional custom question from user

    // Pull last 30 transactions + summary for context
    const [[totals]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='credit' AND status IN ('completed','success') THEN amount ELSE 0 END),0) AS income,
         COALESCE(SUM(CASE WHEN type='debit'  AND status IN ('completed','success') THEN amount ELSE 0 END),0) AS expense
       FROM transactions WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );

    const [recentTxns] = await pool.query(
      `SELECT category, type, amount, description, narration, created_at
       FROM transactions WHERE user_id = ? AND status IN ('completed','success')
       ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );

    const [topSpend] = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) AS total
       FROM transactions WHERE user_id = ? AND type='debit' AND status IN ('completed','success')
       AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY category ORDER BY total DESC LIMIT 5`,
      [userId]
    );

    // Build AI prompt
    const incomeAmt  = Number(totals.income);
    const expenseAmt = Number(totals.expense);
    const savingsRate = incomeAmt > 0 ? Math.round(((incomeAmt - expenseAmt) / incomeAmt) * 100) : 0;

    const contextSummary = `
User's last 30 days:
- Income: ₦${incomeAmt.toLocaleString()}
- Expenses: ₦${expenseAmt.toLocaleString()}
- Savings Rate: ${savingsRate}%
- Top Spending Categories: ${topSpend.map(s => `${s.category} (₦${Number(s.total).toLocaleString()})`).join(', ')}
- Recent Transactions (last 30): ${recentTxns.map(t => `${t.type} ₦${t.amount} - ${t.category || t.description || t.narration}`).join('; ')}
`;

    const userQuestion = question || 'Give me a personalised financial health summary, spending insights, and 3 actionable tips to improve my finances.';

    const prompt = `You are VPay AI, a friendly Nigerian personal finance advisor built into the VPay app. 
Analyse the user's financial data below and respond in a helpful, encouraging tone. Use ₦ for currency. Keep response under 250 words. Structure with clear sections.

${contextSummary}

User's question: ${userQuestion}`;

    // Use Gemini API if key is set; otherwise return a rule-based fallback
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    let advice = '';

    if (GEMINI_KEY) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const geminiData = await geminiRes.json();
      advice = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Rule-based fallback if Gemini key is missing or response is empty
    if (!advice) {
      const tips = [];
      if (savingsRate < 20)  tips.push(`💡 You're saving ${savingsRate}% of income. Try to reach 20% by cutting top expenses.`);
      if (savingsRate >= 20) tips.push(`✅ Great job! You're saving ${savingsRate}% — keep it up!`);
      if (topSpend[0])       tips.push(`📊 Your biggest expense is "${topSpend[0].category}" at ₦${Number(topSpend[0].total).toLocaleString()}. Consider setting a budget cap.`);
      if (expenseAmt > incomeAmt) tips.push('⚠️ Your expenses exceeded income this month. Review unnecessary subscriptions or transfers.');
      tips.push('📱 Set up automatic savings in your VPay Savings wallet to build a financial cushion.');

      advice = `💰 Financial Summary (Last 30 Days)\n\nIncome: ₦${incomeAmt.toLocaleString()}\nExpenses: ₦${expenseAmt.toLocaleString()}\nSavings Rate: ${savingsRate}%\n\n🎯 Personalised Tips:\n${tips.join('\n')}`;
    }

    res.status(200).json({ success: true, data: { advice, savingsRate, income: incomeAmt, expense: expenseAmt } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions, getTransaction, getTransactionSummary, getAIAdvice };

