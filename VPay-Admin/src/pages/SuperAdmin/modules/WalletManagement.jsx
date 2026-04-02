import React, { useEffect, useState } from 'react';
import { fetchWallets } from '../../../services/adminApi';

const WalletManagement = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWallets()
      .then(data => {
        setWallets(data.wallets || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load wallets');
        setLoading(false);
      });
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">Wallet Management</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">Monitor and adjust wallet balances, freeze wallets, and view transaction history.</p>
        {loading && <div>Loading wallets...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th>Wallet ID</th>
                <th>User</th>
                <th>Balance</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {wallets.length === 0 && (
                <tr><td colSpan={6} className="text-gray-500">No wallets found.</td></tr>
              )}
              {wallets.map(wallet => (
                <tr key={wallet.id} className="border-b">
                  <td>{wallet.id?.substring(0, 8) || 'N/A'}</td>
                  <td>{wallet.userId?.substring(0, 8) || 'N/A'}</td>
                  <td>₦{wallet.balance?.toLocaleString() || '0'}</td>
                  <td>{wallet.currency || 'NGN'}</td>
                  <td><span className={wallet.isFrozen ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{wallet.isFrozen ? 'Frozen' : 'Active'}</span></td>
                  <td>
                    <button className="text-brand-blue underline text-xs mr-2">{wallet.isFrozen ? 'Unfreeze' : 'Freeze'}</button>
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

export default WalletManagement;
