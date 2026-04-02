import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Widgets from './Widgets';
import Overview from './Overview';
import IPTracking from './modules/IPTracking';
import LoginAlerts from './modules/LoginAlerts';
import SuspiciousActivity from './modules/SuspiciousActivity';
import UserManagement from './modules/UserManagement';
import WalletManagement from './modules/WalletManagement';
import TransactionManagement from './modules/TransactionManagement';
import FraudSecurity from './modules/FraudSecurity';
import Payments from './modules/Payments';
import NotificationsModule from './modules/Notifications';
import ReportsAnalytics from './modules/ReportsAnalytics';
import SystemManagement from './modules/SystemManagement';
import RoleManagement from './modules/RoleManagement';
// New security feature components
import TwoFactorAuth from '../../components/TwoFactorAuth';
import ActivityLogs from '../../components/ActivityLogs';
import SessionManager from '../../components/SessionManager';
import IPWhitelistManager from '../../components/IPWhitelistManager';
import NotificationCenter from '../../components/NotificationCenter';

const Dashboard = () => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <TopNav />
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <Widgets />
        <Overview />
        
        {/* Security & Admin Features */}
        <section id="two-factor-auth" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Two-Factor Authentication</h2>
          <TwoFactorAuth />
        </section>
        <section id="activity-logs" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Activity Logs</h2>
          <ActivityLogs />
        </section>
        <section id="session-manager" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Session Manager</h2>
          <SessionManager />
        </section>
        <section id="ip-whitelist" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">IP Whitelist</h2>
          <IPWhitelistManager />
        </section>
        <section id="notification-center" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Center</h2>
          <NotificationCenter />
        </section>

        {/* Management Modules */}
        <IPTracking />
        <LoginAlerts />
        <SuspiciousActivity />
        <UserManagement />
        <WalletManagement />
        <TransactionManagement />
        <FraudSecurity />
        <Payments />
        <NotificationsModule />
        <ReportsAnalytics />
        <SystemManagement />
        <RoleManagement />
      </main>
    </div>
  </div>
);

export default Dashboard;
