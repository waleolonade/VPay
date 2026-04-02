import React from 'react';

const TopNav = () => (
  <header className="flex items-center justify-between bg-white shadow px-6 py-4">
    <div className="text-xl font-semibold text-brand-blue">VPay Admin Portal</div>
    <div className="flex items-center gap-4">
      <span className="text-gray-600">Super Admin</span>
      <img src="/assets/admin-avatar.png" alt="Admin" className="w-10 h-10 rounded-full border" />
    </div>
  </header>
);

export default TopNav;
