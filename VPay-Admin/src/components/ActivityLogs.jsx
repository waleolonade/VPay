import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, ChevronDown, Calendar, User, Activity } from 'lucide-react';
import { fetchActivityLogs, fetchActivityStats } from '../services/adminApi';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    adminId: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);

  // Load logs
  const loadLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await fetchActivityLogs(pageNum, limit, {
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        adminId: filters.adminId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
      setError('');
    } catch (err) {
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const data = await fetchActivityStats(30);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadLogs(1);
    loadStats();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    loadLogs(1);
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      resourceType: '',
      adminId: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
  };

  const downloadLogs = () => {
    const csv = [
      ['Date', 'Admin', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Details'],
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.admin_name || 'Unknown',
        log.action,
        log.resource_type,
        log.resource_id || '-',
        log.ip_address || '-',
        JSON.stringify(log.details || {}),
      ]),
    ];

    const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const actionColors = {
    CREATE: 'bg-green-100 text-green-800',
    READ: 'bg-blue-100 text-blue-800',
    UPDATE: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN: 'bg-purple-100 text-purple-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
    PERMISSION_CHANGE: 'bg-orange-100 text-orange-800',
    SETTINGS_CHANGE: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin Activity Logs</h2>
        <button
          onClick={downloadLogs}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-600 text-sm font-semibold">Total Actions</p>
            <p className="text-2xl font-bold text-blue-800">{stats.totalActions || 0}</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm font-semibold">Active Admins</p>
            <p className="text-2xl font-bold text-green-800">{stats.activeAdmins || 0}</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-purple-600 text-sm font-semibold">Most Common Action</p>
            <p className="text-lg font-bold text-purple-800">{stats.mostCommonAction || '-'}</p>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-600 text-sm font-semibold">Today's Actions</p>
            <p className="text-2xl font-bold text-orange-800">{stats.todayActions || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 mb-4"
        >
          <Filter className="w-4 h-4" />
          Filters {Object.values(filters).some(v => v) && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">Active</span>}
        </button>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="READ">Read</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="PERMISSION_CHANGE">Permission Change</option>
                <option value="SETTINGS_CHANGE">Settings Change</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
              <input
                type="text"
                placeholder="e.g., user, wallet"
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin ID</label>
              <input
                type="text"
                placeholder="Enter admin ID"
                value={filters.adminId}
                onChange={(e) => handleFilterChange('adminId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-2 items-end">
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="space-y-2 mb-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity logs found</p>
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md"
            >
              <button
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                      {log.action}
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">
                      {log.admin_name || 'Unknown Admin'} • {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ''}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()} • {log.ip_address || 'Unknown IP'}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedLog === log.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedLog === log.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Admin</p>
                      <p className="text-gray-600">{log.admin_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">IP Address</p>
                      <p className="text-gray-600 font-mono">{log.ip_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Resource</p>
                      <p className="text-gray-600">{log.resource_type} {log.resource_id && `(#${log.resource_id})`}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Timestamp</p>
                      <p className="text-gray-600">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Details</p>
                      <pre className="bg-white p-3 rounded border border-gray-300 text-xs overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadLogs(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => loadLogs(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
