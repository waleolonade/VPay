import React from 'react';
import Card from '../../components/common/Card';

const Invoices = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Invoice Management</h1>
      <Card>
        <p className="text-gray-600">Monitor and manage invoices created by business accounts.</p>
      </Card>
    </div>
  );
};

export default Invoices;
