const express = require('express');
const router = express.Router();
const { getCategories, getBillers, getBillerItems, verifyCustomer, payBill, getBillStatus, getBills } = require('../controllers/billController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/categories', getCategories);
router.get('/billers', getBillers);
router.get('/billers/:billerId/items', getBillerItems);
router.post('/verify', verifyCustomer);
router.post('/pay', payBill);
router.get('/status/:transactionId', getBillStatus);
router.get('/', getBills);

module.exports = router;
