const express = require('express');
const router = express.Router();
const { checkEligibility, calculateLoan, applyLoan, getLoans, repayLoan } = require('../controllers/loanController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/eligibility', checkEligibility);
router.post('/calculate', calculateLoan);
router.post('/apply', applyLoan);
router.get('/', getLoans);
router.post('/:id/repay', repayLoan);

module.exports = router;
