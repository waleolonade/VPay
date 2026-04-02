const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createLink, getMyLinks, getLinkBySlug, deactivateLink } = require('../controllers/paymentLinkController');

// Public route to view a payment link details
router.get('/:slug', getLinkBySlug);

// Protected routes
router.use(protect);
router.post('/', createLink);
router.get('/', getMyLinks);
router.put('/:id/deactivate', deactivateLink);

module.exports = router;
