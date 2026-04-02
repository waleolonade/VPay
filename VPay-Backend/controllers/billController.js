const Bill = require('../models/Bill');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const generateReference = require('../utils/generateReference');
const { verifyBill, payBill, getBillerCategories, getBillerList, getBillerItems, getBillStatus } = require('../services/billService');
const { sendTransactionEmail } = require('../services/emailService');
const { paginate, paginationMeta } = require('../utils/helpers');
const { BILL_FEES } = require('../utils/constants');

const calculateBillFee = (billType) => {
  const type = (billType || '').toLowerCase();
  return BILL_FEES[type] !== undefined ? BILL_FEES[type] : BILL_FEES.default;
};

// @desc    Get biller categories
// @route   GET /api/v1/bills/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await getBillerCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('[Bills Controller] getCategories error:', error.message);
    console.error('[Bills Controller] Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    next(error);
  }
};

// @desc    Get billers (optionally filtered by category)
// @route   GET /api/v1/bills/billers
exports.getBillers = async (req, res, next) => {
  try {
    const { category } = req.query;
    const billers = await getBillerList(category);
    res.status(200).json({ success: true, data: billers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get biller items/products
// @route   GET /api/v1/bills/billers/:billerId/items
exports.getBillerItems = async (req, res, next) => {
  try {
    const { billerId } = req.params;
    const { divisionId, productId } = req.query;
    const items = await getBillerItems(billerId, divisionId, productId);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify customer number
// @route   POST /api/v1/bills/verify
exports.verifyCustomer = async (req, res, next) => {
  try {
    const { billerId, customerNumber, divisionId, paymentItem } = req.body;
    const result = await verifyBill(billerId, customerNumber, { divisionId, paymentItem });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Pay bill
// @route   POST /api/v1/bills/pay
exports.payBill = async (req, res, next) => {
  try {
    const { billerId, billerName, billType, customerNumber, customerName, division, paymentItem, productId, amount, pin, phoneNumber, walletType = 'personal' } = req.body;

    const sender = await require('../models/User').findById(req.user.id);
    if (!sender.hasPIN) return res.status(400).json({ success: false, message: 'Please set up a transaction PIN in your profile first' });
    const isPinValid = await sender.comparePIN(pin);
    if (!isPinValid) return res.status(401).json({ success: false, message: 'Invalid transaction PIN' });

    const wallet = await Wallet.findOne({ user: req.user.id, walletType });
    const numericAmount = Number(amount);
    const fee = calculateBillFee(billType);
    const totalDeduction = numericAmount + fee;

    const sufficient = await Wallet.hasSufficientBalance(wallet.id, totalDeduction);
    if (!sufficient) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const balanceBefore = wallet.balance;
    const reference = generateReference('VPY-BILL');
    const providerResult = await payBill({ billerId, customerNumber, division, paymentItem, productId, amount: numericAmount, reference, phoneNumber });

    // Atomic debit: balance reduced by (amount+fee), total_debit increased by base amount only
    const updatedWallet = await Wallet.atomicDebit(wallet.id, numericAmount, fee);

    const bill = await Bill.create({
      user: req.user.id,
      reference,
      billType,
      billerId,
      billerName,
      customerName,
      customerNumber,
      amount: numericAmount,
      fee,
      division,
      paymentItem,
      productId,
      status: providerResult?.success ? 'completed' : 'pending',
      providerReference: providerResult?.reference || null,
      token: providerResult?.token || null,
      completedAt: providerResult?.success ? new Date() : null,
    });

    await Transaction.create({
      reference,
      user: req.user.id,
      type: 'debit',
      category: 'bill',
      amount: numericAmount,
      fee,
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      description: `${billerName} - ${customerNumber}`,
      status: providerResult?.success ? 'completed' : 'pending',
      completedAt: providerResult?.success ? new Date() : null,
      provider: 'VFD',
      providerReference: providerResult?.reference || null,
    });

    // Send payment notification
    try {
      await Notification.create({
        user: req.user.id,
        title: 'Bill Payment Successful',
        body: `You have successfully paid ${amount} for ${billerName} (${customerNumber}).`,
        type: 'transaction',
        data: { reference, billerName, amount }
      });
    } catch (notifErr) {
      // Non-blocking
    }

    // Send payment email
    sendTransactionEmail(sender.email, sender.first_name, {
      type: 'debit',
      amount: numericAmount,
      reference,
      description: `${billerName} - ${customerNumber}`
    }).catch(e => {});

    res.status(200).json({ success: true, message: 'Bill payment successful', data: bill });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bill transaction status
// @route   GET /api/v1/bills/status/:transactionId
exports.getBillStatus = async (req, res, next) => {
  try {
    const result = await getBillStatus(req.params.transactionId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bill history
// @route   GET /api/v1/bills
exports.getBills = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip } = paginate(page, limit);
    const [bills, total] = await Promise.all([
      Bill.find({ user: req.user.id }, { limit: parseInt(limit), skip }),
      Bill.countDocuments({ user: req.user.id }),
    ]);
    res.status(200).json({ success: true, data: bills, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};
