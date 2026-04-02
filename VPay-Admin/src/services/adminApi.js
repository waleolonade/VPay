// API service for all Super Admin modules
const API_BASE = '/api/admin';

// Security APIs
export async function fetchAdminLogs() {
  const res = await fetch(`${API_BASE}/security/admin-logs`);
  if (!res.ok) throw new Error('Failed to fetch admin logs');
  return res.json();
}

export async function fetchLoginAlerts() {
  const res = await fetch(`${API_BASE}/security/login-alerts`);
  if (!res.ok) throw new Error('Failed to fetch login alerts');
  return res.json();
}

export async function fetchSuspiciousActivities() {
  const res = await fetch(`${API_BASE}/security/suspicious-activities`);
  if (!res.ok) throw new Error('Failed to fetch suspicious activities');
  return res.json();
}

// User Management APIs
export async function fetchAllUsers(page = 1, limit = 100) {
  const res = await fetch(`${API_BASE}/users?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getUserById(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function updateKYC(userId, status) {
  const res = await fetch(`${API_BASE}/users/${userId}/kyc`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update KYC');
  return res.json();
}

export async function freezeAccount(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}/wallet/freeze`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ freeze: true }),
  });
  if (!res.ok) throw new Error('Failed to freeze account');
  return res.json();
}

// Wallet Management APIs
export async function fetchWallets(page = 1, limit = 100) {
  const res = await fetch(`${API_BASE}/wallets?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch wallets');
  return res.json();
}

// Transaction Management APIs
export async function fetchTransactions(page = 1, limit = 100) {
  const res = await fetch(`${API_BASE}/transactions?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function reverseTransaction(transactionId) {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to reverse transaction');
  return res.json();
}

// Analytics APIs
export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// Stats APIs
export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// Super Admin APIs - Role & Permission Management
const SUPERADMIN_BASE = '/api/superadmin';

export async function fetchAllAdmins() {
  const res = await fetch(`${SUPERADMIN_BASE}/admins`);
  if (!res.ok) throw new Error('Failed to fetch admins');
  return res.json();
}

export async function getAdminById(adminId) {
  const res = await fetch(`${SUPERADMIN_BASE}/admins/${adminId}`);
  if (!res.ok) throw new Error('Failed to fetch admin');
  return res.json();
}

export async function assignAdminRole(adminId, role) {
  const res = await fetch(`${SUPERADMIN_BASE}/admins/${adminId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Failed to assign role');
  return res.json();
}

export async function deactivateAdmin(adminId) {
  const res = await fetch(`${SUPERADMIN_BASE}/admins/${adminId}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to deactivate admin');
  return res.json();
}

export async function reactivateAdmin(adminId) {
  const res = await fetch(`${SUPERADMIN_BASE}/admins/${adminId}/reactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to reactivate admin');
  return res.json();
}

export async function fetchAvailableRoles() {
  const res = await fetch(`${SUPERADMIN_BASE}/roles/available`);
  if (!res.ok) throw new Error('Failed to fetch available roles');
  return res.json();
}

export async function fetchRolePermissions() {
  const res = await fetch(`${SUPERADMIN_BASE}/permissions/roles`);
  if (!res.ok) throw new Error('Failed to fetch role permissions');
  return res.json();
}

// ===== 2FA (Two-Factor Authentication) APIs =====
const TWO_FA_BASE = '/api/admin/2fa';

export async function generateTOTPSecret() {
  const res = await fetch(`${TWO_FA_BASE}/generate-secret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to generate TOTP secret');
  return res.json();
}

export async function enableTwoFactorAuth(token, secret, backupCodes) {
  const res = await fetch(`${TWO_FA_BASE}/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, secret, backupCodes }),
  });
  if (!res.ok) throw new Error('Failed to enable 2FA');
  return res.json();
}

export async function verifyTOTPCode(token) {
  const res = await fetch(`${TWO_FA_BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('Failed to verify TOTP code');
  return res.json();
}

export async function disableTwoFactorAuth(password) {
  const res = await fetch(`${TWO_FA_BASE}/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Failed to disable 2FA');
  return res.json();
}

export async function get2FAStatus() {
  const res = await fetch(`${TWO_FA_BASE}/status`);
  if (!res.ok) throw new Error('Failed to get 2FA status');
  return res.json();
}

export async function generateBackupCodes() {
  const res = await fetch(`${TWO_FA_BASE}/generate-backup-codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to generate backup codes');
  return res.json();
}

// ===== Activity Logging APIs =====
const ACTIVITY_LOG_BASE = '/api/admin/activity-logs';

export async function fetchActivityLogs(page = 1, limit = 50, filters = {}) {
  let url = `${ACTIVITY_LOG_BASE}/?page=${page}&limit=${limit}`;
  Object.entries(filters).forEach(([key, value]) => {
    if (value) url += `&${key}=${value}`;
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch activity logs');
  return res.json();
}

export async function fetchRecentActivityLogs(limit = 50) {
  const res = await fetch(`${ACTIVITY_LOG_BASE}/recent?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recent activity logs');
  return res.json();
}

export async function fetchAdminActivityLogs(adminId, page = 1, limit = 50) {
  const res = await fetch(`${ACTIVITY_LOG_BASE}/admin/${adminId}?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch admin activity logs');
  return res.json();
}

export async function fetchActivityStats(days = 30) {
  const res = await fetch(`${ACTIVITY_LOG_BASE}/stats/overview?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch activity statistics');
  return res.json();
}

// ===== Session Management APIs =====
const SESSION_BASE = '/api/admin/sessions';

export async function fetchMyActiveSessions() {
  const res = await fetch(`${SESSION_BASE}/my-sessions`);
  if (!res.ok) throw new Error('Failed to fetch active sessions');
  return res.json();
}

export async function fetchAdminSessions(adminId) {
  const res = await fetch(`${SESSION_BASE}/admin/${adminId}`);
  if (!res.ok) throw new Error('Failed to fetch admin sessions');
  return res.json();
}

export async function terminateSession(sessionId) {
  const res = await fetch(`${SESSION_BASE}/terminate/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to terminate session');
  return res.json();
}

export async function terminateAllSessions() {
  const res = await fetch(`${SESSION_BASE}/terminate-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to terminate all sessions');
  return res.json();
}

export async function getSessionConfig() {
  const res = await fetch(`${SESSION_BASE}/config`);
  if (!res.ok) throw new Error('Failed to get session config');
  return res.json();
}

export async function fetchSessionStats() {
  const res = await fetch(`${SESSION_BASE}/stats/global`);
  if (!res.ok) throw new Error('Failed to fetch session statistics');
  return res.json();
}

export async function validateSession() {
  const res = await fetch(`${SESSION_BASE}/validate`);
  if (!res.ok) throw new Error('Failed to validate session');
  return res.json();
}

// ===== IP Whitelist APIs =====
const IP_WHITELIST_BASE = '/api/admin/ip-whitelist';

export async function fetchMyWhitelistedIPs() {
  const res = await fetch(`${IP_WHITELIST_BASE}/my-whitelist`);
  if (!res.ok) throw new Error('Failed to fetch whitelisted IPs');
  return res.json();
}

export async function getIPWhitelistStatus() {
  const res = await fetch(`${IP_WHITELIST_BASE}/status`);
  if (!res.ok) throw new Error('Failed to get IP whitelist status');
  return res.json();
}

export async function addWhitelistedIP(ipAddress, description = '') {
  const res = await fetch(`${IP_WHITELIST_BASE}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ipAddress, description }),
  });
  if (!res.ok) throw new Error('Failed to add whitelisted IP');
  return res.json();
}

export async function removeWhitelistedIP(ipAddress) {
  const res = await fetch(`${IP_WHITELIST_BASE}/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ipAddress }),
  });
  if (!res.ok) throw new Error('Failed to remove whitelisted IP');
  return res.json();
}

export async function autoDiscoverCurrentIP() {
  const res = await fetch(`${IP_WHITELIST_BASE}/auto-discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to auto-discover current IP');
  return res.json();
}

export async function enableIPWhitelist() {
  const res = await fetch(`${IP_WHITELIST_BASE}/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to enable IP whitelist');
  return res.json();
}

export async function disableIPWhitelist() {
  const res = await fetch(`${IP_WHITELIST_BASE}/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to disable IP whitelist');
  return res.json();
}

export async function fetchIPActivity() {
  const res = await fetch(`${IP_WHITELIST_BASE}/activity`);
  if (!res.ok) throw new Error('Failed to fetch IP activity');
  return res.json();
}

// ===== Notifications APIs =====
const NOTIFICATIONS_BASE = '/api/notifications';

export async function fetchMyNotifications(page = 1, limit = 50, unreadOnly = false) {
  const res = await fetch(`${NOTIFICATIONS_BASE}/my-notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function getUnreadNotificationCount() {
  const res = await fetch(`${NOTIFICATIONS_BASE}/unread-count`);
  if (!res.ok) throw new Error('Failed to get unread count');
  return res.json();
}

export async function markNotificationAsRead(notificationId) {
  const res = await fetch(`${NOTIFICATIONS_BASE}/${notificationId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

export async function markAllNotificationsAsRead() {
  const res = await fetch(`${NOTIFICATIONS_BASE}/mark-all/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
  return res.json();
}

export async function deleteNotification(notificationId) {
  const res = await fetch(`${NOTIFICATIONS_BASE}/${notificationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to delete notification');
  return res.json();
}

export async function sendNotification(userIds, title, message, channels = ['in_app'], data = {}) {
  const res = await fetch(`${NOTIFICATIONS_BASE}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds, title, message, channels, data }),
  });
  if (!res.ok) throw new Error('Failed to send notification');
  return res.json();
}

export async function sendBroadcast(title, message, userIds = [], channels = ['in_app']) {
  const res = await fetch(`${NOTIFICATIONS_BASE}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, message, userIds, channels }),
  });
  if (!res.ok) throw new Error('Failed to send broadcast');
  return res.json();
}

export async function fetchNotificationTemplates() {
  const res = await fetch(`${NOTIFICATIONS_BASE}/templates`);
  if (!res.ok) throw new Error('Failed to fetch notification templates');
  return res.json();
}
