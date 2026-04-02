const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createSupportTicket } = require('../controllers/supportController');

router.use(protect);

router.post('/ticket', createSupportTicket);

module.exports = router;
