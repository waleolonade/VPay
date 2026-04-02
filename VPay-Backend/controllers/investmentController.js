const Investment = require('../models/Investment');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const generateReference = require('../utils/generateReference');
const { calculateSimpleInterest } = require('../utils/calculateInterest');
const { paginate, paginationMeta } = require('../utils/helpers');

const INVESTMENT_PLANS = [
  { name: 'Basic', returnRate: 0.08, minAmount: 5000, duration: 90 },
  { name: 'Premium', returnRate: 0.12, minAmount: 50000, duration: 180 },
  { name: 'Elite', returnRate: 0.18, minAmount: 200000, duration: 365 },
];

// @desc    Get investment plans
// @route   GET /api/v1/investments/plans
exports.getPlans = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: INVESTMENT_PLANS });
  } catch (error) {
    next(error);
  }
};

// @desc    Create investment
// @route   POST /api/v1/investments
exports.createInvestment = async (req, res, next) => {
  try {
    const { planName, amount } = req.body;
    const plan = INVESTMENT_PLANS.find((p) => p.name === planName);
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid investment plan' });
    if (amount < plan.minAmount) {
      return res.status(400).json({ success: false, message: `Minimum investment is ₦${plan.minAmount}` });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + plan.duration);
    const expectedReturns = calculateSimpleInterest(amount, plan.returnRate, plan.duration);

    wallet.balance -= amount;
    wallet.totalDebit += amount;
    await wallet.save();

    const investment = await Investment.create({
      user: req.user.id,
      reference: generateReference('VPY-INV'),
      planName,
      amount,
      currentValue: amount,
      returnRate: plan.returnRate,
      duration: plan.duration,
      maturityDate,
    });

    await Transaction.create({
      reference: generateReference('VPY-INVF'),
      user: req.user.id,
      type: 'debit',
      category: 'investment',
      amount,
      balanceBefore: wallet.balance + amount,
      balanceAfter: wallet.balance,
      description: `Investment: ${planName} plan`,
      status: 'completed',
      completedAt: new Date(),
    });

    res.status(201).json({ success: true, message: 'Investment created', data: { investment, expectedReturns } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get investments
// @route   GET /api/v1/investments
exports.getInvestments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip } = paginate(page, limit);
    const [investments, total] = await Promise.all([
      Investment.find({ user: req.user.id }, { limit: parseInt(limit), skip }),
      Investment.countDocuments({ user: req.user.id }),
    ]);
    res.status(200).json({ success: true, data: investments, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw matured investment
// @route   POST /api/v1/investments/:id/withdraw
exports.withdrawInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findOne({ id: req.params.id, user: req.user.id });
    if (!investment) return res.status(404).json({ success: false, message: 'Investment not found' });
    if (investment.status !== 'matured') {
      return res.status(400).json({ success: false, message: 'Investment has not matured yet' });
    }

    const returns = calculateSimpleInterest(investment.amount, investment.returnRate, investment.duration);
    const total = investment.amount + returns;

    const wallet = await Wallet.findOne({ user: req.user.id });
    wallet.balance += total;
    wallet.totalCredit += total;
    await wallet.save();

    investment.status = 'withdrawn';
    investment.returns = returns;
    await investment.save();

    await Transaction.create({
      reference: generateReference('VPY-INVW'),
      user: req.user.id,
      type: 'credit',
      category: 'investment',
      amount: total,
      balanceBefore: wallet.balance - total,
      balanceAfter: wallet.balance,
      description: `Investment withdrawal: ${investment.planName}`,
      status: 'completed',
      completedAt: new Date(),
    });

    res.status(200).json({ success: true, message: 'Investment withdrawn', data: { amount: investment.amount, returns, total } });
  } catch (error) {
    next(error);
  }
};
