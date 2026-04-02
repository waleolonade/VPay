import React from 'react';
import Card from '../../components/common/Card';

const Wallets = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Wallet Management</h1>
      <Card>
        <p className="text-gray-600">View and manage user wallets, balances, and wallet operations.</p>
      </Card>
    </div>
  );
};

export default Wallets;
