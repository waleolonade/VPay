const express = require('express');
const router = express.Router();
const adminTransactionController = require('../controllers/adminTransactionController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// List all transactions (with filters, pagination)
router.get('/', adminTransactionController.getTransactions);
// Get summary stats for all transactions
router.get('/summary', adminTransactionController.getTransactionSummary);
// Get single transaction details
router.get('/:reference', adminTransactionController.getTransaction);
// Refund a transaction
router.post('/:id/refund', adminTransactionController.refundTransaction);

module.exports = router;
