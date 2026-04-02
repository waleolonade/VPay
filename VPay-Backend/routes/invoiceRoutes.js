const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, getInvoiceStats, payInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

// Public route for payment via slug
router.post('/:slug/pay', payInvoice);

// Protected routes (Business Account only)
router.use(protect);
router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/stats', getInvoiceStats);

module.exports = router;
