import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaCheckDouble, FaTrash, FaEnvelope, FaExclamationTriangle, FaInfoCircle, FaChevronDown, FaSyncAlt } from 'react-icons/fa';
import {
  fetchMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  fetchNotificationTemplates,
} from '../services/adminApi';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [filterUnread, setFilterUnread] = useState(false);

  // Load notifications
  const loadNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await fetchMyNotifications(pageNum, 30, filterUnread);
      setNotifications(data.notifications || []);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      const data = await fetchNotificationTemplates();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const data = await getUnreadNotificationCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadTemplates();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    loadNotifications(1);
  }, [filterUnread]);

  // Mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      setSuccess('Marked as read');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setSuccess('All notifications marked as read');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) {
      return;
    }

    try {
      await deleteNotification(notificationId);
      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!deleted?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setSuccess('Notification deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'security':
        return <FaExclamationTriangle className="w-5 h-5 text-red-600" />;
      case 'transaction':
        return <FaEnvelope className="w-5 h-5 text-green-600" />;
      case 'info':
        return <FaInfoCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <FaBell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'security':
        return 'bg-red-50 border-red-200';
      case 'transaction':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      transaction: 'Transaction',
      security: 'Security',
      system: 'System',
      info: 'Information',
      alert: 'Alert',
      login: 'Login',
    };
    return labels[type] || 'Notification';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have <span className="font-semibold text-blue-600">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadNotifications(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <FaSyncAlt className="w-5 h-5 text-gray-600" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
<FaCheckDouble className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
          <FaExclamationTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterUnread(!filterUnread)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterUnread
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaBell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 font-medium">
            {filterUnread ? 'No unread notifications' : 'No notifications'}
          </p>
          <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`border rounded-lg transition-all ${getNotificationColor(notification.type)} ${
                !notification.read ? 'ring-2 ring-blue-300' : ''
              }`}
            >
              <button
                onClick={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
                className="w-full text-left p-4 hover:bg-black hover:bg-opacity-5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 rounded text-gray-700 font-medium">
                          {getTypeLabel(notification.type)}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <FaChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      expandedId === notification.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedId === notification.id && (
                <div className="border-t border-current border-opacity-20 p-4 space-y-4">
                  <div>
                    <p className="text-gray-700">{notification.message}</p>
                  </div>

                  {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="bg-white bg-opacity-50 p-3 rounded text-sm">
                      <p className="font-semibold text-gray-700 mb-2">Details</p>
                      <div className="space-y-1 text-gray-600 text-xs font-mono">
                        {Object.entries(notification.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-4">
                            <span>{key}:</span>
                            <span>{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
<FaCheck className="w-4 h-4" />
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 flex items-center justify-center gap-2"
                    >
<FaTrash className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadNotifications(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => loadNotifications(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Templates Info */}
      {templates.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Notification Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <div key={template.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                {template.variables && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((var_name, idx) => (
                        <code key={idx} className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-800">
                          {var_name}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
