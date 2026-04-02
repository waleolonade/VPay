const express = require('express');
const router = express.Router();
const {
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
  // Legacy aliases kept for backward compat
  initFundWallet,
  verifyFunding,
} = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getWallet);
router.get('/details', getWalletDetails);

// Bank transfer funding flow
router.post('/fund/bank', initBankFunding);

// Virtual Account funding flow
router.post('/fund/virtual', generateVirtualAccountDetails);

// Business Profile flow
router.put('/business/profile', updateBusinessProfile);

// Statement flow
router.get('/statement', getVfdStatement);

// Card funding flow
router.post('/fund/card', initCardFunding);
router.post('/fund/card/validate-otp', validateCardFundingOtp);
router.post('/fund/card/verify', verifyCardFunding);

// Dev/test only — simulate inward credit
if (process.env.NODE_ENV !== 'production') {
  router.post('/fund/simulate', simulateFunding);
}

// Legacy routes for backward compat
router.post('/fund', initFundWallet);
router.post('/verify', verifyFunding);

module.exports = router;
