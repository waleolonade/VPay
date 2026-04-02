const express = require('express');
const router = express.Router();
const {
  getPromotions,
  getPersonalizedOffers,
  getCashbackOffers,
  trackPromotion,
} = require('../controllers/promotionsController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getPromotions);
router.get('/personalized', getPersonalizedOffers);
router.get('/cashback', getCashbackOffers);
router.post('/track', trackPromotion);

module.exports = router;
