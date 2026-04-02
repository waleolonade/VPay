const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createSplit, getMySplits, getSplitDetails, paySplit } = require('../controllers/splitController');

router.use(protect);
router.post('/', createSplit);
router.get('/', getMySplits);
router.get('/:id', getSplitDetails);
router.post('/:id/pay', paySplit);

module.exports = router;
