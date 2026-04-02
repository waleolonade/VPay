import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiCalendar, FiUser, FiDollarSign, FiHash, FiFileText } from 'react-icons/fi';
import { transactionService } from '../../services';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const TransactionDetails = () => {
  const { id } = useParams();
  
  const { data: transaction, isLoading } = useQuery(['transaction', id], () =>
    transactionService.getTransactionById(id)
  );

  if (isLoading) return <Loading fullScreen />;
  if (!transaction) return <div>Transaction not found</div>;

  const txData = transaction.data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
        <p className="text-gray-600 mt-1">Reference: {txData.reference}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Transaction Information">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <FiHash size={16} /> Transaction Reference
                </label>
                <p className="font-mono font-medium mt-1">{txData.reference}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <FiCalendar size={16} /> Date & Time
                </label>
                <p className="font-medium mt-1">{formatDateTime(txData.createdAt)}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Type</label>
                <Badge variant="info" className="mt-1">{txData.type}</Badge>
              </div>

              <div>
                <label className="text-sm text-gray-600">Status</label>
                <Badge variant={txData.status} className="mt-1">{txData.status}</Badge>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <FiDollarSign size={16} /> Amount
                </label>
                <p className="font-bold text-2xl text-primary-600 mt-1">
                  {formatCurrency(txData.amount)}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Fee</label>
                <p className="font-medium mt-1">{formatCurrency(txData.fee || 0)}</p>
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <FiFileText size={16} /> Description
                </label>
                <p className="font-medium mt-1">{txData.description || '-'}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <FiUser size={16} /> User
                </label>
                <p className="font-medium mt-1">{txData.user?.email || '-'}</p>
              </div>
            </div>

            {txData.status === 'completed' && (
              <div className="mt-6">
                <Button variant="danger">
                  Refund Transaction
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="Additional Details">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Transaction ID</label>
                <p className="font-mono text-sm mt-1">{txData.id}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Provider Reference</label>
                <p className="font-mono text-sm mt-1">{txData.providerRef || '-'}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">IP Address</label>
                <p className="font-mono text-sm mt-1">{txData.ipAddress || '-'}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Device</label>
                <p className="text-sm mt-1">{txData.device || '-'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
