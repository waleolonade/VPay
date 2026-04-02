import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Settings = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure platform settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title="Platform Configuration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Platform Name" defaultValue="VPay" />
            <Input label="Support Email" defaultValue="support@vpay.com" />
            <Input label="Transaction Fee (%)" type="number" defaultValue="1.5" />
            <Input label="Minimum Transfer Amount" type="number" defaultValue="100" />
          </div>
          <Button className="mt-4">Save Changes</Button>
        </Card>

        <Card title="Security Settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">Send notifications for important events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        <Card title="API Configuration">
          <Input label="VFD API Key" defaultValue="••••••••••••••••" type="password" />
          <Input label="Flutterwave Secret Key" defaultValue="••••••••••••••••" type="password" className="mt-4" />
          <Button className="mt-4">Update API Keys</Button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
