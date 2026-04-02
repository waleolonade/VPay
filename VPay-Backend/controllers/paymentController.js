const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { initiateTransfer, getTransactionStatus } = require('../services/vfdWalletService');
const { sendTransactionEmail } = require('../services/emailService');
const { verifyAccountNumber, getBanks } = require('../services/bankService');
const bankService = require('../services/bankService');
const generateReference = require('../utils/generateReference');
const { TRANSFER_FEE_TIERS } = require('../utils/constants');
const logger = require('../utils/logger');

const getTransferFee = (amount) => {
  for (const tier of TRANSFER_FEE_TIERS) {
    if (amount <= tier.max) return tier.fee;
  }
  return 50;
};

// @desc    Get list of supported banks (from VFD BaaS)
// @route   GET /api/v1/payments/banks
const getBankList = async (req, res, next) => {
  try {
    const banks = await bankService.getBanks();
    res.status(200).json({ success: true, data: banks });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify bank account before transfer
// @route   POST /api/v1/payments/verify-account
const verifyAccount = async (req, res, next) => {
  try {
    const { accountNumber, bankCode, phone, vpayAccountNumber } = req.body;
    const { pool } = require('../config/database');

    logger.info(`[verifyAccount] Received request - vpay: ${vpayAccountNumber}, phone: ${phone}, account: ${accountNumber}, bank: ${bankCode}`);

    // ── Lookup by VPay account number (from wallets table) ───────────────────
    if (vpayAccountNumber && vpayAccountNumber.length === 10) {
      logger.info(`[verifyAccount] Looking up VPay account: ${vpayAccountNumber}`);
      const [rows] = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.phone, u.avatar,
                w.account_number, w.wallet_type
           FROM wallets w
           JOIN users u ON u.id = w.user_id
          WHERE w.account_number = ?
          LIMIT 1`,
        [vpayAccountNumber]
      );
      if (!rows.length) {
        logger.warn(`[verifyAccount] VPay account not found: ${vpayAccountNumber}`);
        return res.status(404).json({ success: false, message: 'VPay account not found' });
      }
      const r = rows[0];
      logger.info(`[verifyAccount] ✓ VPay account found: ${r.first_name} ${r.last_name}`);
      return res.status(200).json({
        success: true,
        data: {
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          fullName: `${r.first_name} ${r.last_name}`,
          phone: r.phone,
          avatar: r.avatar,
          accountNumber: r.account_number,
          walletType: r.wallet_type,
        }
      });
    }

    // ── Lookup by phone number ───────────────────────────────────────────────
    if (phone && phone.length === 11) {
      logger.info(`[verifyAccount] Looking up VPay user by phone: ${phone}`);
      const recipient = await User.findOne({ phone });
      if (!recipient) {
        logger.warn(`[verifyAccount] VPay user not found with phone: ${phone}`);
        return res.status(404).json({ success: false, message: 'VPay user not found' });
      }
      // Also fetch their account number from wallets
      const [walletRows] = await pool.query(
        'SELECT account_number FROM wallets WHERE user_id = ? AND wallet_type = ? LIMIT 1',
        [recipient.id, 'personal']
      );
      logger.info(`[verifyAccount] ✓ VPay user found: ${recipient.fullName || recipient.firstName} ${recipient.lastName}`);
      return res.status(200).json({
        success: true,
        data: {
          id: recipient.id,
          name: recipient.fullName,
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          phone: recipient.phone,
          avatar: recipient.avatar,
          accountNumber: walletRows[0]?.account_number || null,
        }
      });
    }

    // ── Fallback: Try to find 10-digit account numbers locally before external verification ─
    if (accountNumber && accountNumber.length === 10 && !bankCode) {
      logger.info(`[verifyAccount] Trying local VPay lookup for account: ${accountNumber}`);
      const [rows] = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.phone, u.avatar,
                w.account_number, w.wallet_type
           FROM wallets w
           JOIN users u ON u.id = w.user_id
          WHERE w.account_number = ?
          LIMIT 1`,
        [accountNumber]
      );
      if (rows.length) {
        const r = rows[0];
        logger.info(`[verifyAccount] ✓ Found VPay account locally: ${r.first_name} ${r.last_name}`);
        return res.status(200).json({
          success: true,
          data: {
            id: r.id,
            firstName: r.first_name,
            lastName: r.last_name,
            fullName: `${r.first_name} ${r.last_name}`,
            phone: r.phone,
            avatar: r.avatar,
            accountNumber: r.account_number,
            walletType: r.wallet_type,
          }
        });
      }
    }

    // ── External bank resolution ─────────────────────────────────────────────
    if (!accountNumber || !bankCode) {
      logger.error(`[verifyAccount] Invalid request: Missing accountNumber (${accountNumber}) or bankCode (${bankCode}) for external verification`);
      return res.status(400).json({ 
        success: false, 
        message: 'For external bank transfers, please provide both account number and bank code' 
      });
    }

    logger.info(`[verifyAccount] Verifying external bank account: ${accountNumber} @ ${bankCode}`);
    const result = await verifyAccountNumber(accountNumber, bankCode);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error(`[verifyAccount] Error: ${error.message}`);
    next(error);
  }
};

// @desc    Transfer to bank account
// @route   POST /api/v1/payments/bank-transfer
const bankTransfer = async (req, res, next) => {
  const { pool } = require('../config/database');
  try {
    const { 
      accountNumber, 
      bankCode, 
      bankName, 
      accountName, 
      amount: rawAmount, 
      narration, 
      pin, 
      walletType = 'personal',
      idempotencyKey 
    } = req.body;

    const amount = parseFloat(rawAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // ── 1. Idempotency: reject duplicate requests ────────────────────────────
    if (idempotencyKey) {
      const [existing] = await pool.query(
        `SELECT id FROM transactions WHERE idempotency_key = ? LIMIT 1`,
        [idempotencyKey]
      );
      if (existing.length) {
        return res.status(409).json({ success: false, message: 'Duplicate transfer request. This transfer was already processed.' });
      }
    }

    // ── 2. Load sender & verify PIN with retry lockout ──────────────────────
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.hasPIN) return res.status(400).json({ success: false, message: 'Please set up a transaction PIN first' });

    // Check PIN lockout
    const PIN_MAX_RETRIES = 3;
    const PIN_LOCK_MINUTES = 30;
    const [pinRows] = await pool.query(
      `SELECT pin_fail_count, pin_locked_until FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );
    const pinData = pinRows[0];
    if (pinData?.pin_locked_until && new Date(pinData.pin_locked_until) > new Date()) {
      const unlockAt = new Date(pinData.pin_locked_until);
      const remainingMins = Math.ceil((unlockAt - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `PIN locked. Try again in ${remainingMins} minute(s).`,
        lockedUntil: unlockAt,
      });
    }

    const isPinValid = await user.comparePIN(pin);
    if (!isPinValid) {
      const failCount = (pinData?.pin_fail_count || 0) + 1;
      if (failCount >= PIN_MAX_RETRIES) {
        const lockedUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
        await pool.query(
          `UPDATE users SET pin_fail_count = ?, pin_locked_until = ? WHERE id = ?`,
          [failCount, lockedUntil, req.user.id]
        );
        return res.status(429).json({
          success: false,
          message: `Incorrect PIN. Account locked for ${PIN_LOCK_MINUTES} minutes due to too many failed attempts.`,
          lockedUntil,
        });
      }
      await pool.query(
        `UPDATE users SET pin_fail_count = ? WHERE id = ?`,
        [failCount, req.user.id]
      );
      const remaining = PIN_MAX_RETRIES - failCount;
      return res.status(401).json({
        success: false,
        message: `Incorrect PIN. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      });
    }
    // PIN correct — reset fail counter
    await pool.query(`UPDATE users SET pin_fail_count = 0, pin_locked_until = NULL WHERE id = ?`, [req.user.id]);

    // ── 3. Sender wallet & KYC-based limits ─────────────────────────────────
    const senderWallet = await Wallet.findOne({ user: req.user.id, walletType });
    if (!senderWallet) return res.status(400).json({ success: false, message: 'Wallet not found' });
    if (senderWallet.isFrozen) return res.status(403).json({ success: false, message: 'Your wallet is frozen. Contact support.' });

    const { TRANSACTION_LIMITS, DAILY_LIMITS } = require('../utils/constants');
    const kycLevel = user.kycLevel ?? 0;
    const txnLimit = TRANSACTION_LIMITS[kycLevel] ?? 20000;
    const dailyLimit = DAILY_LIMITS[kycLevel] ?? 50000;
    if (amount > txnLimit) {
      return res.status(400).json({
        success: false,
        message: `Transfer of ₦${amount.toLocaleString()} exceeds your single-transaction limit of ₦${txnLimit.toLocaleString()}. Upgrade your KYC.`,
      });
    }

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const [dailyRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS spent
         FROM transactions
        WHERE user_id = ? AND type = 'debit' AND status = 'completed'
          AND created_at >= ?`,
      [req.user.id, startOfDay]
    );
    const spentToday = parseFloat(dailyRows[0]?.spent || 0);
    if (spentToday + amount > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - spentToday);
      return res.status(400).json({
        success: false,
        message: `Daily transfer limit of ₦${dailyLimit.toLocaleString()} reached. You can still send ₦${remaining.toLocaleString()} today.`,
        remainingDailyLimit: remaining,
      });
    }

    // ── 4. Calculate fee & check balance ─────────────────────────────────────
    const fee = getTransferFee(amount);
    const totalDeduction = amount + fee;

    const sufficient = await Wallet.hasSufficientBalance(senderWallet.id, totalDeduction);
    if (!sufficient) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const reference = generateReference('TRF');
    const balanceBefore = senderWallet.balance;

    // ── 5. Execute atomic debit BEFORE calling VFD API ───────────────────────
    // Reduces balance by (amount + fee), but only adds 'amount' to total_debit
    const updatedWallet = await Wallet.atomicDebitWithFee(senderWallet.id, amount, fee);

    // ── 6. Call VFD BaaS API ─────────────────────────────────────────────────
    const transferType = bankCode === '999999' ? 'intra' : 'inter';
    let txnStatus = 'processing';
    let vfdResult;

    try {
      vfdResult = await initiateTransfer({
        toAccount: accountNumber,
        toBank: bankCode,
        toName: accountName,
        transferType,
        amount,
        remark: narration || `Transfer to ${accountName}`,
        reference,
      });

      const vfdStatus = vfdResult?.data?.status;
      txnStatus = vfdStatus === '00' ? 'completed' : vfdStatus === '99' ? 'failed' : 'processing';
    } catch (transferErr) {
      logger.error(`VFD transfer error for ${reference}: ${transferErr.message}`);
      txnStatus = 'failed';
    }

    // ── 7. Handle failure (Atomic Reversal) ──────────────────────────────────
    let finalBalance = updatedWallet.balance;
    if (txnStatus === 'failed') {
      // Revert the deduction: add totalDeduction back to balance
      // Wait, atomicDebitWithFee reduced balance by totalDeduction, increased total_debit by amount
      await pool.query(
        `UPDATE wallets
            SET balance     = balance     + ?,
                total_debit = total_debit - ?,
                updated_at  = NOW()
          WHERE id = ?`,
        [totalDeduction, amount, senderWallet.id]
      );
      finalBalance = balanceBefore; // it went back to what it was
    }

    // ── 8. Record transaction ────────────────────────────────────────────────
    await Transaction.create({
      reference,
      idempotency_key: idempotencyKey || null,
      user: req.user.id,
      type: 'debit',
      category: 'transfer',
      amount,
      fee,
      balanceBefore,
      balanceAfter: finalBalance,
      description: narration?.trim() || `Transfer to ${accountName} (${bankName})`,
      status: txnStatus,
      ...(txnStatus === 'completed' ? { completedAt: new Date() } : {}),
      recipient: { name: accountName, accountNumber, bankCode, bankName },
      metadata: { walletType, channel: 'vfd_bank' },
    });

    // ── 9. Post-transfer actions (if completed) ──────────────────────────────
    if (txnStatus === 'completed') {
      try {
        await Notification.create({
          user: req.user.id,
          title: 'Transfer Successful',
          body: `₦${parseFloat(amount).toLocaleString()} sent to ${accountName} (${bankName}).`,
          type: 'transaction',
          data: { reference, amount, recipient: accountName }
        });
      } catch (notifErr) {}

      // Auto-save Beneficiary
      const Beneficiary = require('../models/Beneficiary');
      Beneficiary.create({
        user: req.user.id,
        type: 'bank',
        accountName,
        accountNumber,
        bankCode,
        bankName,
      }).catch(() => {});

      // Socket.IO
      const socketService = require('../services/socketService');
      socketService.emitToUser(req.user.id, 'bank_transfer_completed', {
        reference,
        amount,
        fee,
        total: totalDeduction,
        recipient: accountName,
        bank: bankName,
        newBalance: finalBalance,
        timestamp: new Date().toISOString(),
      });

      // Emit balance update for real-time UI refresh
      socketService.emitToUser(req.user.id, 'balance_updated', {
        balance: finalBalance,
        walletType: walletType || 'personal',
        timestamp: new Date().toISOString(),
      });

      // Email
      sendTransactionEmail(req.user.email, req.user.firstName, {
        type: 'debit',
        amount: parseFloat(amount),
        reference,
        description: `Transfer to ${accountName} (${bankName})`
      }).catch(e => {});
    }

    if (txnStatus === 'failed') {
      return res.status(400).json({ success: false, message: vfdResult?.message || 'Transfer failed and was reversed', data: { reference } });
    }

    res.status(200).json({ success: true, message: 'Transfer initiated correctly', data: { reference, status: txnStatus, newBalance: finalBalance } });
  } catch (error) {
    logger.error(`bankTransfer error: ${error.message}`);
    next(error);
  }
};

// @desc    VPay to VPay transfer (fintech-grade)
// @route   POST /api/v1/payments/vpay-transfer
const vpayTransfer = async (req, res, next) => {
  const { pool } = require('../config/database');
  try {
    const {
      recipientPhone,
      recipientAccountNumber,
      amount: rawAmount,
      narration,
      pin,
      walletType = 'personal',
      idempotencyKey,       // client-generated UUID to prevent duplicate sends
    } = req.body;

    const amount = parseFloat(rawAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum transfer amount is ₦10' });
    }

    // ── 1. Idempotency: reject duplicate requests within 10 minutes ─────────
    if (idempotencyKey) {
      const [existing] = await pool.query(
        `SELECT id FROM transactions WHERE idempotency_key = ? LIMIT 1`,
        [idempotencyKey]
      );
      if (existing.length) {
        return res.status(409).json({ success: false, message: 'Duplicate transfer request. This transfer was already processed.' });
      }
    }

    // ── 2. Load sender & verify PIN with retry lockout ──────────────────────
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.hasPIN) return res.status(400).json({ success: false, message: 'Please set up a transaction PIN first' });

    // Check PIN lockout
    const PIN_MAX_RETRIES = 3;
    const PIN_LOCK_MINUTES = 30;
    const pinAttemptKey = `pin_fail_${req.user.id}`;
    const [pinRows] = await pool.query(
      `SELECT pin_fail_count, pin_locked_until FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );
    const pinData = pinRows[0];
    if (pinData?.pin_locked_until && new Date(pinData.pin_locked_until) > new Date()) {
      const unlockAt = new Date(pinData.pin_locked_until);
      const remainingMins = Math.ceil((unlockAt - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `PIN locked. Try again in ${remainingMins} minute(s).`,
        lockedUntil: unlockAt,
      });
    }

    const isPinValid = await user.comparePIN(pin);
    if (!isPinValid) {
      const failCount = (pinData?.pin_fail_count || 0) + 1;
      if (failCount >= PIN_MAX_RETRIES) {
        const lockedUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
        await pool.query(
          `UPDATE users SET pin_fail_count = ?, pin_locked_until = ? WHERE id = ?`,
          [failCount, lockedUntil, req.user.id]
        );
        return res.status(429).json({
          success: false,
          message: `Incorrect PIN. Account locked for ${PIN_LOCK_MINUTES} minutes due to too many failed attempts.`,
          lockedUntil,
        });
      }
      await pool.query(
        `UPDATE users SET pin_fail_count = ? WHERE id = ?`,
        [failCount, req.user.id]
      );
      const remaining = PIN_MAX_RETRIES - failCount;
      return res.status(401).json({
        success: false,
        message: `Incorrect PIN. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      });
    }
    // PIN correct — reset fail counter
    await pool.query(`UPDATE users SET pin_fail_count = 0, pin_locked_until = NULL WHERE id = ?`, [req.user.id]);

    // ── 3. Resolve recipient ─────────────────────────────────────────────────
    let recipient, recipientWalletRef;
    if (recipientAccountNumber) {
      const [rows] = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.phone, u.email, u.avatar,
                w.id AS wallet_id, w.account_number
           FROM wallets w
           JOIN users u ON u.id = w.user_id
          WHERE w.account_number = ? AND u.is_active = 1
          LIMIT 1`,
        [recipientAccountNumber]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: 'VPay account not found' });
      const r = rows[0];
      recipient = { id: r.id, _id: r.id, firstName: r.first_name, lastName: r.last_name, fullName: `${r.first_name} ${r.last_name}`, phone: r.phone, email: r.email, avatar: r.avatar };
      recipientWalletRef = r.wallet_id;
    } else if (recipientPhone) {
      recipient = await User.findOne({ phone: recipientPhone });
      if (!recipient) return res.status(404).json({ success: false, message: 'No VPay user with this phone number' });
    } else {
      return res.status(400).json({ success: false, message: 'Provide recipientPhone or recipientAccountNumber' });
    }

    if (recipient.id === req.user.id || recipient.phone === req.user.phone) {
      return res.status(400).json({ success: false, message: 'You cannot transfer money to yourself' });
    }

    // ── 4. Sender wallet & KYC-based limits ─────────────────────────────────
    const senderWallet = await Wallet.findOne({ user: req.user.id, walletType });
    if (!senderWallet) return res.status(400).json({ success: false, message: 'Wallet not found' });
    if (senderWallet.isFrozen) return res.status(403).json({ success: false, message: 'Your wallet is frozen. Contact support.' });

    // Per-transaction limit (KYC-based)
    const { TRANSACTION_LIMITS, DAILY_LIMITS } = require('../utils/constants');
    const kycLevel = user.kycLevel ?? 0;
    const txnLimit = TRANSACTION_LIMITS[kycLevel] ?? 20000;
    const dailyLimit = DAILY_LIMITS[kycLevel] ?? 50000;
    if (amount > txnLimit) {
      return res.status(400).json({
        success: false,
        message: `Transfer of ₦${amount.toLocaleString()} exceeds your single-transaction limit of ₦${txnLimit.toLocaleString()}. Upgrade your KYC to increase limits.`,
      });
    }

    // Daily spend limit (sum of today's completed debits)
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const [dailyRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS spent
         FROM transactions
        WHERE user_id = ? AND type = 'debit' AND status = 'completed'
          AND created_at >= ?`,
      [req.user.id, startOfDay]
    );
    const spentToday = parseFloat(dailyRows[0]?.spent || 0);
    if (spentToday + amount > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - spentToday);
      return res.status(400).json({
        success: false,
        message: `Daily transfer limit of ₦${dailyLimit.toLocaleString()} reached. You can still send ₦${remaining.toLocaleString()} today.`,
        remainingDailyLimit: remaining,
      });
    }

    // Balance check (fresh from DB)
    const sufficient = await Wallet.hasSufficientBalance(senderWallet.id, amount);
    if (!sufficient) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // ── 5. Recipient wallet ──────────────────────────────────────────────────
    const recipientWallet = recipientWalletRef
      ? await Wallet.findById(recipientWalletRef)
      : await Wallet.findOne({ user: recipient._id, walletType: 'personal' });
    if (!recipientWallet) return res.status(400).json({ success: false, message: 'Recipient wallet not found' });

    // ── 6. Execute atomic transfer ───────────────────────────────────────────
    // VPay-to-VPay is FREE (no transfer fee — competitive advantage like OPay)
    const fee = 0;
    const reference = generateReference('VPY');
    const creditReference = generateReference('VPY-CR');
    const senderBalanceBefore = senderWallet.balance;
    const recipientBalanceBefore = recipientWallet.balance;

    const [updatedSender, updatedRecipient] = await Promise.all([
      Wallet.atomicDebit(senderWallet.id, amount, fee),
      Wallet.atomicCredit(recipientWallet.id, amount),
    ]);

    // ── 7. Record transactions ───────────────────────────────────────────────
    await Transaction.insertMany([
      {
        reference,
        linked_reference: creditReference,   // links debit to credit for dispute resolution
        idempotency_key: idempotencyKey || null,
        user: req.user.id,
        type: 'debit',
        category: 'transfer',
        amount,
        fee,
        balanceBefore: senderBalanceBefore,
        balanceAfter: updatedSender.balance,
        description: narration?.trim() || `Transfer to ${recipient.firstName}`,
        status: 'completed',
        completedAt: new Date(),
        recipient: { name: recipient.fullName, phone: recipient.phone },
        metadata: { walletType, channel: 'vpay_internal' },
      },
      {
        reference: creditReference,
        linked_reference: reference,
        user: recipient._id,
        type: 'credit',
        category: 'transfer',
        amount,
        fee: 0,
        balanceBefore: recipientBalanceBefore,
        balanceAfter: updatedRecipient.balance,
        description: narration?.trim() || `Transfer from ${user.firstName}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: { senderPhone: user.phone, channel: 'vpay_internal' },
      },
    ]);

    // ── 8. Auto-save beneficiary ─────────────────────────────────────────────
    const Beneficiary = require('../models/Beneficiary');
    Beneficiary.create({
      user: req.user.id,
      type: 'vpay',
      accountName: recipient.fullName,
      phone: recipient.phone,
      accountNumber: recipientAccountNumber || null,
    }).catch(() => {});

    // ── 9. Push notifications (non-blocking) ─────────────────────────────────
    const fmtAmt = `₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    Promise.all([
      Notification.create({
        user: req.user.id,
        title: 'Transfer Successful ✅',
        body: `${fmtAmt} sent to ${recipient.fullName}. Ref: ${reference}`,
        type: 'transaction',
        data: { reference, amount, type: 'debit', recipient: recipient.fullName, newBalance: updatedSender.balance },
      }),
      Notification.create({
        user: recipient._id,
        title: 'Money Received 💰',
        body: `${fmtAmt} received from ${user.fullName}. Ref: ${creditReference}`,
        type: 'transaction',
        data: { reference: creditReference, amount, type: 'credit', sender: user.fullName, newBalance: updatedRecipient.balance },
      }),
    ]).catch(e => logger.warn(`Notification error: ${e.message}`));

    // ── 10. Real-time Socket.IO events (non-blocking) ─────────────────────────
    const socketService = require('../services/socketService');
    socketService.emitToUser(req.user.id, 'transfer_sent', {
      reference, amount, fee,
      recipient: { name: recipient.fullName, phone: recipient.phone, accountNumber: recipientAccountNumber },
      newBalance: updatedSender.balance,
      balanceBefore: senderBalanceBefore,
      description: narration?.trim() || `Transfer to ${recipient.firstName}`,
      timestamp: new Date().toISOString(),
    });
    
    // Emit balance update events for real-time UI refresh
    socketService.emitToUser(req.user.id, 'balance_updated', {
      balance: updatedSender.balance,
      walletType: walletType || 'personal',
      timestamp: new Date().toISOString(),
    });
    
    socketService.emitToUser(recipient._id, 'money_received', {
      reference: creditReference, amount,
      sender: { name: user.fullName, phone: user.phone },
      newBalance: updatedRecipient.balance,
      balanceBefore: recipientBalanceBefore,
      description: narration?.trim() || `Transfer from ${user.firstName}`,
      timestamp: new Date().toISOString(),
    });
    
    // Emit balance update for recipient
    socketService.emitToUser(recipient._id, 'balance_updated', {
      balance: updatedRecipient.balance,
      walletType: walletType || 'personal',
      timestamp: new Date().toISOString(),
    });

    // ── 11. Email receipts (non-blocking) ─────────────────────────────────────
    sendTransactionEmail(user.email, user.firstName, {
      type: 'debit', amount, reference,
      description: `VPay Transfer to ${recipient.fullName}`,
    }).catch(e => logger.warn(`Sender email: ${e.message}`));
    sendTransactionEmail(recipient.email, recipient.firstName, {
      type: 'credit', amount, reference: creditReference,
      description: `VPay Transfer from ${user.fullName}`,
    }).catch(e => logger.warn(`Recipient email: ${e.message}`));

    // ── 12. Response ──────────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      message: `₦${parseFloat(amount).toLocaleString()} sent successfully to ${recipient.firstName}`,
      data: {
        reference,
        creditReference,
        amount,
        fee,
        total: amount + fee,
        recipient: { name: recipient.fullName, phone: recipient.phone },
        newBalance: updatedSender.balance,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`vpayTransfer error: ${error.message}`);
    next(error);
  }
};

// @desc    Resolve a bank account (name enquiry before transfer)
// @route   POST /api/v1/payments/resolve-account
const resolveAccount = async (req, res, next) => {
  try {
    const { accountNumber, bankCode } = req.body;
    
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account number and bank code are required' 
      });
    }
    
    require('../utils/logger').info(`[ResolveAccount] Resolving ${accountNumber} @ ${bankCode}`);
    
    // ── Local VPay lookup if bankCode is 999999 ──────────────────────────
    if (bankCode === '999999') {
      const { pool } = require('../config/database');
      const [rows] = await pool.query(
        `SELECT u.first_name, u.last_name, w.account_number 
         FROM wallets w 
         JOIN users u ON u.id = w.user_id 
         WHERE w.account_number = ? LIMIT 1`,
        [accountNumber]
      );
      if (rows.length > 0) {
        return res.status(200).json({
          success: true,
          data: {
            accountName: `${rows[0].first_name} ${rows[0].last_name}`,
            accountNumber: rows[0].account_number
          }
        });
      } else {
        return res.status(404).json({ success: false, message: 'VPay account not found locally' });
      }
    }
    
    const transferType = bankCode === '999999' ? 'intra' : 'inter';
    const result = await verifyAccountNumber(accountNumber, bankCode, transferType);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    require('../utils/logger').error(`[ResolveAccount] Error: ${error.message}`);
    
    // Check if it's a 404 from VFD API (account not found)
    if (error.response?.status === 404 || error.message.includes('not found')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message || 'Account number not found. Please verify and try again.' 
      });
    }
    
    // Generic error
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Could not verify account. Please try again later.' 
    });
  }
};

// @desc    VFD inward credit webhook — called by VFD when funds arrive at pool account
// @route   POST /api/v1/payments/webhook/vfd-credit
const vfdCreditWebhook = async (req, res, next) => {
  try {
    // Acknowledge quickly to avoid timeout
    res.status(200).json({ success: true });

    const { reference, amount, originator_account_name, originator_bank, originator_narration, account_number } = req.body;

    if (!reference || !amount) {
      return logger.warn('VFD webhook: missing reference or amount in payload');
    }

    const creditAmount = parseFloat(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      return logger.warn(`VFD webhook: invalid amount "${amount}" for ref ${reference}`);
    }

    // Find pending transaction by reference (user used reference as narration)
    const narrationRef = (originator_narration || '').trim().split(/\s+/)[0];
    const pendingTxn = await Transaction.findOne({
      $or: [
        { reference },
        { reference: narrationRef },
      ],
      type: 'credit',
      status: 'pending',
    });

    if (!pendingTxn) {
      return logger.warn(`VFD webhook: no pending transaction for reference "${reference}" / narration ref "${narrationRef}"`);
    }

    // Idempotency: skip if already processed
    if (pendingTxn.status === 'completed') {
      return logger.info(`VFD webhook: transaction ${pendingTxn.reference} already processed`);
    }

    const wallet = await Wallet.findOne({ user: pendingTxn.user });
    if (!wallet) {
      return logger.error(`VFD webhook: wallet not found for user ${pendingTxn.user}`);
    }

    const balanceBefore = wallet.balance;
    const updatedWallet = await Wallet.atomicCredit(wallet.id, creditAmount);

    await Transaction.findByIdAndUpdate(pendingTxn._id, {
      status: 'completed',
      amount: creditAmount,
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      completedAt: new Date(),
      description: `Wallet funding — ${originator_account_name || 'Bank Transfer'} via ${originator_bank || 'bank'}`,
      metadata: { vfdReference: reference, poolAccountNo: account_number },
    });

    // Send credit notification
    try {
      await Notification.create({
        user: pendingTxn.user,
        title: 'Wallet Funded',
        body: `Your wallet has been credited with NGN ${creditAmount} via bank transfer.`,
        type: 'transaction',
        data: { reference: pendingTxn.reference, amount: creditAmount }
      });
    } catch (e) {
      logger.warn(`Credit webhook notification failed: ${e.message}`);
    }

    // Send credit email
    const [userRows] = await pool.query('SELECT first_name, email FROM users WHERE id = ?', [pendingTxn.user]);
    if (userRows.length > 0) {
      sendTransactionEmail(userRows[0].email, userRows[0].first_name, {
        type: 'credit',
        amount: parseFloat(creditAmount),
        reference: pendingTxn.reference,
        description: 'Wallet Funding via Bank Transfer'
      }).catch(e => {});
    }

    logger.info(`VFD webhook: credited ${creditAmount} to wallet ${wallet._id} (ref: ${pendingTxn.reference})`);
  } catch (error) {
    logger.error(`VFD webhook error: ${error.message}`);
    // Response already sent — do not call next(error)
  }
};

// ─── Search for VPay users by phone, name, or account number ─────────────────
const searchVPayUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Query must be at least 3 characters' });
    }

    const { pool } = require('../config/database');
    const q = `%${query.trim()}%`;

    const [rows] = await pool.query(
      `SELECT DISTINCT u.id, u.first_name, u.last_name, u.phone, u.avatar,
              w.account_number, w.wallet_type
         FROM users u
         LEFT JOIN wallets w ON w.user_id = u.id AND w.wallet_type = 'personal'
        WHERE u.id != ?
          AND (
            u.phone LIKE ?
            OR u.first_name LIKE ?
            OR u.last_name LIKE ?
            OR w.account_number LIKE ?
          )
        LIMIT 10`,
      [req.user.id, q, q, q, q]
    );

    const users = rows.map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      fullName: `${r.first_name} ${r.last_name}`,
      phone: r.phone,
      avatar: r.avatar,
      accountNumber: r.account_number,
    }));

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyAccount, resolveAccount, bankTransfer, vpayTransfer, vfdCreditWebhook, getBankList, searchVPayUsers };
