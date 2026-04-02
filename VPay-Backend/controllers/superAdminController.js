/**
 * Super Admin Controller
 * Advanced admin functions including role management and permission assignment
 * Only accessible to superadmin users
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { ROLES } = require('../config/permissions');

/**
 * Get all admins and their roles
 */
const getAllAdmins = async (req, res) => {
  try {
    const [admins] = await pool.query(`
      SELECT id, name, email, role, isActive, createdAt, updatedAt
      FROM admins
      ORDER BY createdAt DESC
    `);

    logger.info(`[SUPERADMIN] Fetched ${admins.length} admins`);
    return res.status(200).json({
      success: true,
      data: admins,
      total: admins.length
    });
  } catch (error) {
    logger.error(`[SUPERADMIN] Error fetching admins: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
      error: error.message
    });
  }
};

/**
 * Get single admin details with permissions
 */
const getAdminById = async (req, res) => {
  try {
    const { adminId } = req.params;

    const [admins] = await pool.query(`
      SELECT id, name, email, role, isActive, createdAt, updatedAt
      FROM admins
      WHERE id = ?
    `, [adminId]);

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    logger.info(`[SUPERADMIN] Fetched admin: ${admins[0].email}`);
    return res.status(200).json({
      success: true,
      data: admins[0]
    });
  } catch (error) {
    logger.error(`[SUPERADMIN] Error fetching admin: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin',
      error: error.message
    });
  }
};

/**
 * Assign or update admin role
 */
const assignRole = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`
      });
    }

    // Don't allow removing superadmin role if only one superadmin exists
    if (role !== ROLES.SUPERADMIN) {
      const [superadmins] = await pool.query(`
        SELECT COUNT(*) as count FROM admins WHERE role = ?
      `, [ROLES.SUPERADMIN]);

      if (superadmins[0].count === 1) {
        const [currentAdmin] = await pool.query(`
          SELECT role FROM admins WHERE id = ?
        `, [adminId]);

        if (currentAdmin[0]?.role === ROLES.SUPERADMIN) {
          return res.status(400).json({
            success: false,
            message: 'Cannot remove the only superadmin. Assign another superadmin first.'
          });
        }
      }
    }

    await pool.query(`
      UPDATE admins
      SET role = ?, updatedAt = NOW()
      WHERE id = ?
    `, [role, adminId]);

    logger.warn(`[SUPERADMIN] Admin ${adminId} role changed to ${role} by suer ${req.user.id}`);

    return res.status(200).json({
      success: true,
      message: `Admin role updated to ${role}`,
      data: { adminId, role }
    });
  } catch (error) {
    logger.error(`[SUPERADMIN] Error assigning role: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign role',
      error: error.message
    });
  }
};

/**
 * Deactivate/Disable an admin
 */
const deactivateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Don't allow deactivating self
    if (adminId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Check if this is the only active superadmin
    const [superadmins] = await pool.query(`
      SELECT COUNT(*) as count FROM admins WHERE role = ? AND isActive = true
    `, [ROLES.SUPERADMIN]);

    const [targetAdmin] = await pool.query(`
      SELECT role FROM admins WHERE id = ?
    `, [adminId]);

    if (targetAdmin[0]?.role === ROLES.SUPERADMIN && superadmins[0].count === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate the only active superadmin'
      });
    }

    await pool.query(`
      UPDATE admins
      SET isActive = false, updatedAt = NOW()
      WHERE id = ?
    `, [adminId]);

    logger.warn(`[SUPERADMIN] Admin ${adminId} deactivated by user ${req.user.id}`);

    return res.status(200).json({
      success: true,
      message: 'Admin account deactivated'
    });
  } catch (error) {
    logger.error(`[SUPERADMIN] Error deactivating admin: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate admin',
      error: error.message
    });
  }
};

/**
 * Reactivate a deactivated admin
 */
const reactivateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    await pool.query(`
      UPDATE admins
      SET isActive = true, updatedAt = NOW()
      WHERE id = ?
    `, [adminId]);

    logger.info(`[SUPERADMIN] Admin ${adminId} reactivated by user ${req.user.id}`);

    return res.status(200).json({
      success: true,
      message: 'Admin account reactivated'
    });
  } catch (error) {
    logger.error(`[SUPERADMIN] Error reactivating admin: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to reactivate admin',
      error: error.message
    });
  }
};

/**
 * Get role-based permission reference
 */
const getRolePermissions = async (req, res) => {
  try {
    const { ROLE_PERMISSIONS } = require('../config/permissions');

    return res.status(200).json({
      success: true,
      message: 'Role-based permissions reference',
      data: ROLE_PERMISSIONS
    });
  } catch (error) {
    logger.error(`[SUPERADMIN] Error fetching role permissions: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions',
      error: error.message
    });
  }
};

/**
 * Get available roles
 */
const getAvailableRoles = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Available admin roles',
      data: Object.values(ROLES)
    });
  } catch (error) {
    logger.error(`[SUPERADMIN] Error fetching roles: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

module.exports = {
  getAllAdmins,
  getAdminById,
  assignRole,
  deactivateAdmin,
  reactivateAdmin,
  getRolePermissions,
  getAvailableRoles
};
