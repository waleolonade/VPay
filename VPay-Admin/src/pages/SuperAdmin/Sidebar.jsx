import React from 'react';

const menu = [
  { label: 'Dashboard', icon: '📊', anchor: null },
  { label: 'Two-Factor Auth', icon: '🔑', anchor: 'two-factor-auth' },
  { label: 'Activity Logs', icon: '📝', anchor: 'activity-logs' },
  { label: 'Session Manager', icon: '🖥️', anchor: 'session-manager' },
  { label: 'IP Whitelist', icon: '🛡️', anchor: 'ip-whitelist' },
  { label: 'Notification Center', icon: '🔔', anchor: 'notification-center' },
  { label: 'IP Tracking', icon: '🌐', anchor: null },
  { label: 'Login Alerts', icon: '🚨', anchor: null },
  { label: 'Suspicious Activity', icon: '⚠️', anchor: null },
  { label: 'User Management', icon: '👤', anchor: null },
  { label: 'Wallets', icon: '💼', anchor: null },
  { label: 'Transactions', icon: '💸', anchor: null },
  { label: 'Fraud & Security', icon: '🛡️', anchor: null },
  { label: 'Payments', icon: '💳', anchor: null },
  { label: 'Role Management', icon: '🔐', anchor: null },
  { label: 'Notifications', icon: '🔔', anchor: null },
  { label: 'Reports & Analytics', icon: '📈', anchor: null },
  { label: 'System Management', icon: '⚙️', anchor: null },
];

const Sidebar = () => (
  <aside className="w-64 bg-white border-r min-h-screen p-4">
    <div className="text-2xl font-bold mb-8 text-brand-blue">Super Admin</div>
    <nav>
      <ul className="space-y-4">
        {menu.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-lg text-gray-700 hover:text-brand-blue cursor-pointer">
            {item.anchor ? (
              <a href={`#${item.anchor}`} className="flex items-center gap-3 w-full">
                <span>{item.icon}</span> {item.label}
              </a>
            ) : (
              <span className="flex items-center gap-3 w-full">
                <span>{item.icon}</span> {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);

export default Sidebar;
