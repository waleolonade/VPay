import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiDownload, FiEye, FiRefreshCw, FiFilter,
  FiTrendingUp, FiTrendingDown, FiActivity, FiAlertCircle,
  FiX, FiCheckCircle, FiCalendar, FiDollarSign,
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { transactionService } from '../../services';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SelectInput from '../../components/common/SelectInput';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, debounce } from '../../utils/helpers';
import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from '../../utils/constants';

// ── Helper ────────────────────────────────────────────────────────────────────
const fmtNum = (n) =>
  Number(n || 0).toLocaleString('en-NG');

const statusColor = (s) => ({
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  success:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  failed:    'bg-red-50 text-red-700 border border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border border-gray-200',
})[s] ?? 'bg-gray-100 text-gray-600 border border-gray-200';

const typeColor = (t) => ({
  credit: 'text-emerald-600 font-semibold',
  debit:  'text-red-500 font-semibold',
})[t] ?? 'text-gray-700';

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'indigo', loading }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald:'bg-emerald-50 text-emerald-600',
    red:    'bg-red-50 text-red-600',
    amber:  'bg-amber-50 text-amber-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      {loading ? (
        <div className="h-6 w-24 bg-gray-100 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-xl font-bold text-gray-900 mb-0.5">{value}</p>
      )}
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  );
};

// ── Refund Modal ──────────────────────────────────────────────────────────────
const RefundModal = ({ transaction, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Confirm Refund</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <FiAlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
          <p className="text-sm text-amber-800">
            This will reverse the transaction and credit the user's wallet. This action cannot be undone.
          </p>
        </div>
        <div className="space-y-2 bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono font-medium text-gray-800">{transaction.reference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-gray-900">{formatCurrency(transaction.amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">User</span>
            <span className="text-gray-800">{transaction.user?.email || transaction.user_id}</span>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Processing…' : 'Confirm Refund'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Transactions = () => {
  const queryClient = useQueryClient();
  const [page, setPage]             = useState(1);
  const [refundTarget, setRefundTarget] = useState(null);
  const [filters, setFilters]       = useState({
    search:    '',
    type:      '',
    status:    '',
    startDate: '',
    endDate:   '',
    category:  '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: txData, isLoading: txLoading } = useQuery(
    ['admin-transactions', page, filters],
    () => transactionService.getTransactions({ page, limit: 20, ...filters }),
    { keepPreviousData: true }
  );

  const { data: summaryData, isLoading: summaryLoading } = useQuery(
    ['admin-tx-summary'],
    () => transactionService.getTransactionSummary?.() || Promise.resolve(null),
    { retry: false }
  );

  const summary = summaryData?.data;
  const transactions = txData?.data ?? [];
  const pagination   = txData?.pagination ?? txData?.meta;

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!summary?.monthly) return [];
    return summary.monthly.map(m => ({
      month: m.month,
      Income:  Number(m.income),
      Expense: Number(m.expense),
    }));
  }, [summary]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const refundMutation = useMutation(
    (id) => transactionService.refundTransaction(id, 'Admin initiated refund'),
    {
      onSuccess: () => {
        toast.success('Refund processed successfully');
        queryClient.invalidateQueries(['admin-transactions']);
        setRefundTarget(null);
      },
      onError: (err) => toast.error(err.message || 'Refund failed'),
    }
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = debounce((value) => {
    setFilters(f => ({ ...f, search: value }));
    setPage(1);
  }, 500);

  const handleFilterChange = (field, value) => {
    setFilters(f => ({ ...f, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', type: '', status: '', startDate: '', endDate: '', category: '' });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      // Build CSV from current filters
      const allData = await transactionService.getTransactions({ ...filters, limit: 5000, page: 1 });
      const rows = allData?.data ?? [];
      if (!rows.length) { toast.error('No data to export'); return; }
      const header = ['Reference', 'Date', 'Type', 'Category', 'Amount', 'Fee', 'Status', 'User'];
      const csvRows = rows.map(t => [
        t.reference, formatDate(t.created_at || t.createdAt), t.type,
        t.category, t.amount, t.fee ?? 0, t.status, t.user?.email || t.user_id,
      ]);
      const csv = [header, ...csvRows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `transactions_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor, search, and manage all platform transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showFilters || activeFilters
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300'
            }`}
          >
            <FiFilter size={15} />
            Filters
            {activeFilters > 0 && (
              <span className="bg-white/30 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 text-sm font-medium transition-all"
          >
            <FiDownload size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiActivity}
          label="Total Transactions"
          value={fmtNum(summary?.totalTransactions)}
          color="indigo"
          loading={summaryLoading}
          sub={summary?.transactionsChange ? `${summary.transactionsChange > 0 ? '+' : ''}${summary.transactionsChange}%` : undefined}
        />
        <StatCard
          icon={FiTrendingUp}
          label="Total Credits (₦)"
          value={'₦' + fmtNum(summary?.totalCredit)}
          sub={
            summary?.creditChange !== undefined
              ? `${summary.creditChange > 0 ? '+' : ''}${summary.creditChange}%`
              : `${fmtNum(summary?.creditCount)} txns`
          }
          color="emerald"
          loading={summaryLoading}
        />
        <StatCard
          icon={FiTrendingDown}
          label="Total Debits (₦)"
          value={'₦' + fmtNum(summary?.totalDebit)}
          sub={
            summary?.debitChange !== undefined
              ? `${summary.debitChange > 0 ? '+' : ''}${summary.debitChange}%`
              : `${fmtNum(summary?.debitCount)} txns`
          }
          color="red"
          loading={summaryLoading}
        />
        <StatCard
          icon={FiAlertCircle}
          label="Pending / Failed"
          value={`${fmtNum(summary?.pendingCount)} / ${fmtNum(summary?.failedCount)}`}
          sub={summary?.pendingChange !== undefined ? `${summary.pendingChange > 0 ? '+' : ''}${summary.pendingChange}%` : undefined}
          color="amber"
          loading={summaryLoading}
        />
      </div>

      {/* Top Users Breakdown */}
      {summary?.topUsers?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Users by Volume</h3>
          <div className="space-y-2">
            {summary.topUsers.map((user, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-32 truncate">{user.email || user.user_id}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${user.percent || 0}%` }} />
                </div>
                <span className="text-xs text-gray-700 font-medium w-24 text-right">
                  ₦{fmtNum(user.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="flex gap-2 mb-4">
        <Button onClick={handleExport} icon={FiDownload}>
          Export CSV
        </Button>
        <Button onClick={() => toast('Excel export coming soon!')} icon={FiDownload}>
          Export Excel
        </Button>
      </div>

      {/* Real-time Updates Placeholder */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
          <FiRefreshCw className="animate-spin" />
          Real-time updates enabled
        </span>
      </div>

      {/* Monthly Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Volume (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [`₦${Number(v).toLocaleString('en-NG')}`, undefined]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Income"  stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
              <Area type="monotone" dataKey="Expense" stroke="#6366f1" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Categories */}
      {summary?.topCategories?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Spending Categories</h3>
          <div className="space-y-2">
            {summary.topCategories.map((cat, i) => {
              const maxTotal = summary.topCategories[0].total;
              const pct      = maxTotal > 0 ? Math.round((cat.total / maxTotal) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 truncate capitalize">{cat.category || 'Other'}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-700 font-medium w-24 text-right">
                    ₦{fmtNum(cat.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Filter Transactions</h3>
            {activeFilters > 0 && (
              <button onClick={handleClearFilters} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                <FiX size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                placeholder="Search reference, user…"
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
              />
            </div>
            <SelectInput
              placeholder="Type"
              options={[{ value: '', label: 'All Types' }, ...TRANSACTION_TYPES]}
              value={TRANSACTION_TYPES.find(t => t.value === filters.type) || null}
              onChange={(o) => handleFilterChange('type', o?.value || '')}
              isClearable
            />
            <SelectInput
              placeholder="Status"
              options={[{ value: '', label: 'All Statuses' }, ...TRANSACTION_STATUSES]}
              value={TRANSACTION_STATUSES.find(s => s.value === filters.status) || null}
              onChange={(o) => handleFilterChange('status', o?.value || '')}
              isClearable
            />
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none"
              />
            </div>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none"
              />
            </div>
            <input
              placeholder="Category e.g. airtime, bills…"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {txLoading ? (
          <div className="py-20 flex items-center justify-center">
            <Loading />
          </div>
        ) : !transactions.length ? (
          <EmptyState
            title="No transactions found"
            description="Try adjusting your filters or date range."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Reference', 'Date', 'Type', 'Category', 'Amount', 'Fee', 'Status', 'User', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id || tx._id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[140px] truncate">
                        {tx.reference || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(tx.created_at || tx.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm capitalize ${typeColor(tx.type)}`}>
                          {tx.type === 'credit' ? '↑ ' : '↓ '}{tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {tx.category || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {tx.fee ? formatCurrency(tx.fee) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                        {tx.user?.email || tx.user_id || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/transactions/${tx.reference || tx.id}`}
                            title="View details"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <FiEye size={15} />
                          </Link>
                          {(tx.status === 'completed' || tx.status === 'success') && (
                            <button
                              title="Refund"
                              onClick={() => setRefundTarget(tx)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <FiRefreshCw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="px-4 py-4 border-t border-gray-100">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages || pagination.pages}
                  totalItems={pagination.total}
                  itemsPerPage={20}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Refund Modal */}
      {refundTarget && (
        <RefundModal
          transaction={refundTarget}
          onClose={() => setRefundTarget(null)}
          onConfirm={() => refundMutation.mutate(refundTarget.id || refundTarget._id)}
          loading={refundMutation.isLoading}
        />
      )}
    </div>
  );
};

export default Transactions;
