import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FiPlus } from 'react-icons/fi';

const Rewards = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards Management</h1>
          <p className="text-gray-600 mt-1">Manage loyalty rewards and customer incentives</p>
        </div>
        <Button icon={<FiPlus />}>Create Reward</Button>
      </div>
      <Card>
        <p className="text-gray-600">Configure and manage reward programs and point systems.</p>
      </Card>
    </div>
  );
};

export default Rewards;
