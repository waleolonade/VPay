const express = require('express');
const router = express.Router();
const { getPlans, buyData, getHistory } = require('../controllers/dataController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/plans/:network', getPlans);
router.post('/buy', buyData);
router.get('/', getHistory);

module.exports = router;
