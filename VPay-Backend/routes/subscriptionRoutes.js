const express = require('express');
const { createSubscription, getSubscriptions, cancelSubscription } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(createSubscription)
    .get(getSubscriptions);

router.post('/:id/cancel', cancelSubscription);

module.exports = router;
