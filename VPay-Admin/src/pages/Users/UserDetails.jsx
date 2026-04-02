import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiMail, FiPhone, FiCalendar, FiCreditCard, FiDollarSign, FiFileText } from 'react-icons/fi';
import { userService, transactionService, walletService } from '../../services';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../utils/helpers';

const UserDetails = () => {
  const { id } = useParams();
  
  const { data: user, isLoading } = useQuery(['user', id], () => userService.getUserById(id));
  const { data: transactions } = useQuery(['user-transactions', id], () =>
    transactionService.getTransactions({ userId: id, limit: 10 })
  );

  if (isLoading) return <Loading fullScreen />;
  if (!user) return <div>User not found</div>;

  const userData = user.data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{userData.firstName} {userData.lastName}</h1>
        <p className="text-gray-600 mt-1">User ID: {userData.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-1">
          <Card title="User Information">
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-medium">
                  {userData.firstName?.[0]}{userData.lastName?.[0]}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <FiMail size={16} /> Email
                </label>
                <p className="font-medium mt-1">{userData.email}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <FiPhone size={16} /> Phone
                </label>
                <p className="font-medium mt-1">{userData.phone || '-'}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <FiCalendar size={16} /> Joined
                </label>
                <p className="font-medium mt-1">{formatDate(userData.createdAt)}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">KYC Status</label>
                <Badge variant={userData.kycStatus} className="mt-1">
                  {userData.kycStatus}
                </Badge>
              </div>

              <div>
                <label className="text-sm text-gray-600">KYC Level</label>
                <p className="font-medium mt-1">Level {userData.kycLevel || 1}</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button variant="danger" fullWidth>
                Freeze Account
              </Button>
              <Button variant="secondary" fullWidth>
                Send Notification
              </Button>
            </div>
          </Card>
        </div>

        {/* Activity & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <FiDollarSign className="mx-auto text-primary-600 mb-2" size={32} />
              <p className="text-gray-600 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(userData.walletBalance || 0)}</p>
            </Card>
            <Card className="text-center">
              <FiCreditCard className="mx-auto text-green-600 mb-2" size={32} />
              <p className="text-gray-600 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold mt-1">{userData.totalTransactions || 0}</p>
            </Card>
            <Card className="text-center">
              <FiFileText className="mx-auto text-purple-600 mb-2" size={32} />
              <p className="text-gray-600 text-sm">Active Loans</p>
              <p className="text-2xl font-bold mt-1">{userData.activeLoans || 0}</p>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card title="Recent Transactions">
            <div className="space-y-3">
              {transactions?.data?.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                    <Badge variant={transaction.status}>{transaction.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
