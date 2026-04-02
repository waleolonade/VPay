import React, { useEffect, useState } from 'react';
import { fetchSuspiciousActivities, fetchLoginAlerts } from '../../../services/adminApi';

const FraudSecurity = () => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchSuspiciousActivities().catch(() => ({ activities: [] })),
      fetchLoginAlerts().catch(() => ({ alerts: [] }))
    ])
      .then(([susp, alerts]) => {
        const combined = [
          ...(susp.activities || []).map(a => ({ ...a, type: 'suspicious' })),
          ...(alerts.alerts || []).map(a => ({ ...a, type: 'login' }))
        ];
        setThreats(combined);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load fraud alerts');
        setLoading(false);
      });
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">Fraud & Security</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">Monitor suspicious activity, login monitoring, device/IP tracking, and block suspicious accounts.</p>
        {loading && <div>Loading security alerts...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-2">
            {threats.length === 0 && <li className="text-gray-500">No security threats detected.</li>}
            {threats.map(threat => (
              <li key={threat.id} className={`flex items-center gap-2 ${threat.status === 'suspicious' ? 'text-red-700' : 'text-yellow-700'}`}>
                <span>{threat.status === 'suspicious' ? '🚨' : '⚠️'}</span>
                {threat.activity_type || threat.alert_type || 'Security Alert'} for <b>{threat.user_name || threat.userId}</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default FraudSecurity;
