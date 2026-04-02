/**
 * QR Payment Controller
 *
 * Handles all QR-code-triggered payments. Every payment made through a QR scan
 * is tagged with channel='qr' in the transactions table so analytics can
 * distinguish QR vs app-initiated flows.
 *
 * Routes (all under /api/v1/qr):
 *   GET  /token           — Return the authenticated user's wallet QR payload
 *   POST /pay-vpay        — QR-initiated VPay → VPay transfer
 *   POST /pay-bill        — QR-initiated bill payment
 */

'use strict';

const Wallet      = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User        = require('../models/User');
const Bill        = require('../models/Bill');
const {
  initiateTransfer,
}                 = require('../services/vfdWalletService');
const {
  payBill: vfdPayBill,
  getBillTransactionStatus,
}                 = require('../services/vfdBillsService');
const generateReference = require('../utils/generateReference');
const { TRANSFER_FEE_TIERS } = require('../utils/constants');
const logger      = require('../utils/logger');

// ─── helpers ──────────────────────────────────────────────────────────────────

const getTransferFee = (amount) => {
  for (const tier of TRANSFER_FEE_TIERS) {
    if (amount <= tier.max) return tier.fee;
  }
  return 50;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/qr/token
//
// Returns the authenticated user's wallet details that the frontend embeds
// into the QR code SVG (via react-native-qrcode-svg). No external VFD call
// needed — this is purely DB-sourced.
// ─────────────────────────────────────────────────────────────────────────────
const getMyQRToken = async (req, res, next) => {
  try {
    const user   = await User.findById(req.user.id);
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    const payload = {
      type:          'vpay',
      phone:         user.phone,
      name:          user.fullName || `${user.firstName} ${user.lastName}`.trim(),
      accountNumber: wallet.accountNumber || '',
      walletId:      wallet.id,
      // timestamp so the generator can show "refreshed X seconds ago"
      issuedAt:      new Date().toISOString(),
    };

    res.status(200).json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/qr/pay-vpay
//
// Body: { phone, amount, note?, pin, qrRaw? }
//
// Identical flow to /payments/vpay-transfer but:
//   • tagged channel = 'qr' on both debit and credit transactions
//   • stores the raw QR string in metadata for audit
// ─────────────────────────────────────────────────────────────────────────────
const qrPayVPay = async (req, res, next) => {
  try {
    const { phone: recipientPhone, amount, note, pin, qrRaw } = req.body;

    // ── Validate inputs ────────────────────────────────────────────────────
    if (!recipientPhone || !amount || !pin) {
      return res.status(400).json({ success: false, message: 'phone, amount and pin are required' });
    }
    if (typeof amount !== 'number' || amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum transfer amount is ₦10' });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
    }
    if (recipientPhone === req.user.phone) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to yourself' });
    }

    // ── Authenticate sender ────────────────────────────────────────────────
    const sender = await User.findById(req.user.id);
    if (!sender.hasPIN) {
      return res.status(400).json({
        success: false,
        message: 'Please set a transaction PIN in your profile before making payments',
      });
    }
    const pinOk = await sender.comparePIN(pin);
    if (!pinOk) {
      return res.status(401).json({ success: false, message: 'Invalid PIN' });
    }

    // ── Validate recipient ─────────────────────────────────────────────────
    const recipient = await User.findOne({ phone: recipientPhone });
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found on VPay' });
    }

    // ── Check balance ──────────────────────────────────────────────────────
    const senderWallet = await Wallet.findOne({ user: req.user.id });
    if (senderWallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const recipientWallet = await Wallet.findOne({ user: recipient._id });
    const reference            = generateReference('QRV');
    const senderBalanceBefore  = senderWallet.balance;
    const recipientBalBefore   = recipientWallet.balance;

    // ── Update balances ────────────────────────────────────────────────────
    const fee = 0; // Vpay to Vpay is free
    const [updatedSender, updatedRecipient] = await Promise.all([
      Wallet.atomicDebit(senderWallet.id, amount, fee),
      Wallet.atomicCredit(recipientWallet.id, amount)
    ]);

    // Validate balances were updated correctly
    if (!updatedSender || updatedSender.balance === undefined) {
      logger.error(`[QR] Sender balance not updated correctly: ${JSON.stringify(updatedSender)}`);
      return res.status(500).json({ success: false, message: 'Balance update failed. Please contact support.' });
    }
    if (!updatedRecipient || updatedRecipient.balance === undefined) {
      logger.error(`[QR] Recipient balance not updated correctly: ${JSON.stringify(updatedRecipient)}`);
      return res.status(500).json({ success: false, message: 'Balance update failed. Please contact support.' });
    }

    // Ensure balances are properly formatted
    const senderNewBalance = parseFloat(updatedSender.balance) || 0;
    const recipientNewBalance = parseFloat(updatedRecipient.balance) || 0;

    logger.info(`[QR] Balances updated - Sender: ${senderNewBalance}, Recipient: ${recipientNewBalance}`);

    const metadata = { channel: 'qr', ...(qrRaw ? { qrPayload: qrRaw } : {}) };

    // ── Record transactions ────────────────────────────────────────────────
    await Transaction.insertMany([
      {
        reference,
        user:         req.user.id,
        type:         'debit',
        channel:      'qr',
        category:     'transfer',
        amount,
        fee:          0,
        balanceBefore: senderBalanceBefore,
        balanceAfter:  senderNewBalance,
        description:  note || `QR Pay to ${recipient.firstName || recipientPhone}`,
        status:       'completed',
        completedAt:  new Date(),
        recipient:    { name: recipient.fullName || recipient.firstName, phone: recipientPhone },
        metadata,
      },
      {
        reference:    generateReference('QRV'),
        user:         recipient._id,
        type:         'credit',
        channel:      'qr',
        category:     'transfer',
        amount,
        fee:          0,
        balanceBefore: recipientBalBefore,
        balanceAfter:  recipientNewBalance,
        description:  note || `QR payment from ${sender.firstName}`,
        status:       'completed',
        completedAt:  new Date(),
        metadata,
      },
    ]);

    logger.info(`QR VPay transfer: ${req.user.phone} → ${recipientPhone} ₦${amount} ref=${reference}`);

    // ── Real-time Socket.IO events ─────────────────────────────────────────
    const socketService = require('../services/socketService');
    
    // Emit transfer_sent event to sender
    socketService.emitToUser(req.user.id, 'transfer_sent', {
      reference,
      amount,
      fee: 0,
      recipient: { name: recipient.fullName || recipient.firstName, phone: recipientPhone },
      newBalance: senderNewBalance,
      balanceBefore: senderBalanceBefore,
      description: note || `QR Pay to ${recipient.firstName || recipientPhone}`,
      timestamp: new Date().toISOString(),
    });
    
    // Emit balance_updated event to sender
    socketService.emitToUser(req.user.id, 'balance_updated', {
      balance: senderNewBalance,
      walletType: 'personal',
      timestamp: new Date().toISOString(),
    });
    
    // Emit transfer_received event to recipient
    socketService.emitToUser(recipient._id, 'transfer_received', {
      reference,
      amount,
      sender: { name: sender.fullName || sender.firstName, phone: sender.phone },
      newBalance: recipientNewBalance,
      balanceBefore: recipientBalBefore,
      description: note || `QR payment from ${sender.firstName}`,
      timestamp: new Date().toISOString(),
    });
    
    // Emit balance_updated event to recipient
    socketService.emitToUser(recipient._id, 'balance_updated', {
      balance: recipientNewBalance,
      walletType: 'personal',
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'QR payment successful',
      data: {
        reference,
        amount,
        recipientName:  recipient.fullName || recipient.firstName,
        recipientPhone,
        newBalance:     senderNewBalance,
        channel:        'qr',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/qr/pay-bill
//
// Body: {
//   billerId, billerName, billType, customerNumber,
//   division, paymentItem, productId,
//   amount, pin, phoneNumber?, qrRaw?
// }
//
// Calls VFD Bills API then records both a Transaction and Bill record,
// tagged channel = 'qr'.
// ─────────────────────────────────────────────────────────────────────────────
const qrPayBill = async (req, res, next) => {
  try {
    const {
      billerId, billerName, billType, customerNumber,
      division, paymentItem, productId,
      amount, pin, phoneNumber, qrRaw,
    } = req.body;

    // ── Validate ───────────────────────────────────────────────────────────
    if (!billerId || !customerNumber || !amount || !pin) {
      return res.status(400).json({
        success: false,
        message: 'billerId, customerNumber, amount and pin are required',
      });
    }
    if (typeof amount !== 'number' || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
    }

    // ── Authenticate ───────────────────────────────────────────────────────
    const user = await User.findById(req.user.id);
    if (!user.hasPIN) {
      return res.status(400).json({
        success: false,
        message: 'Set a transaction PIN in your profile before making payments',
      });
    }
    const pinOk = await user.comparePIN(pin);
    if (!pinOk) {
      return res.status(401).json({ success: false, message: 'Invalid PIN' });
    }

    // ── Balance check ──────────────────────────────────────────────────────
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const reference       = generateReference('QRB');
    const balanceBefore   = wallet.balance;

    // ── Deduct balance ─────────────────────────────────────────────────────
    const updatedWallet = await Wallet.atomicDebit(wallet.id, amount, 0);

    // ── Call VFD Bills API ─────────────────────────────────────────────────
    let vfdResult;
    let txnStatus = 'processing';
    let providerRef;
    let token;

    try {
      vfdResult = await vfdPayBill({
        customerId:   customerNumber,
        amount:       String(amount),
        division:     division || 'C',
        paymentItem:  paymentItem || billerId,
        productId:    String(productId || billerId),
        billerId,
        reference,
        phoneNumber:  phoneNumber || customerNumber,
      });

      if (vfdResult.success) {
        txnStatus  = 'completed';
        providerRef = vfdResult.reference;
        token      = vfdResult.token;
      } else if (vfdResult.status === '09') {
        txnStatus = 'processing';
      } else {
        txnStatus = 'failed';
      }
    } catch (vfdErr) {
      logger.error(`VFD QR bill pay error for ${reference}: ${vfdErr.message}`);
      txnStatus = 'failed';
    }

    let finalBalance = updatedWallet.balance;
    if (txnStatus === 'failed') {
      const dbPool = require('../config/database').pool;
      await dbPool.query(
        `UPDATE wallets SET balance = balance + ?, total_debit = total_debit - ? WHERE id = ?`,
        [amount, amount, wallet.id]
      );
      finalBalance = balanceBefore;
    }

    const metadata = {
      channel:   'qr',
      billType:  billType || 'bill',
      billerId,
      billerName,
      customerNumber,
      ...(token     ? { token }      : {}),
      ...(qrRaw     ? { qrPayload: qrRaw } : {}),
    };

    // ── Record Transaction ─────────────────────────────────────────────────
    await Transaction.create({
      reference,
      user:         req.user.id,
      type:         'debit',
      channel:      'qr',
      category:     'bill',
      amount,
      fee:          0,
      balanceBefore,
      balanceAfter:   finalBalance,
      description:  `QR ${billType || 'Bill'} – ${billerName || billerId}`,
      status:       txnStatus,
      provider:     'vfd',
      providerReference: providerRef || null,
      completedAt:  txnStatus === 'completed' ? new Date() : null,
      metadata,
    });

    // ── Record Bill record ─────────────────────────────────────────────────
    if (txnStatus !== 'failed') {
      await Bill.create({
        user:         req.user.id,
        reference,
        billType:     billType || 'bill',
        billerId,
        billerName:   billerName || billerId,
        customerNumber,
        amount,
        status:       txnStatus,
        providerReference: providerRef || null,
        token:        token || null,
        metadata,
      });
    }

    if (txnStatus === 'failed') {
      return res.status(400).json({
        success: false,
        message:  vfdResult?.message || 'Bill payment failed. Your account was not debited.',
        data:     { reference },
      });
    }

    logger.info(`QR bill payment: user=${req.user.id} biller=${billerId} ₦${amount} ref=${reference}`);

    res.status(200).json({
      success: true,
      message: 'QR bill payment successful',
      data: {
        reference,
        amount,
        billerName:  billerName || billerId,
        billType:    billType   || 'bill',
        customerNumber,
        status:      txnStatus,
        newBalance:  finalBalance,
        channel:     'qr',
        ...(token ? { token } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getQRTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ channel: 'qr' });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyQRToken, qrPayVPay, qrPayBill, getQRTransactions };

