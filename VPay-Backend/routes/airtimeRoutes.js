const express = require('express');
const router = express.Router();
const { buyAirtime, getHistory } = require('../controllers/airtimeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/buy', buyAirtime);
router.get('/', getHistory);

module.exports = router;
