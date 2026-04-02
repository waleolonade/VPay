const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', cardController.getCards);
router.post('/virtual', cardController.requestVirtualCard);
router.patch('/:id/status', cardController.toggleCardStatus);
router.get('/:id/details', cardController.getCardDetails);

module.exports = router;
