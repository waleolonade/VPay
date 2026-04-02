import React from 'react';

const Overview = () => (
  <section>
    <h2 className="text-xl font-bold mb-4 text-brand-blue">System Overview</h2>
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <p className="text-gray-700 mb-2">Welcome to the Super Admin dashboard. Use the sidebar to manage users, wallets, transactions, security, payments, notifications, analytics, and system settings.</p>
      <ul className="list-disc pl-6 text-gray-600">
        <li>IP Tracking, Login Alerts, Suspicious Activity Detection</li>
        <li>Advanced User, Wallet, Transaction, Fraud, Payments, Notifications, Analytics, and System Management</li>
        <li>Role-based access, 2FA, activity logging, IP restriction, session timeout</li>
        <li>All new features are managed here and reflected in the app</li>
      </ul>
    </div>
  </section>
);

export default Overview;
