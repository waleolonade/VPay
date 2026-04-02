const express = require('express');
const router = express.Router();
const {
  submitRequest,
  getUserRequests,
  getAllRequests,
  updateRequestStatus,
  getRequestStats,
  getAnalyticsOverview,
  getMonthlyTrends,
  getTopCustomers,
  getCategoryBreakdown,
  getRecentActivity,
  getGrowthRate,
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');

// Business Request Routes
router.post('/request', protect, submitRequest);
router.get('/requests', protect, getUserRequests);

// Analytics Routes
router.get('/analytics/overview', protect, getAnalyticsOverview);
router.get('/analytics/trends', protect, getMonthlyTrends);
router.get('/analytics/customers', protect, getTopCustomers);
router.get('/analytics/categories', protect, getCategoryBreakdown);
router.get('/analytics/activity', protect, getRecentActivity);
router.get('/analytics/growth', protect, getGrowthRate);

// Admin Routes
router.get('/admin/requests', protect, authorize('admin'), getAllRequests);
router.put('/admin/requests/:id', protect, authorize('admin'), updateRequestStatus);
router.get('/admin/stats', protect, authorize('admin'), getRequestStats);

module.exports = router;
