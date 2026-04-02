import React, { useState, useEffect } from 'react';
import { qrPaymentService } from '../../services';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-hot-toast';

const QRPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await qrPaymentService.getQRPayments();
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching QR payments:', error);
      toast.error('Failed to load QR transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">QR Payment Transactions</h1>
        <button
          onClick={fetchTransactions}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="p-8"><Loading /></div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No QR transactions found"
            description="All payments made via QR scans will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{txn.reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{txn.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">₦{parseFloat(txn.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{txn.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={txn.status === 'completed' ? 'success' : txn.status === 'failed' ? 'danger' : 'warning'}>
                        {txn.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(txn.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QRPayments;

