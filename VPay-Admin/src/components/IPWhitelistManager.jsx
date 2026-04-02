import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, AlertCircle, Copy, Download, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  fetchMyWhitelistedIPs,
  getIPWhitelistStatus,
  addWhitelistedIP,
  removeWhitelistedIP,
  enableIPWhitelist,
  disableIPWhitelist,
  autoDiscoverCurrentIP,
  fetchIPActivity,
} from '../services/adminApi';

const IPWhitelistManager = () => {
  const [ips, setIps] = useState([]);
  const [status, setStatus] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [isAddingIP, setIsAddingIP] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load whitelist
  const loadWhitelist = async () => {
    try {
      setLoading(true);
      const data = await fetchMyWhitelistedIPs();
      setIps(data.ips || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load status
  const loadStatus = async () => {
    try {
      const data = await getIPWhitelistStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  // Load activity
  const loadActivity = async () => {
    try {
      const data = await fetchIPActivity();
      setActivity(data.activity || []);
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  };

  useEffect(() => {
    loadWhitelist();
    loadStatus();
    loadActivity();
  }, []);

  // Add IP
  const handleAddIP = async (e) => {
    e.preventDefault();

    if (!newIP.trim()) {
      setError('Please enter an IP address');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$|^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}\/\d{1,3}$/i;

    if (!ipRegex.test(newIP) && !cidrRegex.test(newIP)) {
      setError('Invalid IP address format. Use IPv4 (x.x.x.x) or CIDR notation (x.x.x.x/24)');
      return;
    }

    try {
      setIsSubmitting(true);
      await addWhitelistedIP(newIP, description);
      setNewIP('');
      setDescription('');
      setIsAddingIP(false);
      setSuccess('IP address added successfully');
      setTimeout(() => setSuccess(''), 3000);
      loadWhitelist();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove IP
  const handleRemoveIP = async (ipAddress) => {
    if (!window.confirm(`Are you sure you want to remove ${ipAddress}?`)) {
      return;
    }

    try {
      await removeWhitelistedIP(ipAddress);
      setIps(prev => prev.filter(ip => ip.ip_address !== ipAddress));
      setSuccess('IP address removed');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Auto-discover current IP
  const handleAutoDiscoverIP = async () => {
    try {
      setLoading(true);
      await autoDiscoverCurrentIP();
      setSuccess('Current IP added to whitelist');
      setTimeout(() => setSuccess(''), 3000);
      loadWhitelist();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle IP whitelist enforcement
  const handleToggleIPCheck = async () => {
    try {
      if (status?.enabled) {
        await disableIPWhitelist();
      } else {
        await enableIPWhitelist();
      }
      await loadStatus();
      setSuccess(`IP whitelist ${!status?.enabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">IP Whitelist Management</h2>
        {status && (
          <button
            onClick={handleToggleIPCheck}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: status.enabled ? '#10b981' : '#ef4444',
              color: 'white',
            }}
          >
            {status.enabled ? (
              <>
                <ToggleRight className="w-5 h-5" />
                Enabled
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                Disabled
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Status */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg border ${status.enabled ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
          <div className="flex items-start gap-3">
            <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${status.enabled ? 'text-green-600' : 'text-yellow-600'}`} />
            <div>
              <p className={`font-semibold ${status.enabled ? 'text-green-900' : 'text-yellow-900'}`}>
                {status.enabled
                  ? 'IP Whitelist is ENABLED'
                  : 'IP Whitelist is DISABLED'}
              </p>
              <p className={`text-sm mt-1 ${status.enabled ? 'text-green-800' : 'text-yellow-800'}`}>
                {status.enabled
                  ? 'Your account can only be accessed from whitelisted IP addresses'
                  : 'Your account can be accessed from any IP address. Enable IP whitelist for better security.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add IP Form */}
      {!isAddingIP ? (
        <button
          onClick={() => setIsAddingIP(true)}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add IP Address
        </button>
      ) : (
        <form onSubmit={handleAddIP} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Add New IP Address</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Address or CIDR Range
              </label>
              <input
                type="text"
                placeholder="e.g., 192.168.1.100 or 192.168.1.0/24"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">
                Supports both IPv4 (x.x.x.x) and CIDR notation (x.x.x.x/24)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Office, Home, VPN"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Adding...' : 'Add IP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingIP(false);
                  setNewIP('');
                  setDescription('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Quick Actions */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={handleAutoDiscoverIP}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
        >
          Auto-Discover Current IP
        </button>
      </div>

      {/* IPs List */}
      <h3 className="font-semibold text-lg text-gray-800 mb-4">Whitelisted IP Addresses</h3>
      {loading ? (
        <div className="space-y-3 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : ips.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg mb-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No whitelisted IP addresses yet</p>
          <p className="text-sm mt-1">Add one or more IP addresses to get started</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {ips.map(ip => (
            <div key={ip.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">
                    {ip.ip_address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(ip.ip_address)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                {ip.description && (
                  <p className="text-sm text-gray-600 mt-2">{ip.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Added {new Date(ip.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleRemoveIP(ip.ip_address)}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove IP"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      {activity.length > 0 && (
        <>
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Recent Login Activity</h3>
          <div className="space-y-3">
            {activity.slice(0, 10).map((act, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <code className="text-sm font-mono text-gray-800">{act.ip_address}</code>
                    <p className="text-xs text-gray-600 mt-1">
                      {act.status === 'success' ? '✓ Successful login' : '✗ Failed attempt'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(act.created_at).toLocaleString()}
                    </p>
                  </div>
                  {act.status === 'success' ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                      Allowed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">
                      Blocked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default IPWhitelistManager;
