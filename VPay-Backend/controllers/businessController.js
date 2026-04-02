const BusinessRequest = require('../models/BusinessRequest');
const BusinessAnalytics = require('../models/BusinessAnalytics');

// @desc    Submit business account request
// @route   POST /api/v1/business/request
exports.submitRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      businessName,
      businessCategory,
      cacNumber,
      cacCertificate,
      businessEmail,
      businessPhone,
      businessAddress,
      estimatedMonthlyRevenue,
    } = req.body;

    if (!businessName || !businessCategory || !cacNumber) {
      return res.status(400).json({
        success: false,
        message: 'Business name, category, and CAC number are required',
      });
    }

    // Check if user already has a pending or approved request
    const existingRequests = await BusinessRequest.findByUserId(userId);
    const hasPendingOrApproved = existingRequests.some(
      (req) => req.status === 'pending' || req.status === 'approved'
    );

    if (hasPendingOrApproved) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved business request',
      });
    }

    const request = await BusinessRequest.create(userId, {
      businessName,
      businessCategory,
      cacNumber,
      cacCertificate,
      businessEmail,
      businessPhone,
      businessAddress,
      estimatedMonthlyRevenue,
    });

    res.status(201).json({
      success: true,
      message: 'Business request submitted successfully. We will review it shortly.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's business requests
// @route   GET /api/v1/business/requests
exports.getUserRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const requests = await BusinessRequest.findByUserId(userId);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all business requests (Admin only)
// @route   GET /api/v1/business/admin/requests
exports.getAllRequests = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    const requests = await BusinessRequest.findAll({ status, limit });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update business request status (Admin only)
// @route   PUT /api/v1/business/admin/requests/:id
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const reviewedBy = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected',
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const request = await BusinessRequest.updateStatus(
      id,
      status,
      reviewedBy,
      rejectionReason
    );

    res.status(200).json({
      success: true,
      message: `Business request ${status} successfully`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get business request stats (Admin only)
// @route   GET /api/v1/business/admin/stats
exports.getRequestStats = async (req, res, next) => {
  try {
    const stats = await BusinessRequest.getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get business analytics overview
// @route   GET /api/v1/business/analytics/overview
exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const overview = await BusinessAnalytics.getOverview(userId);

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get business monthly trends
// @route   GET /api/v1/business/analytics/trends
exports.getMonthlyTrends = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { months = 6 } = req.query;
    const trends = await BusinessAnalytics.getMonthlyTrends(userId, parseInt(months));

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top customers
// @route   GET /api/v1/business/analytics/customers
exports.getTopCustomers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    const customers = await BusinessAnalytics.getTopCustomers(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category breakdown
// @route   GET /api/v1/business/analytics/categories
exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categories = await BusinessAnalytics.getCategoryBreakdown(userId);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent business activity
// @route   GET /api/v1/business/analytics/activity
exports.getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;
    const activity = await BusinessAnalytics.getRecentActivity(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get growth rate
// @route   GET /api/v1/business/analytics/growth
exports.getGrowthRate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const growth = await BusinessAnalytics.getGrowthRate(userId);

    res.status(200).json({
      success: true,
      data: growth,
    });
  } catch (error) {
    next(error);
  }
};
