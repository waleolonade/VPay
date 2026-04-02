const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getRewardsSummary } = require('../controllers/rewardsController');

router.use(protect);

router.get('/', getRewardsSummary);

module.exports = router;
