import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FiPlus } from 'react-icons/fi';

const Promotions = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions Management</h1>
          <p className="text-gray-600 mt-1">Create and manage marketing campaigns</p>
        </div>
        <Button icon={<FiPlus />}>Create Promotion</Button>
      </div>
      <Card>
        <p className="text-gray-600">Manage promotional campaigns, discounts, and offers.</p>
      </Card>
    </div>
  );
};

export default Promotions;
