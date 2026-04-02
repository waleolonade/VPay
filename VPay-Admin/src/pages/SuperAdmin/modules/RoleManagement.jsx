import React, { useState, useEffect } from 'react';
import {
  fetchAllAdmins,
  assignAdminRole,
  deactivateAdmin,
  reactivateAdmin,
  fetchAvailableRoles,
  fetchRolePermissions
} from '../../../services/adminApi';

const RoleManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [adminsRes, rolesRes, permissionsRes] = await Promise.all([
        fetchAllAdmins(),
        fetchAvailableRoles(),
        fetchRolePermissions()
      ]);

      setAdmins(adminsRes.data || []);
      setRoles(rolesRes.data || []);
      setRolePermissions(permissionsRes.data || {});
    } catch (err) {
      setError(err.message);
      console.error('Error loading role management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedAdmin || !selectedRole) return;

    try {
      await assignAdminRole(selectedAdmin.id, selectedRole);
      setShowRoleModal(false);
      setSelectedAdmin(null);
      setSelectedRole('');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (admin) => {
    if (!window.confirm(`Deactivate ${admin.name}?`)) return;

    try {
      await deactivateAdmin(admin.id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReactivate = async (admin) => {
    if (!window.confirm(`Reactivate ${admin.name}?`)) return;

    try {
      await reactivateAdmin(admin.id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Role-Based Access Control</h2>
        <p className="text-gray-600">Manage admin roles, permissions, and access levels</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="text-sm text-gray-600">Total Admins</div>
          <div className="text-3xl font-bold text-brand-blue">{admins.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
          <div className="text-sm text-gray-600">Active Admins</div>
          <div className="text-3xl font-bold text-brand-green">{admins.filter(a => a.isActive).length}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="text-sm text-gray-600">Available Roles</div>
          <div className="text-3xl font-bold text-purple-600">{roles.length}</div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Admin Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 border-b">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">{admin.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      admin.role === 'superadmin' 
                        ? 'bg-red-100 text-red-800'
                        : admin.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      admin.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.isActive ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAdmin(admin);
                        setSelectedRole(admin.role);
                        setShowRoleModal(true);
                      }}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAdmin(admin);
                        setShowPermissionsModal(true);
                      }}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      View Perms
                    </button>
                    {admin.isActive ? (
                      <button
                        onClick={() => handleDeactivate(admin)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(admin)}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Change Role for {selectedAdmin.name}</h3>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedAdmin(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRole}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              Permissions for {selectedAdmin.name} ({selectedAdmin.role})
            </h3>
            <div className="space-y-2">
              {rolePermissions[selectedAdmin.role]?.map((permission) => (
                <div key={permission} className="flex items-center p-2 bg-gray-50 rounded">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">{permission}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedAdmin(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;

