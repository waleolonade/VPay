const express = require('express');
const router = express.Router();
const { createPlan, getPlans, getSummary, getPlanById, fundPlan, withdrawPlan, updateAutoSave } = require('../controllers/savingsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createPlan);
router.get('/', getPlans);
router.get('/summary', getSummary);
router.get('/:id', getPlanById);
router.post('/:id/fund', fundPlan);
router.post('/:id/withdraw', withdrawPlan);
router.patch('/:id/auto-save', updateAutoSave);

module.exports = router;
