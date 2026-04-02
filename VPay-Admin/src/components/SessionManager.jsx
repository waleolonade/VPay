import React, { useState, useEffect } from 'react';
import { Globe, LogOut, AlertCircle, Clock, Smartphone, Monitor, Trash2, LogOutIcon } from 'lucide-react';
import { fetchMyActiveSessions, terminateSession, terminateAllSessions, getSessionConfig, fetchSessionStats } from '../services/adminApi';

const SessionManager = () => {
  const [sessions, setSession] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [terminatingSessions, setTerminatingSessions] = useState(new Set());

  // Load sessions
  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchMyActiveSessions();
      setSession(data.sessions || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load config
  const loadConfig = async () => {
    try {
      const data = await getSessionConfig();
      setConfig(data);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const data = await fetchSessionStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadSessions();
    loadConfig();
    loadStats();
  }, []);

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) {
      return;
    }

    try {
      setTerminatingSessions(prev => new Set([...prev, sessionId]));
      await terminateSession(sessionId);
      setSession(prev => prev.filter(s => s.id !== sessionId));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setTerminatingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  const handleTerminateAllSessions = async () => {
    if (!window.confirm('Are you sure you want to terminate ALL sessions? You will be logged out.')) {
      return;
    }

    try {
      setLoading(true);
      await terminateAllSessions();
      setSession([]);
      setError('');
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    if (/windows/i.test(userAgent)) return 'Windows PC';
    if (/mac/i.test(userAgent)) return 'Mac';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Desktop';
  };

  const getDeviceIcon = (userAgent) => {
    const device = getDeviceType(userAgent);
    if (device.includes('Mobile')) return <Smartphone className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff < 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const isCurrentSession = (sessionId) => {
    // The first session in the list is typically the current one
    return sessions[0]?.id === sessionId;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Active Sessions</h2>
        {sessions.length > 1 && (
          <button
            onClick={handleTerminateAllSessions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            <LogOutIcon className="w-4 h-4" />
            Logout All
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Configuration Info */}
      {config && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-600 text-sm font-semibold">Session Timeout</p>
            <p className="text-lg font-bold text-blue-800">
              {Math.floor(config.sessionTimeout / 60)} minutes
            </p>
            <p className="text-xs text-blue-700 mt-1">Auto-logout after inactivity</p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-purple-600 text-sm font-semibold">Max Concurrent Sessions</p>
            <p className="text-lg font-bold text-purple-800">{config.maxConcurrentSessions}</p>
            <p className="text-xs text-purple-700 mt-1">Maximum sessions allowed</p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-600 text-sm font-semibold">Active Sessions</p>
            <p className="text-lg font-bold text-orange-800">{sessions.length}</p>
            <p className="text-xs text-orange-700 mt-1">Currently logged in</p>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 font-medium">No active sessions</p>
          <p className="text-sm text-gray-500 mt-1">You are not currently logged in</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, idx) => (
            <div
              key={session.id}
              className={`p-4 rounded-lg border transition-all ${
                isCurrentSession(session.id)
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-gray-600 flex-shrink-0">
                      {getDeviceIcon(session.user_agent)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">
                          {getDeviceType(session.user_agent)}
                        </h3>
                        {isCurrentSession(session.id) && (
                          <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {session.ip_address || 'Unknown IP'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Signed In</p>
                      <p className="text-gray-900 font-semibold">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {new Date(session.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 text-xs font-medium">Last Active</p>
                      <p className="text-gray-900 font-semibold">
                        {new Date(session.last_activity).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {new Date(session.last_activity).toLocaleTimeString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 text-xs font-medium">Expires In</p>
                      <p className={`font-semibold ${getTimeRemaining(session.expires_at).includes('Expired') ? 'text-red-600' : 'text-gray-900'}`}>
                        {getTimeRemaining(session.expires_at)}
                      </p>
                    </div>
                  </div>

                  {session.ip_address && (
                    <div className="mt-3 p-3 bg-gray-100 rounded text-sm text-gray-700">
                      <code className="text-xs">{session.ip_address}</code>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleTerminateSession(session.id)}
                  disabled={terminatingSessions.has(session.id)}
                  className="ml-4 flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="End this session"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {isCurrentSession(session.id) && (
                <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>This is your current session. Ending it will log you out.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {stats && !loading && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Session Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Total Sessions Today</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalSessionsToday || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Avg Session Duration</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {stats.avgDuration ? Math.floor(stats.avgDuration / 60) + ' min' : '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Most Active Device</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{stats.mostActiveDevice || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager;
