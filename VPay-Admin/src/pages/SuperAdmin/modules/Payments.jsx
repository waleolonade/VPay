import React, { useEffect, useState } from 'react';
import { fetchTransactions } from '../../../services/adminApi';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions()
      .then(data => {
        const paymentTxs = (data.transactions || []).filter(tx => ['deposit', 'withdrawal'].includes(tx.type));
        setPayments(paymentTxs);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load payments');
        setLoading(false);
      });
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-brand-blue">Payments</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-2">View deposit/withdrawal records, payment gateway logs, and manage refunds.</p>
        {loading && <div>Loading payments...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th>Payment ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={7} className="text-gray-500">No payments found.</td></tr>
              )}
              {payments.map(payment => (
                <tr key={payment.id} className="border-b">
                  <td>{payment.id?.substring(0, 8) || 'N/A'}</td>
                  <td>{payment.userId?.substring(0, 8) || 'N/A'}</td>
                  <td>{payment.type}</td>
                  <td>₦{payment.amount?.toLocaleString() || '0'}</td>
                  <td><span className={payment.status === 'success' ? 'text-green-600 font-semibold' : payment.status === 'pending' ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'}>{payment.status}</span></td>
                  <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}</td>
                  <td><button className="text-brand-blue underline text-xs">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default Payments;
