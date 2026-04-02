import React from 'react';
import Card from '../../components/common/Card';

const Bills = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Bill Payments</h1>
      <Card>
        <p className="text-gray-600">View and manage utility bill payments and transactions.</p>
      </Card>
    </div>
  );
};

export default Bills;
