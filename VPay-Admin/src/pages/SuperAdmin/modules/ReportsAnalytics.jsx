import React, { useEffect, useState } from 'react';
import { fetchStats, fetchAnalytics } from '../../../services/adminApi';

const ReportsAnalytics = () => {
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchStats().catch(() => ({})),
      fetchAnalytics().catch(() => ({}))
    ])
      .then(([statsData, analyticsData]) => {
        setStats(statsData || {});
        setAnalytics(analyticsData || {});
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load reports');
        setLoading(false);
      });
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">Reports & Analytics</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">View daily transactions, monthly revenue, user growth, top users, and fraud statistics.</p>
        {loading && <div>Loading analytics...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-2">
            <li className="text-brand-blue">Total Transactions: <b>{stats.totalTransactions || 0}</b></li>
            <li className="text-brand-green">Total Users: <b>{stats.totalUsers || 0}</b></li>
            <li className="text-brand-dark">Total Revenue: <b>₦{(stats.totalRevenue || 0).toLocaleString()}</b></li>
            <li className="text-yellow-600">Active Sessions: <b>{stats.activeSessions || 0}</b></li>
            <li className="text-red-600">Fraud Alerts: <b>{stats.fraudAlerts || 0}</b></li>
          </ul>
        )}
      </div>
    </section>
  );
};

export default ReportsAnalytics;
