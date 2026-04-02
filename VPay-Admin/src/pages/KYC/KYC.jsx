import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { FiSearch, FiCheck, FiX } from 'react-icons/fi';
import { kycService } from '../../services';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SelectInput from '../../components/common/SelectInput';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/helpers';
import { KYC_STATUSES, KYC_LEVELS } from '../../utils/constants';
import toast from 'react-hot-toast';

const KYC = () => {
  const [filters, setFilters] = useState({ status: 'pending' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [kycModal, setKycModal] = useState(false);
  const [kycData, setKycData] = useState({ status: 'verified', level: 2 });

  const { data, isLoading, refetch } = useQuery(
    ['kyc-requests', filters],
    () => kycService.getKYCRequests(filters)
  );

  const handleUpdateKYC = async () => {
    try {
      await kycService.updateKYC(selectedUser.id, kycData.status, kycData.level);
      toast.success('KYC status updated successfully');
      refetch();
      setKycModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
        <p className="text-gray-600 mt-1">Review and manage KYC verification requests</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input placeholder="Search users..." icon={<FiSearch />} />
          <SelectInput
            placeholder="Filter by Status"
            options={KYC_STATUSES}
            value={KYC_STATUSES.find(s => s.value === filters.status)}
            onChange={(option) => setFilters({ ...filters, status: option?.value })}
          />
        </div>

        {isLoading ? (
          <Loading />
        ) : !data?.data?.length ? (
          <EmptyState title="No KYC requests found" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current Level</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>Level {user.kycLevel}</td>
                    <td>
                      <Badge variant={user.kycStatus}>{user.kycStatus}</Badge>
                    </td>
                    <td>{formatDate(user.kycSubmittedAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setKycData({ status: 'verified', level: user.kycLevel + 1 });
                            setKycModal(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setKycData({ status: 'rejected', level: user.kycLevel });
                            setKycModal(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* KYC Update Modal */}
      <Modal
        isOpen={kycModal}
        onClose={() => setKycModal(false)}
        title="Update KYC Status"
        footer={
          <>
            <Button variant="secondary" onClick={() => setKycModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateKYC}>Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectInput
            label="KYC Status"
            options={KYC_STATUSES}
            value={KYC_STATUSES.find(s => s.value === kycData.status)}
            onChange={(option) => setKycData({ ...kycData, status: option.value })}
          />
          <SelectInput
            label="KYC Level"
            options={KYC_LEVELS}
            value={KYC_LEVELS.find(l => l.value === kycData.level)}
            onChange={(option) => setKycData({ ...kycData, level: option.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

export default KYC;
