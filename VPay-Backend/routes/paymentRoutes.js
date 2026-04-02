const express = require('express');
const router = express.Router();
const { verifyAccount, resolveAccount, bankTransfer, vpayTransfer, vfdCreditWebhook, getBankList, searchVPayUsers } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// VFD inward credit webhook — no auth (called by VFD servers)
router.post('/webhook/vfd-credit', vfdCreditWebhook);

// Bank list — auth required (prevents scraping)
router.get('/banks', protect, getBankList);

// Search VPay users for peer-to-peer transfer
router.get('/search-users', protect, searchVPayUsers);

router.use(protect);

router.post('/bank-transfer', bankTransfer);
router.post('/vpay-transfer', vpayTransfer);
router.post('/verify-account', verifyAccount);
router.post('/resolve-account', resolveAccount);

module.exports = router;
