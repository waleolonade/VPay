import React, { useEffect, useState } from 'react';
import { fetchSuspiciousActivities } from '../../../services/adminSecurityApi';

const SuspiciousActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuspiciousActivities()
      .then(data => {
        setActivities(data.activities || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load suspicious activities');
        setLoading(false);
      });
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">Suspicious Activity Detection</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">Monitor and investigate suspicious activities across the platform. Take action on flagged accounts or transactions.</p>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-2">
            {activities.length === 0 && <li className="text-gray-500">No suspicious activities found.</li>}
            {activities.map(activity => (
              <li key={activity.id} className={
                `flex items-center gap-2 ${
                  activity.status === 'suspicious' ? 'text-red-700' :
                  activity.status === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`
              }>
                <span>{
                  activity.status === 'suspicious' ? '🚩' :
                  activity.status === 'warning' ? '⚠️' : '🔍'
                }</span>
                {activity.activity_type || activity.type} for <b>{activity.user_name || activity.userId}</b>
                {activity.details && <span className="ml-2 text-xs text-gray-400">[{activity.details}]</span>}
                {activity.ip && <span className="ml-2 text-xs text-gray-400">IP: {activity.ip}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default SuspiciousActivity;
