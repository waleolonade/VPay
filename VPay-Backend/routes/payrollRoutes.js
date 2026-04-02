const express = require('express');
const router = express.Router();
const { 
  addStaff, 
  getStaff, 
  updateStaff, 
  processPayroll, 
  getStats 
} = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');

// All payroll routes require authentication
router.use(protect);

router.route('/staff')
  .post(addStaff)
  .get(getStaff);

router.route('/staff/:id')
  .put(updateStaff);

router.post('/pay', processPayroll);
router.get('/stats', getStats);

module.exports = router;
