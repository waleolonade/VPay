import React, { useState, useEffect } from 'react';
import { splitPaymentService, userService } from '../../services';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-hot-toast';

const SplitPayments = () => {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [newSplit, setNewSplit] = useState({ title: '', totalAmount: '', members: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSplits();
    fetchUsers();
  }, []);

  const fetchSplits = async () => {
    try {
      setLoading(true);
      const response = await splitPaymentService.getSplitPayments();
      setSplits(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load split payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers({ limit: 100 });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateSplit = async (e) => {
    e.preventDefault();
    if (newSplit.members.length === 0) {
      return toast.error('Please add at least one member');
    }
    try {
      setIsSubmitting(true);
      await splitPaymentService.createSplitPayment(newSplit);
      toast.success('Split Group created');
      setIsModalOpen(false);
      setNewSplit({ title: '', totalAmount: '', members: [] });
      fetchSplits();
    } catch (error) {
      toast.error('Failed to create split');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMember = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (newSplit.members.find(m => m.userId === userId)) return toast.error('User already added');
    
    setNewSplit({
      ...newSplit,
      members: [...newSplit.members, { userId, name: `${user.first_name} ${user.last_name}`, amountOwed: '' }]
    });
  };

  const updateMemberAmount = (index, amount) => {
    const updatedMembers = [...newSplit.members];
    updatedMembers[index].amountOwed = amount;
    setNewSplit({ ...newSplit, members: updatedMembers });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Split Payment Management</h1>
        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          Create New Split
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : splits.length === 0 ? (
        <Card>
          <EmptyState
            title="No split payments found"
            description="Manage group expenses by creating a split payment."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {splits.map((split) => (
            <Card key={split.id} title={split.title}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Amount</span>
                  <span className="text-lg font-bold">₦{parseFloat(split.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge variant={split.status === 'completed' ? 'success' : 'warning'}>
                    {split.status}
                  </Badge>
                </div>
                <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end">
                  <Button variant="secondary" size="sm">View Details</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Split Payment"
      >
        <form onSubmit={handleCreateSplit} className="space-y-4">
          <Input
            label="Group Title"
            required
            value={newSplit.title}
            onChange={(e) => setNewSplit({ ...newSplit, title: e.target.value })}
            placeholder="e.g. Dinner with Friends"
          />
          <Input
            label="Total Amount"
            type="number"
            required
            value={newSplit.totalAmount}
            onChange={(e) => setNewSplit({ ...newSplit, totalAmount: e.target.value })}
            placeholder="0.00"
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Add Members</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              onChange={(e) => addMember(e.target.value)}
              value=""
            >
              <option value="" disabled>Select a user to add</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.phone})</option>
              ))}
            </select>
          </div>

          {newSplit.members.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Members</h4>
              <div className="space-y-3">
                {newSplit.members.map((member, index) => (
                  <div key={member.userId} className="flex items-center space-x-3">
                    <span className="text-sm flex-1 truncate">{member.name}</span>
                    <Input
                      type="number"
                      placeholder="Amount"
                      className="w-24"
                      value={member.amountOwed}
                      onChange={(e) => updateMemberAmount(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const members = [...newSplit.members];
                        members.splice(index, 1);
                        setNewSplit({ ...newSplit, members });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Create Split Group
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SplitPayments;

