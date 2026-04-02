import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiFilter, FiDownload, FiEye, FiEdit, FiLock, FiUnlock, 
  FiUsers, FiUserCheck, FiUserX, FiTrendingUp, FiMoreVertical,
  FiMail, FiPhone, FiCalendar, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiSend, FiShield, FiBriefcase, FiPocket
} from 'react-icons/fi';
import { userService, kycService, notificationService, dashboardService } from '../../services';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SelectInput from '../../components/common/SelectInput';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate, formatCurrency, debounce, copyToClipboard } from '../../utils/helpers';
import { KYC_STATUSES } from '../../utils/constants';
import { exportUsersToExcel } from '../../utils/export';
import toast from 'react-hot-toast';

const Users = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    kycStatus: '',
    role: '',
    accountStatus: '',
    kycLevel: '',
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [actionModal, setActionModal] = useState({ show: false, user: null, action: '' });
  const [kycModal, setKycModal] = useState({ show: false, user: null });
  const [notifModal, setNotifModal] = useState({ show: false, user: null, title: '', body: '' });
  const [sortBy, setSortBy] = useState({ field: 'createdAt', order: 'desc' });

  // Fetch Stats
  const { data: globalStats } = useQuery('admin-stats', dashboardService.getStats);

  // Fetch Users
  const { data, isLoading, refetch } = useQuery(
    ['users', page, filters, sortBy],
    () => userService.getUsers({ page, limit: 20, ...filters, sortBy: sortBy.field, sortOrder: sortBy.order })
  );

  const handleSearch = debounce((value) => {
    setFilters({ ...filters, search: value });
    setPage(1);
  }, 500);

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(1);
  };

  const handleSort = (field) => {
    setSortBy({
      field,
      order: sortBy.field === field && sortBy.order === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked && data?.data) {
      setSelectedUsers(data.data.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleExport = () => {
    if (data?.data) {
      exportUsersToExcel(selectedUsers.length > 0 
        ? data.data.filter(u => selectedUsers.includes(u.id))
        : data.data
      );
      toast.success(`Exported ${selectedUsers.length || data.data.length} users`);
    }
  };

  const handleUserAction = async (action, userId) => {
    try {
      if (action === 'freeze') {
        await userService.freezeUser(userId);
        toast.success('User account frozen');
      } else if (action === 'unfreeze') {
        await userService.unfreezeUser(userId);
        toast.success('User account unfrozen');
      } else if (action === 'freezeWallet') {
        await userService.freezeWallet(userId, true);
        toast.success('User wallet frozen');
      } else if (action === 'unfreezeWallet') {
        await userService.freezeWallet(userId, false);
        toast.success('User wallet unfrozen');
      }
      setActionModal({ show: false, user: null, action: '' });
      refetch();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleUpdateKYC = async (status, level) => {
    try {
      await kycService.updateKYC(kycModal.user.id, status, level);
      toast.success(`KYC status updated to ${status}`);
      setKycModal({ show: false, user: null });
      refetch();
    } catch (error) {
      toast.error('Failed to update KYC');
    }
  };

  const handleSendNotification = async () => {
    try {
      if (!notifModal.title || !notifModal.body) return toast.error('Title and body required');
      await notificationService.sendNotification({
        userId: notifModal.user.id,
        title: notifModal.title,
        body: notifModal.body,
        type: 'system'
      });
      toast.success('Notification sent successfully');
      setNotifModal({ show: false, user: null, title: '', body: '' });
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', kycStatus: '', role: '', accountStatus: '', kycLevel: '' });
    setPage(1);
  };

  const getKycBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Directory</h1>
          <p className="text-gray-500 mt-1">Monitor, manage, and support your platform users.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            icon={<FiFilter />} 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-gray-200' : ''}
          >
            Filters
          </Button>
          <Button 
            variant="primary" 
            icon={<FiDownload />} 
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FiUsers size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900">{globalStats?.data?.totalUsers?.toLocaleString() || '0'}</h3>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <FiUserCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <h3 className="text-2xl font-bold text-gray-900">{data?.data?.filter(u => u.isActive).length.toLocaleString() || '0'}</h3>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <FiShield size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending KYC</p>
              <h3 className="text-2xl font-bold text-gray-900">{data?.data?.filter(u => u.kycStatus === 'pending').length || '0'}</h3>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <FiPocket size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Platform Liquidity</p>
              <h3 className="text-2xl font-bold text-gray-900 uppercase">{formatCurrency(globalStats?.data?.totalWalletBalance || 0)}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="overflow-hidden border-none shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
                <span className="text-sm font-medium text-gray-600">{selectedUsers.length} selected</span>
                <Button size="sm" variant="danger" onClick={() => handleBulkAction('freeze')}>Freeze</Button>
              </div>
            )}
            <SelectInput 
              options={[{ value: '', label: 'All Roles' }, { value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]}
              onChange={(opt) => handleFilterChange('role', opt.value)}
              className="w-40 mb-0"
              placeholder="Filter Role"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
            <SelectInput 
              label="KYC Status"
              options={[{ value: '', label: 'All Status' }, ...KYC_STATUSES]}
              onChange={(opt) => handleFilterChange('kycStatus', opt.value)}
            />
            <SelectInput 
              label="KYC Level"
              options={[{ value: '', label: 'All Levels' }, { value: '1', label: 'Level 1' }, { value: '2', label: 'Level 2' }, { value: '3', label: 'Level 3' }]}
              onChange={(opt) => handleFilterChange('kycLevel', opt.value)}
            />
            <SelectInput 
              label="Account Status"
              options={[{ value: '', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'frozen', label: 'Frozen' }]}
              onChange={(opt) => handleFilterChange('accountStatus', opt.value)}
            />
          </div>
        )}

        {/* User Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loading /></div>
          ) : !data?.data?.length ? (
            <EmptyState title="No users found" description="Try broadening your search or filters." />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                  <th className="px-6 py-4 w-10">
                    <input type="checkbox" checked={selectedUsers.length === data.data.length} onChange={handleSelectAll} className="rounded border-gray-300" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary-600" onClick={() => handleSort('firstName')}>User Profile</th>
                  <th className="px-6 py-4">Account Type</th>
                  <th className="px-6 py-4">KYC Status</th>
                  <th className="px-6 py-4 text-center">Wallet Status</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => handleSelectUser(user.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold overflow-hidden">
                          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user.firstName?.[0] + user.lastName?.[0])}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{user.firstName} {user.lastName}</p>
                          <button 
                            className="text-xs text-gray-400 flex items-center gap-1 hover:text-primary-500" 
                            onClick={() => copyToClipboard(user.email)}
                          >
                            {user.email} <FiBriefcase size={10} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isBusiness ? 'info' : 'gray'}>
                        {user.isBusiness ? 'Business' : 'Personal'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Badge variant={getKycBadgeVariant(user.kycStatus)}>
                          {user.kycStatus || 'unverified'}
                        </Badge>
                        <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Level {user.kycLevel || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mb-1 ${user.accountFrozen ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-[10px] text-gray-500 uppercase font-bold">{user.accountFrozen ? 'Frozen' : 'Active'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-medium">{formatDate(user.createdAt)}</div>
                      <div className="text-[10px] text-gray-400 uppercase">Registered</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/users/${user.id}`} title="View Full Details">
                          <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><FiEye size={18} /></button>
                        </Link>
                        <button 
                          onClick={() => setKycModal({ show: true, user })}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" 
                          title="Review KYC"
                        >
                          <FiShield size={18} />
                        </button>
                        <button 
                          onClick={() => setNotifModal({ ...notifModal, show: true, user })}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" 
                          title="Send Message"
                        >
                          <FiSend size={18} />
                        </button>
                        <button 
                          onClick={() => setActionModal({ show: true, user, action: user.accountFrozen ? 'unfreeze' : 'freeze' })}
                          className={`p-2 rounded-lg transition-colors ${user.accountFrozen ? 'text-green-400 hover:text-green-600 hover:bg-green-50' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                          title={user.accountFrozen ? 'Unfreeze' : 'Freeze'}
                        >
                          {user.accountFrozen ? <FiUnlock size={18} /> : <FiLock size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {data?.pagination && (
          <div className="p-4 bg-gray-50/30 border-t border-gray-100">
            <Pagination 
              currentPage={page}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* KYC Update Modal */}
      {kycModal.show && (
        <Modal 
          isOpen={kycModal.show} 
          onClose={() => setKycModal({ show: false, user: null })}
          title="Update User KYC"
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
              <FiBriefcase className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">{kycModal.user.firstName} {kycModal.user.lastName}</p>
                <p className="text-xs text-blue-700">Current Level: {kycModal.user.kycLevel || 0}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button fullWidth variant="success" onClick={() => handleUpdateKYC('verified', 3)}>Approve (L3)</Button>
              <Button fullWidth variant="primary" onClick={() => handleUpdateKYC('verified', 2)}>Approve (L2)</Button>
              <Button fullWidth variant="warning" onClick={() => handleUpdateKYC('pending', 1)}>Reset to L1</Button>
              <Button fullWidth variant="danger" onClick={() => handleUpdateKYC('rejected', 0)}>Reject KYC</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notif Modal */}
      {notifModal.show && (
        <Modal 
          isOpen={notifModal.show} 
          onClose={() => setNotifModal({ show: false, user: null, title: '', body: '' })}
          title="Send Direct Notification"
        >
          <div className="space-y-4">
            <Input 
              label="Subject" 
              value={notifModal.title} 
              onChange={(e) => setNotifModal({ ...notifModal, title: e.target.value })} 
              placeholder="e.g. Account Security Update"
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message Content</label>
              <textarea 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 h-32 outline-none"
                value={notifModal.body}
                onChange={(e) => setNotifModal({ ...notifModal, body: e.target.value })}
                placeholder="Type your message to the user..."
              />
            </div>
            <Button fullWidth icon={<FiSend />} onClick={handleSendNotification}>Send Now</Button>
          </div>
        </Modal>
      )}

      {/* Account Action Modal */}
      {actionModal.show && (
        <Modal 
          isOpen={actionModal.show} 
          onClose={() => setActionModal({ show: false, user: null })}
          title="Security Action Required"
        >
          <div className="text-center p-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${actionModal.action === 'freeze' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {actionModal.action === 'freeze' ? <FiLock size={32} /> : <FiUnlock size={32} />}
            </div>
            <h3 className="text-lg font-bold text-gray-900">Confirm Security Change</h3>
            <p className="text-gray-500 mt-1">
              Are you sure you want to {actionModal.action} the account for <strong>{actionModal.user.firstName}</strong>? 
              {actionModal.action === 'freeze' ? ' They will lose all access immediately.' : ' They will regain full access.'}
            </p>
            <div className="flex gap-4 mt-8">
              <Button fullWidth variant="secondary" onClick={() => setActionModal({ show: false })}>Cancel</Button>
              <Button fullWidth variant={actionModal.action === 'freeze' ? 'danger' : 'success'} onClick={() => handleUserAction(actionModal.action, actionModal.user.id)}>
                Proceed to {actionModal.action}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;
