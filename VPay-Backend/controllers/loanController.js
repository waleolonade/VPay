const Loan = require('../models/Loan');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const generateReference = require('../utils/generateReference');
const { checkLoanEligibility, calculateLoanOffer } = require('../services/loanService');
const { paginate, paginationMeta } = require('../utils/helpers');

// @desc    Check loan eligibility
// @route   GET /api/v1/loans/eligibility
exports.checkEligibility = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    const result = checkLoanEligibility(req.user, wallet);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate loan offer
// @route   POST /api/v1/loans/calculate
exports.calculateLoan = async (req, res, next) => {
  try {
    const { amount, duration } = req.body;
    const offer = calculateLoanOffer(amount, duration);
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply for loan
// @route   POST /api/v1/loans/apply
exports.applyLoan = async (req, res, next) => {
  try {
    const { amount, duration, purpose } = req.body;
    const wallet = await Wallet.findOne({ user: req.user.id });
    const eligibility = checkLoanEligibility(req.user, wallet);

    if (!eligibility.eligible) {
      return res.status(403).json({ success: false, message: eligibility.reason });
    }
    if (amount > eligibility.maxAmount) {
      return res.status(400).json({ success: false, message: `Maximum loan amount is ₦${eligibility.maxAmount}` });
    }

    const activeLoan = await Loan.findOne({ user: req.user.id, status: { $in: ['active', 'disbursed', 'pending', 'approved'] } });
    if (activeLoan) {
      return res.status(400).json({ success: false, message: 'You have an active loan application' });
    }

    const offer = calculateLoanOffer(amount, duration);
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + duration);

    const loan = await Loan.create({
      user: req.user.id,
      reference: generateReference('VPY-LN'),
      amount,
      interestRate: offer.interestRate,
      duration,
      totalRepayable: offer.totalRepayable,
      outstandingBalance: offer.totalRepayable,
      purpose,
      dueDate,
      status: 'disbursed', // Auto-disburse for UX in this upgrade
      disbursedAt: new Date(),
      repaymentSchedule: offer.schedule,
    });

    // ATOMIC DISBURSEMENT
    await Wallet.atomicCredit(wallet.id, amount);

    // Create Credit Transaction
    await Transaction.create({
      reference: generateReference('VPY-LNDISB'),
      user: req.user.id,
      type: 'credit',
      category: 'loan',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + amount,
      description: `Loan Disbursement: ${loan.reference}`,
      status: 'completed',
      completedAt: new Date(),
    });

    // Notify via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('balance_updated', {
        walletType: wallet.walletType,
        newBalance: wallet.balance + amount
      });
    }

    res.status(201).json({ success: true, message: 'Loan disbursed successfully', data: loan });
  } catch (error) {
    next(error);
  }
};

// @desc    Get loans
// @route   GET /api/v1/loans
exports.getLoans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    const { skip } = paginate(page, limit);
    const [loans, total] = await Promise.all([
      Loan.find(filter, { limit: parseInt(limit), skip }),
      Loan.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: loans, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Repay loan
// @route   POST /api/v1/loans/:id/repay
exports.repayLoan = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const loan = await Loan.findOne({ id: req.params.id, user: req.user.id });
    if (!loan || loan.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Active loan not found' });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    wallet.balance -= amount;
    wallet.totalDebit += amount;
    await wallet.save();

    loan.amountRepaid += amount;
    loan.outstandingBalance = Math.max(loan.totalRepayable - loan.amountRepaid, 0);
    if (loan.outstandingBalance === 0) {
      loan.status = 'completed';
      loan.completedAt = new Date();
    }
    await loan.save();

    await Transaction.create({
      reference: generateReference('VPY-LNRPY'),
      user: req.user.id,
      type: 'debit',
      category: 'loan',
      amount,
      balanceBefore: wallet.balance + amount,
      balanceAfter: wallet.balance,
      description: `Loan repayment - ${loan.reference}`,
      status: 'completed',
      completedAt: new Date(),
    });

    res.status(200).json({ success: true, message: 'Repayment recorded', data: loan });
  } catch (error) {
    next(error);
  }
};
