import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiUsers, FiCreditCard, FiDollarSign, FiTrendingUp,
  FiShoppingBag, FiPhone, FiWifi, FiCheckCircle, FiBriefcase,
  FiFileText, FiLink, FiCamera, FiScissors, FiRepeat, FiGift,
  FiVolume2, FiDollarSign as FiPayroll, FiHeadphones, FiBell,
  FiSettings, FiPieChart, FiPackage, FiChevronDown, FiChevronRight, FiShield
} from 'react-icons/fi';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const role = user?.role || 'user';

  // Define which roles can see which menu items
  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard', roles: ['superadmin', 'admin', 'support', 'compliance'] },
    { path: '/users', icon: FiUsers, label: 'Users', roles: ['superadmin', 'admin', 'support', 'compliance'] },
    { path: '/transactions', icon: FiCreditCard, label: 'Transactions', roles: ['superadmin', 'admin', 'support', 'compliance'] },
    { path: '/wallets', icon: FiDollarSign, label: 'Wallets', roles: ['superadmin', 'admin', 'compliance'] },
    {
      key: 'financial',
      icon: FiTrendingUp,
      label: 'Financial Services',
      roles: ['superadmin', 'admin'],
      children: [
        { path: '/loans', label: 'Loans' },
        { path: '/savings', label: 'Savings' },
        { path: '/investments', label: 'Investments' },
      ],
    },
    {
      key: 'bills',
      icon: FiShoppingBag,
      label: 'Bills & Services',
      roles: ['superadmin', 'admin'],
      children: [
        { path: '/bills', label: 'Bill Payments' },
        { path: '/airtime', label: 'Airtime' },
        { path: '/data', label: 'Data' },
      ],
    },
    { path: '/kyc', icon: FiCheckCircle, label: 'KYC Management', roles: ['superadmin', 'admin', 'compliance'] },
    { path: '/cards', icon: FiCreditCard, label: 'Cards', roles: ['superadmin', 'admin'] },
    {
      key: 'business',
      icon: FiBriefcase,
      label: 'Business',
      roles: ['superadmin', 'admin', 'compliance'],
      children: [
        { path: '/business', label: 'Business Accounts' },
        { path: '/invoices', label: 'Invoices' },
        { path: '/payroll', label: 'Payroll' },
      ],
    },
    {
      key: 'payments',
      icon: FiLink,
      label: 'Payments',
      roles: ['superadmin', 'admin'],
      children: [
        { path: '/payment-links', label: 'Payment Links' },
        { path: '/qr-payments', label: 'QR Payments' },
        { path: '/split-payments', label: 'Split Payments' },
      ],
    },
    { path: '/subscriptions', icon: FiRepeat, label: 'Subscriptions', roles: ['superadmin', 'admin'] },
    { path: '/rewards', icon: FiGift, label: 'Rewards', roles: ['superadmin', 'admin'] },
    { path: '/promotions', icon: FiVolume2, label: 'Promotions', roles: ['superadmin', 'admin'] },
    { path: '/support', icon: FiHeadphones, label: 'Support', roles: ['superadmin', 'admin', 'support'] },
    { path: '/notifications', icon: FiBell, label: 'Notifications', roles: ['superadmin', 'admin', 'support'] },
    { path: '/settings', icon: FiSettings, label: 'Settings', roles: ['superadmin'] },
  ];

  // Filter menu items based on role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(role)
  );

  const MenuItem = ({ item }) => {
    const isActive = item.path === location.pathname || 
                     (item.children && item.children.some(c => c.path === location.pathname));

    if (item.children) {
      const isExpanded = expandedMenus[item.key];
      return (
        <div>
          <button
            onClick={() => toggleMenu(item.key)}
            className={clsx(
              "w-full flex items-center justify-between px-4 py-3 transition-colors",
              isActive ? "text-primary-600 font-semibold" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && (
              isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="bg-gray-50/50">
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={clsx(
                    'block pl-14 pr-4 py-2.5 text-sm transition-all',
                    location.pathname === child.path
                      ? 'text-primary-600 bg-primary-50 font-bold border-r-4 border-primary-600'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.path}
        className={clsx(
          'flex items-center gap-3 px-4 py-3 transition-all relative group',
          location.pathname === item.path
            ? 'bg-primary-50 text-primary-600 font-bold'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        {location.pathname === item.path && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full" />
        )}
        <item.icon size={20} className={clsx(
          location.pathname === item.path ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'
        )} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={clsx(
        'bg-white border-r border-gray-100 h-screen overflow-y-auto transition-all duration-300 custom-scrollbar',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="p-6 mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200">
           <FiShield className="text-white" size={24} />
        </div>
        {!collapsed && (
           <h1 className="font-extrabold text-gray-900 text-xl tracking-tight">
             VPay<span className="text-primary-600">Admin</span>
           </h1>
        )}
      </div>
      
      <nav className="space-y-1">
        {filteredMenuItems.map((item, index) => (
          <MenuItem key={item.path || item.key} item={item} />
        ))}
      </nav>

      {/* Role Footer */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs uppercase">
              {role.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-gray-900 truncate uppercase tracking-wider">{role}</p>
               <p className="text-[10px] text-gray-400 font-medium">Verified Session</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
