import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { notificationService } from '../../services';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SelectInput from '../../components/common/SelectInput';
import { NOTIFICATION_TYPES } from '../../utils/constants';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'info',
    target: 'all',
  });
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await notificationService.sendNotification(formData);
      toast.success('Notification sent successfully');
      setFormData({ title: '', body: '', type: 'info', target: 'all' });
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">Send push notifications to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Send Notification">
          <form onSubmit={handleSend}>
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                className="input"
                rows="4"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
              />
            </div>
            <SelectInput
              label="Type"
              options={NOTIFICATION_TYPES}
              value={NOTIFICATION_TYPES.find(t => t.value === formData.type)}
              onChange={(option) => setFormData({ ...formData, type: option.value })}
            />
            <SelectInput
              label="Target Audience"
              options={[
                { value: 'all', label: 'All Users' },
                { value: 'active', label: 'Active Users' },
                { value: 'business', label: 'Business Accounts' },
              ]}
              value={{ value: formData.target, label: formData.target }}
              onChange={(option) => setFormData({ ...formData, target: option.value })}
            />
            <Button
              type="submit"
              fullWidth
              loading={sending}
              icon={<FiSend />}
              className="mt-4"
            >
              Send Notification
            </Button>
          </form>
        </Card>

        <Card title="Recent Notifications">
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">System Maintenance Notice</p>
              <p className="text-sm text-gray-600 mt-1">Sent 2 hours ago to All Users</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">New Feature Announcement</p>
              <p className="text-sm text-gray-600 mt-1">Sent yesterday to Active Users</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
