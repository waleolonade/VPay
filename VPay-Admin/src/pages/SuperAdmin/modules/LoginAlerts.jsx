import React, { useEffect, useState } from 'react';
import { fetchLoginAlerts } from '../../../services/adminSecurityApi';

const LoginAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLoginAlerts()
      .then(data => {
        setAlerts(data.alerts || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load login alerts');
        setLoading(false);
      });
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">Login Alerts</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">View and manage login alerts for all users and admins. Alerts are triggered by new device logins, failed attempts, or location changes.</p>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-2">
            {alerts.length === 0 && <li className="text-gray-500">No alerts found.</li>}
            {alerts.map(alert => (
              <li key={alert.id} className={
                `flex items-center gap-2 ${
                  alert.status === 'suspicious' ? 'text-red-700' :
                  alert.status === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`
              }>
                <span>{
                  alert.status === 'suspicious' ? '🚨' :
                  alert.status === 'warning' ? '⚠️' : '🔔'
                }</span>
                {alert.alert_type || alert.type} for <b>{alert.user_name || alert.userId}</b> ({alert.role || 'User'})
                {alert.device && <span className="ml-2 text-xs text-gray-400">[{alert.device}]</span>}
                {alert.ip && <span className="ml-2 text-xs text-gray-400">IP: {alert.ip}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default LoginAlerts;
