import React from 'react';

const stats = [
  { label: 'Total Users', value: '12,500' },
  { label: 'Total Transactions', value: '₦1.2B' },
  { label: 'Total Revenue', value: '₦320M' },
  { label: 'Active Users', value: '8,900' },
  { label: 'Pending Transfers', value: '23' },
  { label: 'Fraud Alerts', value: '4' },
];

const Widgets = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
    {stats.map((stat) => (
      <div key={stat.label} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <div className="text-2xl font-bold text-brand-blue mb-2">{stat.value}</div>
        <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
      </div>
    ))}
  </div>
);

export default Widgets;
