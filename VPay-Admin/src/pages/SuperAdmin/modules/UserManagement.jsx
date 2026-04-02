import React, { useEffect, useState } from 'react';
import { fetchAllUsers, freezeAccount, updateKYC } from '../../../services/adminApi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllUsers()
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load users');
        setLoading(false);
      });
  }, []);

  const handleFreeze = (userId) => {
    if (confirm('Are you sure you want to freeze this account?')) {
      freezeAccount(userId).then(() => {
        alert('Account frozen successfully');
      }).catch(err => alert('Error: ' + err.message));
    }
  };

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">User Management</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">View, verify, suspend, and manage all users. Monitor KYC, risk scores, and account status.</p>
        {loading && <div>Loading users...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>KYC</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={7} className="text-gray-500">No users found.</td></tr>
              )}
              {users.map(user => (
                <tr key={user.id} className="border-b">
                  <td>{user.id?.substring(0, 8) || 'N/A'}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td><span className={user.kycStatus === 'verified' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>{user.kycStatus}</span></td>
                  <td><span className={user.isActive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="text-brand-blue underline text-xs mr-2" onClick={() => handleFreeze(user.id)}>Freeze</button>
                    <button className="text-brand-green underline text-xs">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default UserManagement;
