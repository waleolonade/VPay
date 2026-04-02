import React, { useState, useEffect } from 'react';
import { paymentLinkService } from '../../services';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-hot-toast';

const PaymentLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLink, setNewLink] = useState({ amount: '', description: '', expiresAt: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await paymentLinkService.getPaymentLinks();
      setLinks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching payment links:', error);
      toast.error('Failed to load payment links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await paymentLinkService.createPaymentLink(newLink);
      toast.success('Payment link created successfully');
      setIsModalOpen(false);
      setNewLink({ amount: '', description: '', expiresAt: '' });
      fetchLinks();
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast.error('Failed to create payment link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this link?')) return;
    try {
      await paymentLinkService.deactivatePaymentLink(id);
      toast.success('Link deactivated');
      fetchLinks();
    } catch (error) {
      toast.error('Failed to deactivate link');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payment Links</h1>
        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          Create New Link
        </Button>
      </div>

      <Card noPadding>
        {loading ? (
          <div className="p-8"><Loading /></div>
        ) : links.length === 0 ? (
          <EmptyState
            title="No payment links found"
            description="Create your first payment link to start collecting payments."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {links.map((link) => (
                  <tr key={link.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{link.description || 'No description'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₦{parseFloat(link.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-mono">{link.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={link.status === 'active' ? 'success' : 'danger'}>
                        {link.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(link.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {link.status === 'active' && (
                        <button
                          onClick={() => handleDeactivate(link.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Payment Link"
      >
        <form onSubmit={handleCreateLink} className="space-y-4">
          <Input
            label="Amount (NGN)"
            type="number"
            required
            value={newLink.amount}
            onChange={(e) => setNewLink({ ...newLink, amount: e.target.value })}
            placeholder="e.g. 5000"
          />
          <Input
            label="Description"
            required
            value={newLink.description}
            onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
            placeholder="What is this payment for?"
          />
          <Input
            label="Expiry Date (Optional)"
            type="datetime-local"
            value={newLink.expiresAt}
            onChange={(e) => setNewLink({ ...newLink, expiresAt: e.target.value })}
          />
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Generate Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentLinks;

