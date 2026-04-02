import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import UserDetails from './pages/Users/UserDetails';
import Transactions from './pages/Transactions/Transactions';
import TransactionDetails from './pages/Transactions/TransactionDetails';
import Wallets from './pages/Wallets/Wallets';
import Loans from './pages/Loans/Loans';
import LoanDetails from './pages/Loans/LoanDetails';
import Savings from './pages/Savings/Savings';
import Investments from './pages/Investments/Investments';
import Bills from './pages/Bills/Bills';
import Airtime from './pages/Airtime/Airtime';
import Data from './pages/Data/Data';
import KYC from './pages/KYC/KYC';
import Cards from './pages/Cards/Cards';
import Business from './pages/Business/Business';
import Invoices from './pages/Invoices/Invoices';
import PaymentLinks from './pages/PaymentLinks/PaymentLinks';
import QRPayments from './pages/QRPayments/QRPayments';
import SplitPayments from './pages/SplitPayments/SplitPayments';
import Subscriptions from './pages/Subscriptions/Subscriptions';
import Rewards from './pages/Rewards/Rewards';
import Promotions from './pages/Promotions/Promotions';
import Payroll from './pages/Payroll/Payroll';
import Support from './pages/Support/Support';
import Notifications from './pages/Notifications/Notifications';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound';
import SuperAdminDashboard from './pages/SuperAdmin';

// 🛡️ Protected Route with Role-Based Access Control
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const allAdmins = ['superadmin', 'admin', 'support', 'compliance'];

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      
      <Route
        path="/*"
        element={
          <ProtectedRoute allowedRoles={allAdmins}>
            <Layout>
              <Routes>
                <Route index element={<Dashboard />} />
                
                {/* User Management */}
                <Route path="users" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'support', 'compliance']}><Users /></ProtectedRoute>} />
                <Route path="users/:id" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'support', 'compliance']}><UserDetails /></ProtectedRoute>} />
                
                {/* Transactions */}
                <Route path="transactions" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'support', 'compliance']}><Transactions /></ProtectedRoute>} />
                <Route path="transactions/:id" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'support', 'compliance']}><TransactionDetails /></ProtectedRoute>} />
                
                {/* Wallets */}
                <Route path="wallets" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'compliance']}><Wallets /></ProtectedRoute>} />
                
                {/* Financial Services */}
                <Route path="loans" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Loans /></ProtectedRoute>} />
                <Route path="loans/:id" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><LoanDetails /></ProtectedRoute>} />
                <Route path="savings" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Savings /></ProtectedRoute>} />
                <Route path="investments" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Investments /></ProtectedRoute>} />
                
                {/* Bills & Utility */}
                <Route path="bills" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Bills /></ProtectedRoute>} />
                <Route path="airtime" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Airtime /></ProtectedRoute>} />
                <Route path="data" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Data /></ProtectedRoute>} />
                
                {/* Compliance & Identity */}
                <Route path="kyc" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'compliance']}><KYC /></ProtectedRoute>} />
                <Route path="cards" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Cards /></ProtectedRoute>} />
                
                {/* Business & Corporate */}
                <Route path="business" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'compliance']}><Business /></ProtectedRoute>} />
                <Route path="invoices" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'compliance']}><Invoices /></ProtectedRoute>} />
                <Route path="payroll" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Payroll /></ProtectedRoute>} />
                
                {/* Payments Infrastructure */}
                <Route path="payment-links" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><PaymentLinks /></ProtectedRoute>} />
                <Route path="qr-payments" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><QRPayments /></ProtectedRoute>} />
                <Route path="split-payments" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><SplitPayments /></ProtectedRoute>} />
                
                {/* Growth & Loyalty */}
                <Route path="subscriptions" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Subscriptions /></ProtectedRoute>} />
                <Route path="rewards" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Rewards /></ProtectedRoute>} />
                <Route path="promotions" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Promotions /></ProtectedRoute>} />
                
                {/* Support System */}
                <Route path="support" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'support']}><Support /></ProtectedRoute>} />
                <Route path="notifications" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'support']}><Notifications /></ProtectedRoute>} />
                
                {/* System Settings (Root Only) */}
                <Route path="settings" element={<ProtectedRoute allowedRoles={['superadmin']}><Settings /></ProtectedRoute>} />
                
                {/* Super Admin Dashboard */}
                <Route path="superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
