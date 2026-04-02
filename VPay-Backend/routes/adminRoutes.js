const express = require('express');
const router = express.Router();
const { getStats, getAnalytics, getRecentActivity, getUsers, getUserById, updateKYC, freezeWallet, approveLoan, rejectLoan, sendNotification } = require('../controllers/adminController');
const { getAdminLogs, getLoginAlerts, getSuspiciousActivities } = require('../controllers/adminSecurityController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission, checkAnyPermission, superadminOnly } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/permissions');

// All admin routes require authentication and admin/superadmin role
router.use(protect, authorize('admin', 'superadmin'));

// ===== STATISTICS & ANALYTICS =====
router.get('/stats', checkPermission(PERMISSIONS.VIEW_ANALYTICS), getStats);
router.get('/analytics', checkPermission(PERMISSIONS.VIEW_ANALYTICS), getAnalytics);
router.get('/recent-activity', checkPermission(PERMISSIONS.VIEW_REPORTS), getRecentActivity);

// ===== USER MANAGEMENT =====
router.get('/users', checkPermission(PERMISSIONS.VIEW_USERS), getUsers);
router.get('/users/:id', checkPermission(PERMISSIONS.VIEW_USERS), getUserById);
router.patch('/users/:id/kyc', checkPermission(PERMISSIONS.MANAGE_KYC), updateKYC);
router.patch('/users/:id/wallet/freeze', checkPermission(PERMISSIONS.FREEZE_WALLETS), freezeWallet);

// ===== LOAN MANAGEMENT =====
router.patch('/loans/:id/approve', checkPermission(PERMISSIONS.MANAGE_LOANS), approveLoan);
router.patch('/loans/:id/reject', checkPermission(PERMISSIONS.MANAGE_LOANS), rejectLoan);

// ===== NOTIFICATIONS =====
router.post('/notifications', checkPermission(PERMISSIONS.SEND_NOTIFICATIONS), sendNotification);

// ===== SECURITY & MONITORING =====
router.get('/security/admin-logs', checkPermission(PERMISSIONS.VIEW_ADMIN_LOGS), getAdminLogs);
router.get('/security/login-alerts', checkPermission(PERMISSIONS.VIEW_LOGIN_ALERTS), getLoginAlerts);
router.get('/security/suspicious-activities', checkPermission(PERMISSIONS.VIEW_SUSPICIOUS_ACTIVITIES), getSuspiciousActivities);

module.exports = router;
