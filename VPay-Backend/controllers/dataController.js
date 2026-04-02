const Data = require('../models/Data');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const generateReference = require('../utils/generateReference');
const { getDataPlans, buyData } = require('../services/dataService');
const { sendTransactionEmail } = require('../services/emailService');
const { paginate, paginationMeta } = require('../utils/helpers');

// @desc    Get data plans
// @route   GET /api/v1/data/plans/:network
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await getDataPlans(req.params.network);
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// @desc    Buy data
// @route   POST /api/v1/data/buy
exports.buyData = async (req, res, next) => {
  try {
    const { phone, network, paymentCode, planName, amount, dataSize, validity, pin, walletType = 'personal' } = req.body;

    const user = await require('../models/User').findById(req.user.id);
    if (!user.hasPIN) return res.status(400).json({ success: false, message: 'Please set up a transaction PIN in your profile first' });
    const isPinValid = await user.comparePIN(pin);
    if (!isPinValid) return res.status(401).json({ success: false, message: 'Invalid transaction PIN' });

    const wallet = await Wallet.findOne({ user: req.user.id, walletType });
    if (!wallet) return res.status(400).json({ success: false, message: 'Wallet not found' });

    const sufficient = await Wallet.hasSufficientBalance(wallet.id, amount);
    if (!sufficient) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const balanceBefore = wallet.balance;
    const reference = generateReference('VPY-DAT');
    const providerResult = await buyData({ phone, network, paymentCode, amount, reference });

    // Atomic debit
    const updatedWallet = await Wallet.atomicDebit(wallet.id, amount);

    const data = await Data.create({
      user: req.user.id,
      reference,
      phone,
      network,
      planId: paymentCode,
      planName,
      amount,
      dataSize,
      validity,
      status: 'completed',
      providerReference: providerResult?.transactionId,
      completedAt: new Date(),
    });

    await Transaction.create({
      reference,
      user: req.user.id,
      type: 'debit',
      category: 'data',
      amount,
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      description: `${network.toUpperCase()} Data ${dataSize || ''} - ${phone}`,
      status: 'completed',
      completedAt: new Date(),
    });

    // Send payment notification
    try {
      await Notification.create({
        user: req.user.id,
        title: 'Data Purchase Successful',
        body: `You have successfully purchased ${network.toUpperCase()} Data ${dataSize || ''} for ${phone}.`,
        type: 'transaction',
        data: { reference, phone, network, amount, dataSize }
      });
    } catch (notifErr) {
      // Non-blocking
    }

    // Send payment email
    sendTransactionEmail(user.email, user.firstName, {
      type: 'debit',
      amount,
      reference,
      description: `${network.toUpperCase()} Data ${dataSize || ''} - ${phone}`
    }).catch(e => {});

    res.status(200).json({ success: true, message: 'Data purchased successfully', data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get data history
// @route   GET /api/v1/data
exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip } = paginate(page, limit);
    const [records, total] = await Promise.all([
      Data.find({ user: req.user.id }, { limit: parseInt(limit), skip }),
      Data.countDocuments({ user: req.user.id }),
    ]);
    res.status(200).json({ success: true, data: records, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};
