import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { FiSearch, FiDownload, FiEye, FiCheck, FiX } from 'react-icons/fi';
import { loanService } from '../../services';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SelectInput from '../../components/common/SelectInput';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate, debounce } from '../../utils/helpers';
import { LOAN_STATUSES } from '../../utils/constants';
import toast from 'react-hot-toast';

const Loans = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '' });

  const { data, isLoading, refetch } = useQuery(
    ['loans', page, filters],
    () => loanService.getLoans({ page, limit: 20, ...filters })
  );

  const handleSearch = debounce((value) => {
    setFilters({ ...filters, search: value });
    setPage(1);
  }, 500);

  const handleAction = async (type) => {
    try {
      if (type === 'approve') {
        await loanService.approveLoan(selectedLoan.id);
        toast.success('Loan approved successfully');
      } else {
        await loanService.rejectLoan(selectedLoan.id, 'Rejected by admin');
        toast.success('Loan rejected');
      }
      refetch();
      setActionModal({ isOpen: false, type: '' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600 mt-1">Review and manage loan applications</p>
        </div>
        <Button icon={<FiDownload />}>Export</Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            placeholder="Search loans..."
            icon={<FiSearch />}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <SelectInput
            placeholder="Filter by Status"
            options={[{ value: '', label: 'All Statuses' }, ...LOAN_STATUSES]}
            isClearable
          />
        </div>

        {isLoading ? (
          <Loading />
        ) : !data?.data?.length ? (
          <EmptyState title="No loans found" />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Interest Rate</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((loan) => (
                    <tr key={loan.id}>
                      <td className="font-mono text-sm">{loan.id}</td>
                      <td>{loan.user?.email || '-'}</td>
                      <td className="font-semibold">{formatCurrency(loan.amount)}</td>
                      <td>{loan.interestRate}%</td>
                      <td>{loan.duration} months</td>
                      <td>
                        <Badge variant={loan.status}>{loan.status}</Badge>
                      </td>
                      <td>{formatDate(loan.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {loan.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setActionModal({ isOpen: true, type: 'approve' });
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setActionModal({ isOpen: true, type: 'reject' });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <FiX size={18} />
                              </button>
                            </>
                          )}
                          <button className="text-gray-600 hover:text-primary-600">
                            <FiEye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pagination && (
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                totalItems={data.pagination.total}
                itemsPerPage={20}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: '' })}
        title={`${actionModal.type === 'approve' ? 'Approve' : 'Reject'} Loan`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionModal({ isOpen: false, type: '' })}>
              Cancel
            </Button>
            <Button
              variant={actionModal.type === 'approve' ? 'success' : 'danger'}
              onClick={() => handleAction(actionModal.type)}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p>Are you sure you want to {actionModal.type} this loan application?</p>
      </Modal>
    </div>
  );
};

export default Loans;
