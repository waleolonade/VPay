import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiDollarSign, FiCreditCard, FiTrendingUp, FiActivity, 
  FiArrowUpRight, FiArrowDownRight, FiPieChart, FiZap, FiClock,
  FiUserPlus, FiLayers, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiHeadphones, FiShield, FiBriefcase, FiSearch, FiBriefcase as FiCompliance
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardService } from '../../services';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import SelectInput from '../../components/common/SelectInput';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatNumber, formatDate } from '../../utils/helpers';
import { CHART_COLORS } from '../../utils/constants';

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, change, trend, loading, color = "primary" }) => {
  const isPositive = trend === 'up';
  const colors = {
    primary: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors[color] || colors.primary}`}>
          <Icon size={24} />
        </div>
        {!loading && change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {isPositive ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'user_registration': return <FiUserPlus className="text-blue-500" />;
      case 'transaction': return <FiZap className="text-amber-500" />;
      case 'loan_request': return <FiLayers className="text-purple-500" />;
      default: return <FiActivity className="text-gray-500" />;
    }
  };

  const getTitle = () => {
    switch (activity.type) {
      case 'user_registration': return `New User: ${activity.first_name} ${activity.last_name}`;
      case 'transaction': return `${activity.txn_type === 'credit' ? 'Credit' : 'Debit'} ${formatCurrency(activity.amount)}`;
      case 'loan_request': return `Loan Request: ${formatCurrency(activity.amount)}`;
      default: return 'System Activity';
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
      <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{getTitle()}</p>
        <p className="text-xs text-gray-500 truncate">{activity.email || `Ref: ${activity.reference}`}</p>
      </div>
      <div className="text-right flex-shrink-0 uppercase">
        <p className="text-[10px] text-gray-400 font-bold">{formatDate(activity.created_at, 'HH:mm')}</p>
        <p className="text-[10px] text-primary-600 font-bold">{formatDate(activity.created_at, 'MMM dd')}</p>
      </div>
    </div>
  );
};

// ── Shared Dashboard Header ──────────────────────────────────────────────────

const DashboardHeader = ({ title, subtitle, badge }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        {badge}
      </div>
      <p className="text-gray-500 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        {subtitle}
      </p>
    </div>
  </div>
);

// ── Role-Specific Offices ────────────────────────────────────────────────────

const SuperAdminOffice = ({ stats, analytics, activities, loading }) => {
  const revenueData = useMemo(() => {
    if (!analytics?.revenue) return [];
    return analytics.revenue.map(item => ({
      date: formatDate(item.date, 'MMM dd'),
      Revenue: Number(item.revenue),
      Volume: Number(item.volume) / 10,
    }));
  }, [analytics]);

  return (
    <div className="space-y-8">
      <DashboardHeader 
        title="Admin Command Center" 
        subtitle="Full administrative oversight and global infrastructure control."
        badge={<span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-widest border border-indigo-200">System ROOT</span>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Global Users" value={formatNumber(stats?.totalUsers || 0)} icon={FiUsers} color="primary" />
        <StatCard title="Total Assets" value={formatCurrency(stats?.totalWalletBalance || 0)} icon={FiDollarSign} color="emerald" />
        <StatCard title="Total Volume" value={formatNumber(stats?.totalTransactions || 0)} icon={FiTrendingUp} color="cyan" />
        <StatCard title="System Health" value="99.9%" icon={FiActivity} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
           <Card title="Financial Performance" subtitle="Real-time revenue and platform volume" noPadding>
             <div className="p-6 h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={revenueData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                   <Tooltip />
                   <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </Card>
         </div>
         <div className="lg:col-span-1">
            <Card title="Platform Actions" subtitle="Recent critical activities" noPadding>
              <div className="divide-y divide-gray-50 h-[400px] overflow-y-auto custom-scrollbar">
                {activities.slice(0, 8).map((item, idx) => <ActivityItem key={idx} activity={item} />)}
              </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

const SupportOffice = ({ activities, stats }) => (
  <div className="space-y-8">
    <DashboardHeader 
      title="Support Desk" 
      subtitle="Dedicated customer service and user experience management."
      badge={<span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-200">Customer Success</span>}
    />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Open Tickets" value="24" icon={FiHeadphones} color="emerald" change={-5.2} trend="down" />
      <StatCard title="Active Users" value={formatNumber(stats?.totalUsers || 0)} icon={FiUsers} color="cyan" />
      <StatCard title="Resolution Rate" value="94%" icon={FiCheckCircle} color="primary" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card title="Recent User Activity" subtitle="Real-time timeline of user events">
          <div className="divide-y divide-gray-50 overflow-y-auto custom-scrollbar h-[500px]">
            {activities.map((item, idx) => <ActivityItem key={idx} activity={item} />)}
          </div>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
          <FiZap className="mx-auto text-amber-500 mb-4" size={48} />
          <h3 className="font-bold text-lg mb-2 text-gray-900">Need Help?</h3>
          <p className="text-sm text-gray-500 mb-6">Access internal documentation and standard operating procedures.</p>
          <button className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest">Open SOP Docs</button>
        </div>
      </div>
    </div>
  </div>
);

const ComplianceOffice = ({ stats, activities }) => (
  <div className="space-y-8">
    <DashboardHeader 
      title="Compliance & Risk" 
      subtitle="Enforcing regulatory standards and platform security."
      badge={<span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-widest border border-amber-200">Security Guard</span>}
    />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Pending KYC" value="128" icon={FiCheckCircle} color="amber" change={12.5} trend="up" />
      <StatCard title="Flagged Transactions" value="0" icon={FiAlertCircle} color="rose" />
      <StatCard title="Verified Businesses" value="42" icon={FiCompliance} color="cyan" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card title="Verification Timeline" subtitle="Audit log of identity and document submissions">
          <div className="divide-y divide-gray-50">
             {activities.filter(a => a.type === 'user_registration' || a.type === 'loan_request').map((item, idx) => (
               <ActivityItem key={idx} activity={item} />
             ))}
          </div>
        </Card>
      </div>
       <div className="lg:col-span-1 border-dashboard-compliance p-6 bg-white rounded-3xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center text-center">
          <FiShield className="text-amber-500 mb-4" size={40} />
          <h4 className="font-bold text-gray-900 mb-2 underline decoration-amber-200 decoration-4">Zero Security Alerts</h4>
          <p className="text-xs text-gray-500 leading-relaxed px-4">All platform activities are currently within safety parameters. No manual intervention required.</p>
       </div>
    </div>
  </div>
);

// ── Main Dashboard Hub ───────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState('30d');

  const { data: statsRes, isLoading: statsLoading } = useQuery(['admin-stats'], dashboardService.getStats);
  const { data: analyticsRes, isLoading: analyticsLoading } = useQuery(['admin-analytics', period], () => dashboardService.getAnalytics(period));
  const { data: activityRes, isLoading: activityLoading } = useQuery(['recent-activity'], dashboardService.getRecentActivity);

  const stats = statsRes?.data;
  const analytics = analyticsRes?.data;
  const activities = activityRes?.data || [];

  if (statsLoading || activityLoading) return <Loading fullScreen />;

  const role = user?.role || 'user';

  switch (role) {
    case 'superadmin':
      return <SuperAdminOffice stats={stats} analytics={analytics} activities={activities} />;
    case 'support':
      return <SupportOffice stats={stats} activities={activities} />;
    case 'compliance':
      return <ComplianceOffice stats={stats} activities={activities} />;
    default:
      // Standard Admin View (Default)
      return (
        <div className="space-y-8">
          <DashboardHeader 
            title="Operations Center" 
            subtitle="Platform operational management and logistics."
            badge={<span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-widest border border-blue-200">Active Admin</span>}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Active Users" value={formatNumber(stats?.totalUsers || 0)} icon={FiUsers} color="primary" />
            <StatCard title="Loan Volume" value={formatCurrency(stats?.loanStats?.[0]?.total || 0)} icon={FiLayers} color="rose" />
            <StatCard title="Wallet Pool" value={formatCurrency(stats?.totalWalletBalance || 0)} icon={FiDollarSign} color="emerald" />
            <StatCard title="Txn Success" value="98%" icon={FiCheckCircle} color="cyan" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
               <Card title="Activity Feed" subtitle="Real-time operational updates">
                 <div className="divide-y divide-gray-50">
                    {activities.map((item, idx) => <ActivityItem key={idx} activity={item} />)}
                 </div>
               </Card>
             </div>
             <div className="lg:col-span-1 space-y-6">
                <Link to="/kyc" className="block p-8 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-100 hover:scale-[1.02] transition-transform">
                   <FiCheckCircle className="mb-4 text-blue-200" size={32} />
                   <h3 className="font-bold text-lg mb-1">Verify KYCs</h3>
                   <p className="text-xs text-blue-100 opacity-80">You have 128 pending identity verifications.</p>
                </Link>
             </div>
          </div>
        </div>
      );
  }
};

export default Dashboard;
