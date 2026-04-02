const Savings = require('../models/Savings');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const generateReference = require('../utils/generateReference');
const { calculateSimpleInterest } = require('../utils/calculateInterest');
const { SAVINGS_INTEREST_RATE } = require('../utils/constants');
const { paginate, paginationMeta } = require('../utils/helpers');

// @desc    Create savings plan
// @route   POST /api/v1/savings
exports.createPlan = async (req, res, next) => {
  try {
    const { planName, targetAmount, frequency, autoSaveAmount, isAutoSave, autoSaveRule, ruleValue, maturityDate } = req.body;

    const savings = await Savings.create({
      user: req.user.id,
      reference: generateReference('VPY-SAV'),
      planName,
      targetAmount,
      frequency,
      interestRate: SAVINGS_INTEREST_RATE,
      autoSaveAmount: isAutoSave ? autoSaveAmount : 0,
      autoSaveRule,
      ruleValue,
      isAutoSave: !!isAutoSave,
      maturityDate,
    });

    res.status(201).json({ success: true, message: 'Savings plan created', data: savings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get savings plans
// @route   GET /api/v1/savings
exports.getPlans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip } = paginate(page, limit);
    const [plans, total] = await Promise.all([
      Savings.find({ user: req.user.id }, { limit: parseInt(limit), skip }),
      Savings.countDocuments({ user: req.user.id }),
    ]);
    res.status(200).json({ success: true, data: plans, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single savings plan by ID
// @route   GET /api/v1/savings/:id
exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await Savings.findOne({ id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ success: false, message: 'Savings plan not found' });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// @desc    Fund savings plan
// @route   POST /api/v1/savings/:id/fund
exports.fundPlan = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const savings = await Savings.findOne({ id: req.params.id, user: req.user.id, status: 'active' });
    if (!savings) return res.status(404).json({ success: false, message: 'Active savings plan not found' });

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    // ATOMIC DEBIT (Wallet -> Savings)
    await Wallet.atomicDebit(wallet.id, amount);

    savings.currentBalance += amount;
    if (savings.currentBalance >= savings.targetAmount) {
      savings.status = 'completed';
      savings.completedAt = new Date();
    }
    await savings.save();

    await Transaction.create({
      reference: generateReference('VPY-SAVF'),
      user: req.user.id,
      type: 'debit',
      category: 'savings',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance - amount,
      description: `Savings: ${savings.planName}`,
      status: 'completed',
      completedAt: new Date(),
    });

    // Notify via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('balance_updated', {
        walletType: wallet.walletType,
        newBalance: wallet.balance - amount
      });
    }

    res.status(200).json({ success: true, message: 'Savings funded', data: savings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get savings summary
// @route   GET /api/v1/savings/summary
exports.getSummary = async (req, res, next) => {
  try {
    const summary = await Savings.getSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw from savings
// @route   POST /api/v1/savings/:id/withdraw
exports.withdrawPlan = async (req, res, next) => {
  try {
    const savings = await Savings.findOne({ id: req.params.id, user: req.user.id });
    if (!savings || savings.currentBalance <= 0) {
      return res.status(400).json({ success: false, message: 'No balance to withdraw' });
    }

    const amount = savings.currentBalance;
    const interest = calculateSimpleInterest(savings.currentBalance, savings.interestRate, 30);
    const total = amount + interest;

    const wallet = await Wallet.findOne({ user: req.user.id });
    
    // ATOMIC CREDIT (Savings -> Wallet)
    await Wallet.atomicCredit(wallet.id, total);

    savings.currentBalance = 0;
    savings.interestEarned += interest;
    savings.status = 'broken';
    await savings.save();

    await Transaction.create({
      reference: generateReference('VPY-SAVW'),
      user: req.user.id,
      type: 'credit',
      category: 'savings',
      amount: total,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + total,
      description: `Savings withdrawal: ${savings.planName}`,
      status: 'completed',
      completedAt: new Date(),
    });

    // Notify via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('balance_updated', {
        walletType: wallet.walletType,
        newBalance: wallet.balance + total
      });
    }

    res.status(200).json({ success: true, message: 'Withdrawal successful', data: { amount, interest, total } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update auto-save settings
// @route   PATCH /api/v1/savings/:id/auto-save
exports.updateAutoSave = async (req, res, next) => {
  try {
    const { isAutoSave, autoSaveAmount, frequency } = req.body;
    const savings = await Savings.findOne({ id: req.params.id, user: req.user.id });
    if (!savings) return res.status(404).json({ success: false, message: 'Plan not found' });

    await Savings.updateRaw(savings.id, {
      is_auto_save: isAutoSave ? 1 : 0,
      auto_save_amount: autoSaveAmount || 0,
      frequency: frequency || savings.frequency,
    });

    const updated = await Savings.findOne({ id: savings.id });
    res.status(200).json({ success: true, message: 'Auto-save settings updated', data: updated });
  } catch (error) {
    next(error);
  }
};
