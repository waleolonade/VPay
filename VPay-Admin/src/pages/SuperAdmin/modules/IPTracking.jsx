import React, { useEffect, useState } from 'react';
import { fetchLoginAlerts } from '../../../services/adminSecurityApi';

const IPTracking = () => {
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLoginAlerts()
      .then(data => {
        setLogins(data.alerts || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load login IPs');
        setLoading(false);
      });
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">IP Tracking</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">Monitor and log all user/admin login IP addresses. Detect unusual IPs and flag suspicious activity.</p>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th>User</th>
                <th>Role</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logins.length === 0 && (
                <tr><td colSpan={6} className="text-gray-500">No login records found.</td></tr>
              )}
              {logins.map(login => (
                <tr key={login.id} className="border-b">
                  <td>{login.user_name || login.userId}</td>
                  <td>{login.role || 'User'}</td>
                  <td>{login.ip}</td>
                  <td>{login.location || '-'}</td>
                  <td>{login.created_at ? new Date(login.created_at).toLocaleString() : '-'}</td>
                  <td>
                    <span className={
                      login.status === 'suspicious' ? 'text-red-600 font-semibold' :
                      'text-green-600 font-semibold'
                    }>
                      {login.status === 'suspicious' ? 'Suspicious' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default IPTracking;
