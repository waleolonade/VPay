// API service for Super Admin security modules
const API_BASE = '/api/admin/security';

export async function fetchAdminLogs() {
  const res = await fetch(`${API_BASE}/admin-logs`);
  if (!res.ok) throw new Error('Failed to fetch admin logs');
  return res.json();
}

export async function fetchLoginAlerts() {
  const res = await fetch(`${API_BASE}/login-alerts`);
  if (!res.ok) throw new Error('Failed to fetch login alerts');
  return res.json();
}

export async function fetchSuspiciousActivities() {
  const res = await fetch(`${API_BASE}/suspicious-activities`);
  if (!res.ok) throw new Error('Failed to fetch suspicious activities');
  return res.json();
}
