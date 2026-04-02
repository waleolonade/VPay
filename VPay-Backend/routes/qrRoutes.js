'use strict';

const express  = require('express');
const router   = express.Router();
const { getMyQRToken, qrPayVPay, qrPayBill, getQRTransactions } = require('../controllers/qrController');

const { protect } = require('../middleware/auth');

// All QR routes require an authenticated user
router.use(protect);

/**
 * GET /api/v1/qr/token
 * Returns the authenticated user's wallet details to embed in the QR code.
 * No body required.
 */
router.get('/', getQRTransactions);
router.get('/token', getMyQRToken);


/**
 * POST /api/v1/qr/pay-vpay
 * Body: { phone, amount, note?, pin, qrRaw? }
 * VPay-to-VPay transfer triggered by scanning a QR code.
 */
router.post('/pay-vpay', qrPayVPay);

/**
 * POST /api/v1/qr/pay-bill
 * Body: { billerId, billerName, billType, customerNumber,
 *         division, paymentItem, productId,
 *         amount, pin, phoneNumber?, qrRaw? }
 * Bill payment triggered by scanning a QR code.
 */
router.post('/pay-bill', qrPayBill);

module.exports = router;
