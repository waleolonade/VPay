const express = require('express');
const { verifyBVN, verifyNIN } = require('../controllers/kycController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/bvn', verifyBVN);
router.post('/nin', verifyNIN);

module.exports = router;
