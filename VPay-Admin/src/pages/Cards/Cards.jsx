import React from 'react';
import Card from '../../components/common/Card';

const Cards = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Card Management</h1>
      <Card>
        <p className="text-gray-600">Manage virtual and physical card issuance and operations.</p>
      </Card>
    </div>
  );
};

export default Cards;
