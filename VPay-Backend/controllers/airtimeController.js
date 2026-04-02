const Airtime = require('../models/Airtime');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const generateReference = require('../utils/generateReference');
const { buyAirtime } = require('../services/airtimeService');
const { sendTransactionEmail } = require('../services/emailService');
const { paginate, paginationMeta } = require('../utils/helpers');

// @desc    Buy airtime
// @route   POST /api/v1/airtime/buy
exports.buyAirtime = async (req, res, next) => {
  try {
    const { phone, network, amount, pin, walletType = 'personal' } = req.body;

    const user = await User.findById(req.user.id);
    if (!user.hasPIN) return res.status(400).json({ success: false, message: 'Please set up a transaction PIN in your profile first' });
    const isPinValid = await user.comparePIN(pin);
    if (!isPinValid) return res.status(401).json({ success: false, message: 'Invalid transaction PIN' });

    const wallet = await Wallet.findOne({ user: req.user.id, walletType });
    if (!wallet) return res.status(400).json({ success: false, message: 'Wallet not found' });

    const sufficient = await Wallet.hasSufficientBalance(wallet.id, amount);
    if (!sufficient) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const balanceBefore = wallet.balance;
    const reference = generateReference('VPY-AIR');
    const providerResult = await buyAirtime({ phone, network, amount, reference });

    // Atomic debit — no race condition
    const updatedWallet = await Wallet.atomicDebit(wallet.id, amount);

    const airtime = await Airtime.create({
      user: req.user.id,
      reference,
      phone,
      network,
      amount,
      status: 'completed',
      providerReference: providerResult?.requestId,
      completedAt: new Date(),
    });

    await Transaction.create({
      reference,
      user: req.user.id,
      type: 'debit',
      category: 'airtime',
      amount,
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      description: `${network.toUpperCase()} Airtime - ${phone}`,
      status: 'completed',
      completedAt: new Date(),
    });

    // Send payment notification
    try {
      await Notification.create({
        user: req.user.id,
        title: 'Airtime Purchase Successful',
        body: `You have successfully purchased ${amount} ${network.toUpperCase()} airtime for ${phone}.`,
        type: 'transaction',
        data: { reference, phone, network, amount }
      });
    } catch (notifErr) {
      // Non-blocking
    }

    // Send payment email
    sendTransactionEmail(user.email, user.first_name, {
      type: 'debit',
      amount,
      reference,
      description: `${network.toUpperCase()} Airtime - ${phone}`
    }).catch(e => {});

    res.status(200).json({ success: true, message: 'Airtime purchased successfully', data: airtime });
  } catch (error) {
    next(error);
  }
};

// @desc    Get airtime history
// @route   GET /api/v1/airtime
exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip } = paginate(page, limit);
    const [records, total] = await Promise.all([
      Airtime.find({ user: req.user.id }, { limit: parseInt(limit), skip }),
      Airtime.countDocuments({ user: req.user.id }),
    ]);
    res.status(200).json({ success: true, data: records, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};
