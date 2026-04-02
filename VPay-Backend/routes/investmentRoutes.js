const express = require('express');
const router = express.Router();
const { getPlans, createInvestment, getInvestments, withdrawInvestment } = require('../controllers/investmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/plans', getPlans);
router.post('/', createInvestment);
router.get('/', getInvestments);
router.post('/:id/withdraw', withdrawInvestment);

module.exports = router;
