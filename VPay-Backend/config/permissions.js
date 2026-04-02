/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines roles and their associated permissions
 */

const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
};

const PERMISSIONS = {
  // User Management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  FREEZE_ACCOUNTS: 'freeze_accounts',
  UNLOCK_ACCOUNTS: 'unlock_accounts',

  // Wallet Management
  VIEW_WALLETS: 'view_wallets',
  MANAGE_WALLETS: 'manage_wallets',
  FREEZE_WALLETS: 'freeze_wallets',

  // Transaction Management
  VIEW_TRANSACTIONS: 'view_transactions',
  REVERSE_TRANSACTIONS: 'reverse_transactions',
  CANCEL_TRANSACTIONS: 'cancel_transactions',

  // Security & Monitoring
  VIEW_LOGIN_ALERTS: 'view_login_alerts',
  VIEW_SUSPICIOUS_ACTIVITIES: 'view_suspicious_activities',
  VIEW_ADMIN_LOGS: 'view_admin_logs',
  MANAGE_SECURITY: 'manage_security',

  // IP Tracking
  VIEW_IP_TRACKING: 'view_ip_tracking',
  MANAGE_IP_WHITELIST: 'manage_ip_whitelist',

  // Loans & Investments
  MANAGE_LOANS: 'manage_loans',
  MANAGE_INVESTMENTS: 'manage_investments',

  // KYC & Verification
  VIEW_KYC: 'view_kyc',
  MANAGE_KYC: 'manage_kyc',
  VERIFY_DOCUMENTS: 'verify_documents',

  // Reports & Analytics
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYTICS: 'view_analytics',

  // Notifications
  SEND_NOTIFICATIONS: 'send_notifications',
  VIEW_NOTIFICATIONS: 'view_notifications',

  // System Management
  MANAGE_SYSTEM: 'manage_system',
  VIEW_SYSTEM_LOGS: 'view_system_logs',
  MANAGE_ADMINS: 'manage_admins',

  // Payments
  VIEW_PAYMENTS: 'view_payments',
  MANAGE_PAYMENTS: 'manage_payments'
};

/**
 * Role-to-Permissions mapping
 * Defines which permissions each role has
 */
const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: [
    // Superadmin has all permissions
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.FREEZE_ACCOUNTS,
    PERMISSIONS.UNLOCK_ACCOUNTS,
    PERMISSIONS.VIEW_WALLETS,
    PERMISSIONS.MANAGE_WALLETS,
    PERMISSIONS.FREEZE_WALLETS,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.REVERSE_TRANSACTIONS,
    PERMISSIONS.CANCEL_TRANSACTIONS,
    PERMISSIONS.VIEW_LOGIN_ALERTS,
    PERMISSIONS.VIEW_SUSPICIOUS_ACTIVITIES,
    PERMISSIONS.VIEW_ADMIN_LOGS,
    PERMISSIONS.MANAGE_SECURITY,
    PERMISSIONS.VIEW_IP_TRACKING,
    PERMISSIONS.MANAGE_IP_WHITELIST,
    PERMISSIONS.MANAGE_LOANS,
    PERMISSIONS.MANAGE_INVESTMENTS,
    PERMISSIONS.VIEW_KYC,
    PERMISSIONS.MANAGE_KYC,
    PERMISSIONS.VERIFY_DOCUMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_SYSTEM_LOGS,
    PERMISSIONS.MANAGE_ADMINS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.MANAGE_PAYMENTS
  ],

  [ROLES.ADMIN]: [
    // Admin can do most things except manage other admins and system
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.FREEZE_ACCOUNTS,
    PERMISSIONS.UNLOCK_ACCOUNTS,
    PERMISSIONS.VIEW_WALLETS,
    PERMISSIONS.MANAGE_WALLETS,
    PERMISSIONS.FREEZE_WALLETS,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.REVERSE_TRANSACTIONS,
    PERMISSIONS.CANCEL_TRANSACTIONS,
    PERMISSIONS.VIEW_LOGIN_ALERTS,
    PERMISSIONS.VIEW_SUSPICIOUS_ACTIVITIES,
    PERMISSIONS.VIEW_ADMIN_LOGS,
    PERMISSIONS.MANAGE_SECURITY,
    PERMISSIONS.VIEW_IP_TRACKING,
    PERMISSIONS.MANAGE_LOANS,
    PERMISSIONS.MANAGE_INVESTMENTS,
    PERMISSIONS.VIEW_KYC,
    PERMISSIONS.MANAGE_KYC,
    PERMISSIONS.VERIFY_DOCUMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.MANAGE_PAYMENTS
  ],

  [ROLES.MODERATOR]: [
    // Moderator has limited permissions - mostly viewing
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_WALLETS,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.VIEW_LOGIN_ALERTS,
    PERMISSIONS.VIEW_SUSPICIOUS_ACTIVITIES,
    PERMISSIONS.VIEW_IP_TRACKING,
    PERMISSIONS.VIEW_KYC,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.SEND_NOTIFICATIONS
  ],

  [ROLES.USER]: [
    // Regular users have minimal permissions
  ]
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Array} Array of permissions
 */
const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
const hasPermission = (role, permission) => {
  if (role === ROLES.SUPERADMIN) {
    // Superadmin always has all permissions
    return true;
  }
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - User role
 * @param {Array} permissionList - Array of permissions
 * @returns {boolean} True if role has at least one permission
 */
const hasAnyPermission = (role, permissionList) => {
  if (role === ROLES.SUPERADMIN) {
    return true;
  }
  const permissions = getPermissionsForRole(role);
  return permissionList.some(permission => permissions.includes(permission));
};

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - User role
 * @param {Array} permissionList - Array of permissions
 * @returns {boolean} True if role has all permissions
 */
const hasAllPermissions = (role, permissionList) => {
  if (role === ROLES.SUPERADMIN) {
    return true;
  }
  const permissions = getPermissionsForRole(role);
  return permissionList.every(permission => permissions.includes(permission));
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
};
