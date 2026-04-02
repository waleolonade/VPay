/**
 * Super Admin Routes
 * Routes accessible only to superadmin users for managing other admins and system-wide settings
 */

const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAdminById,
  assignRole,
  deactivateAdmin,
  reactivateAdmin,
  getRolePermissions,
  getAvailableRoles
} = require('../controllers/superAdminController');
const { protect } = require('../middleware/auth');
const { superadminOnly } = require('../middleware/permissions');

// All super admin routes require authentication and superadmin role
router.use(protect, superadminOnly);

/**
 * Admin Management Routes
 */
router.get('/admins', getAllAdmins);
router.get('/admins/:adminId', getAdminById);
router.patch('/admins/:adminId/role', assignRole);
router.post('/admins/:adminId/deactivate', deactivateAdmin);
router.post('/admins/:adminId/reactivate', reactivateAdmin);

/**
 * Role & Permission Reference Routes
 */
router.get('/roles/available', getAvailableRoles);
router.get('/permissions/roles', getRolePermissions);

module.exports = router;
