import React, { useEffect, useState } from 'react';
import { fetchTransactions, reverseTransaction } from '../../../services/adminApi';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions()
      .then(data => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load transactions');
        setLoading(false);
      });
  }, []);

  const handleReverse = (transactionId) => {
    if (confirm('Are you sure you want to reverse this transaction?')) {
      reverseTransaction(transactionId).then(() => {
        alert('Transaction reversed successfully');
      }).catch(err => alert('Error: ' + err.message));
    }
  };

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">Transaction Management</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">View, reverse, and investigate all transfers. Manage failed, pending, and disputed transactions.</p>
        {loading && <div>Loading transactions...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th>Transaction ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="text-gray-500">No transactions found.</td></tr>
              )}
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b">
                  <td>{tx.id?.substring(0, 8) || 'N/A'}</td>
                  <td>{tx.userId?.substring(0, 8) || 'N/A'}</td>
                  <td>₦{tx.amount?.toLocaleString() || '0'}</td>
                  <td>{tx.type || tx.narration}</td>
                  <td><span className={tx.status === 'success' ? 'text-green-600 font-semibold' : tx.status === 'pending' ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'}>{tx.status}</span></td>
                  <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <button className="text-brand-blue underline text-xs mr-2" onClick={() => handleReverse(tx.id)}>Reverse</button>
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

export default TransactionManagement;
