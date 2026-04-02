const express = require('express');
const router = express.Router();
const { getTransactions, getTransaction, getTransactionSummary, getAIAdvice } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTransactions);
router.get('/summary', getTransactionSummary);
router.post('/ai-advice', getAIAdvice);
router.get('/:reference', getTransaction);

module.exports = router;
