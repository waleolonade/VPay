import React from 'react';

const SystemManagement = () => (
  <section>
    <h2 className="text-lg font-bold mb-4 text-brand-blue">System Management</h2>
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <p className="text-gray-700 mb-2">Manage admin users, role permissions, API logs, backups, and system settings.</p>
      {/* Example system management actions */}
      <div className="flex gap-4">
        <button className="bg-brand-blue text-white px-4 py-2 rounded">Add Admin</button>
        <button className="bg-brand-green text-white px-4 py-2 rounded">Backup System</button>
        <button className="bg-brand-dark text-white px-4 py-2 rounded">View Logs</button>
      </div>
    </div>
  </section>
);

export default SystemManagement;
