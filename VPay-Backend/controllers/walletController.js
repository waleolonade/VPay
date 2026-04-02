const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { getAccountEnquiry, simulateCredit, getAccountTransactions, createVirtualAccount } = require('../services/vfdWalletService');
const { initiateCardPayment, validateCardOtp, getCardPaymentStatus } = require('../services/vfdCardService');
const generateReference = require('../utils/generateReference');
const logger = require('../utils/logger');

// @desc    Get ALL wallets for the logged-in user (personal + business)
// @route   GET /api/v1/wallet
const getWallet = async (req, res, next) => {
  try {
    const { pool } = require('../config/database');
    const [rows] = await pool.query(
      'SELECT * FROM wallets WHERE user_id = ? ORDER BY wallet_type ASC',
      [req.user.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Wallet not found' });

    const wallets = rows.map((row) => ({
      id: row.id,
      balance: row.balance,
      currency: row.currency,
      accountNumber: row.account_number,
      accountName: row.account_name,
      bankName: row.bank_name || 'VPay MFB',
      walletType: row.wallet_type || 'personal',   // 'personal' | 'business'
      isActive: !!row.is_active,
      isFrozen: !!row.is_frozen,
      dailyLimit: row.daily_limit,
      transactionLimit: row.transaction_limit,
      totalCredit: row.total_credit,
      totalDebit: row.total_debit,
    }));

    // total balance across all wallets
    const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);

    res.status(200).json({ success: true, data: wallets, totalBalance });
  } catch (error) {
    next(error);
  }
};

// @desc    Fund wallet via card payment (VFD Cards API)
// @route   POST /api/v1/wallet/fund/card
const initCardFunding = async (req, res, next) => {
  try {
    const { amount, cardNumber, cardPin, cvv2, expiryDate, shouldTokenize = false, walletType = 'personal' } = req.body;
    const reference = generateReference('FUND');

    const result = await initiateCardPayment({
      amount,
      reference,
      cardNumber,
      cardPin,
      cvv2,
      expiryDate,
      shouldTokenize,
    });

    // Store a pending transaction record
    const wallet = await Wallet.findOne({ user: req.user.id, walletType });
    await Transaction.create({
      reference,
      user: req.user.id,
      type: 'credit',
      category: 'deposit',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: 'Wallet funding via card',
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      message: result.narration,
      data: {
        reference,
        requiresOtp: result.requiresOtp,
        redirectHtml: result.redirectHtml,
        code: result.code,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate OTP for card funding
// @route   POST /api/v1/wallet/fund/card/validate-otp
const validateCardFundingOtp = async (req, res, next) => {
  try {
    const { otp, reference } = req.body;
    const result = await validateCardOtp(otp, reference);
    res.status(200).json({ success: true, message: 'OTP validated', data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify card funding status and credit wallet if successful
// @route   POST /api/v1/wallet/fund/card/verify
const verifyCardFunding = async (req, res, next) => {
  try {
    const { reference } = req.body;

    const existing = await Transaction.findOne({ reference });
    if (existing && existing.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }

    const payment = await getCardPaymentStatus(reference);
    if (payment.transactionStatus !== '00') {
      return res.status(400).json({ success: false, message: 'Payment not successful', status: payment.transactionStatus });
    }

    const amount = parseFloat(payment.amount);
    // Find the wallet that was intended to be funded. 
    // Wait, the transaction record should have the wallet info.
    // For now, we'll try to find the wallet that matches the transaction metadata if we added it.
    // Otherwise, we fallback to personal.
    const wallet = await Wallet.findOne({ user: req.user.id, walletType: existing.metadata?.walletType || 'personal' });

    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    wallet.totalCredit += amount;
    await wallet.save();

    await Transaction.findOneAndUpdate(
      { reference },
      {
        status: 'completed',
        balanceAfter: wallet.balance,
        completedAt: new Date(),
      },
      { upsert: false }
    );

    res.status(200).json({ success: true, message: 'Wallet funded successfully', data: { balance: wallet.balance } });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate inward credit (DEV/test only)
// @route   POST /api/v1/wallet/fund/simulate  (only available in non-production)
const simulateFunding = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not available in production' });
  }
  try {
    const { amount } = req.body;
    const wallet = await Wallet.findOne({ user: req.user.id });
    const poolAccount = await getAccountEnquiry();

    await simulateCredit({ amount, accountNo: poolAccount.accountNo });

    res.status(200).json({
      success: true,
      message: 'Simulation triggered. Wallet will be credited via webhook.',
      data: { poolAccountNo: poolAccount.accountNo, amount },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate bank-transfer funding (creates pending record, returns reference + pool account)
// @route   POST /api/v1/wallet/fund/bank
const initBankFunding = async (req, res, next) => {
  try {
    const { amount, walletType = 'personal' } = req.body;
    const reference = generateReference('BANK-FUND');

    const wallet = await Wallet.findOne({ user: req.user.id, walletType });
    const poolAccount = await getAccountEnquiry();

    await Transaction.create({
      reference,
      user: req.user.id,
      type: 'credit',
      category: 'deposit',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: `Wallet funding (${wallet.walletType}) via bank transfer`,
      status: 'pending',
      metadata: { walletType: wallet.walletType }
    });

    res.status(200).json({
      success: true,
      message: 'Use the reference as your transfer narration',
      data: {
        reference,
        bankName: 'VFD Microfinance Bank',
        accountNumber: poolAccount.accountNo,
        accountName: poolAccount.client,
        bankCode: '090110',
        amount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed wallet aggregates
// @route   GET /api/v1/wallet/details
const getWalletDetails = async (req, res, next) => {
  try {
    const { pool } = require('../config/database');
    let [rows] = await pool.query(
      'SELECT * FROM wallets WHERE user_id = ? ORDER BY wallet_type ASC',
      [req.user.id]
    );

    let personalWallet = rows.find(w => w.wallet_type === 'personal') || rows[0];
    let businessWallet = rows.find(w => w.wallet_type === 'business');

    // Auto-create personal wallet if missing
    if (!personalWallet) {
      const { v4: uuidv4 } = require('uuid');
      const [userRows] = await pool.query('SELECT first_name, last_name FROM users WHERE id = ?', [req.user.id]);
      const user = userRows[0];
      const fullName = user ? `${user.first_name} ${user.last_name}` : 'VPay User';
      const [result] = await pool.query(
        `INSERT INTO wallets (user_id, account_number, account_name, bank_name, wallet_type, balance, daily_limit, transaction_limit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, Math.floor(1000000000 + Math.random() * 9000000000), fullName, 'VPay MFB', 'personal', 0, 500000, 200000]
      );
      [rows] = await pool.query(
        'SELECT * FROM wallets WHERE user_id = ? ORDER BY wallet_type ASC',
        [req.user.id]
      );
      personalWallet = rows.find(w => w.wallet_type === 'personal') || rows[0];
    }

    const personalBalance = parseFloat(personalWallet.balance || 0);
    const businessBalance = parseFloat(businessWallet?.balance || 0);
    const totalBalance = personalBalance + businessBalance;

    res.status(200).json({
      success: true,
      data: {
        totalBalance,
        personalBalance,
        businessBalance,
        availableBalance: personalBalance, // Default to personal
        ledgerBalance: personalBalance,
        bonusBalance: 0,
        accounts: [
          {
            id: '1',
            bankName: personalWallet.bank_name || 'VPay MFB',
            accountNumber: personalWallet.account_number,
            accountName: personalWallet.account_name,
            type: 'personal',
            balance: personalBalance
          },
          ...(businessWallet ? [{
            id: '2',
            bankName: businessWallet.bank_name || 'VPay MFB',
            accountNumber: businessWallet.account_number,
            accountName: businessWallet.account_name,
            type: 'business',
            balance: businessBalance
          }] : [])
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Business Profile (Activation)
// @route   PUT /api/v1/wallet/business/profile
const updateBusinessProfile = async (req, res, next) => {
  try {
    const { businessName, businessCategory, cacNumber, cacCertificate } = req.body;
    const { pool } = require('../config/database');

    let [result] = await pool.query(
      'UPDATE wallets SET account_name = ?, cac_number = ?, cac_certificate = ? WHERE user_id = ? AND wallet_type = "business"',
      [businessName, cacNumber, cacCertificate, req.user.id]
    );

    if (result.affectedRows === 0) {
      // Fail-safe: Create missing business wallet for legacy users
      const { generateBusinessAccountNumber } = require('../utils/helpers');
      const [userRows] = await pool.query('SELECT first_name, last_name FROM users WHERE id = ?', [req.user.id]);
      const user = userRows[0];
      const fullName = `${user.first_name} ${user.last_name} Business`;

      await pool.query(
        `INSERT INTO wallets (user_id, account_number, account_name, bank_name, wallet_type, balance, daily_limit, transaction_limit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, generateBusinessAccountNumber(), businessName || fullName, 'VPay MFB', 'business', 0, 1000000, 500000]
      );
      
      // Update with CAC details after creation (or just include them in INSERT, but this is cleaner as a re-run)
      await pool.query(
        'UPDATE wallets SET cac_number = ?, cac_certificate = ? WHERE user_id = ? AND wallet_type = "business"',
        [cacNumber, cacCertificate, req.user.id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Business profile updated successfully',
      data: { businessName, businessCategory, cacNumber, cacCertificate }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Account Statement from VFD
// @route   GET /api/v1/wallet/statement
const getVfdStatement = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 0, size = 50 } = req.query;
    
    // Get user's pool account (or specific wallet account if applicable)
    // For VPay architecture, we use the main pool account to track VFD txns
    const poolAccount = await getAccountEnquiry();

    const transactions = await getAccountTransactions({
      accountNo: poolAccount.accountNo,
      startDate,
      endDate,
      transactionType: 'wallet',
      page,
      size
    });

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a dynamic Virtual Account for funding
// @route   POST /api/v1/wallet/fund/virtual
const generateVirtualAccountDetails = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const reference = generateReference('V-FUND');
    const merchantName = `${req.user.firstName} ${req.user.lastName}`;
    
    // Create virtual account valid for 1 hour (60 mins)
    const result = await createVirtualAccount({
      amount,
      merchantName,
      merchantId: req.user.id.substring(0, 10), // Limit length if needed
      reference,
      validityTime: '60' 
    });

    // Store a pending transaction record
    const wallet = await Wallet.findOne({ user: req.user.id, walletType: 'personal' });
    if (wallet) {
      await Transaction.create({
        reference: result.reference || reference,
        user: req.user.id,
        type: 'credit',
        category: 'deposit',
        amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        description: 'Wallet funding via Dynamic Virtual Account',
        status: 'pending',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Virtual account generated successfully',
      data: {
        accountNumber: result.accountNumber,
        reference: result.reference || reference,
        bankName: 'VFD Microfinance Bank',
        validityMinutes: 60,
        amount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWallet,
  initBankFunding,
  initCardFunding,
  validateCardFundingOtp,
  verifyCardFunding,
  simulateFunding,
  getWalletDetails,
  getVfdStatement,
  generateVirtualAccountDetails,
  updateBusinessProfile,
  // Legacy alias kept for backwards compat if referenced elsewhere
  initFundWallet: initCardFunding,
  verifyFunding: verifyCardFunding,
};
