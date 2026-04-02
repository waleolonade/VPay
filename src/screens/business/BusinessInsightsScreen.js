import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { businessService } from '../../services/businessService';
import LoadingIndicator from '../../components/LoadingIndicator';

const { width } = Dimensions.get('window');

export default function BusinessInsightsScreen({ navigation }) {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [growth, setGrowth] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setRefreshing(true);
      const [overviewRes, trendsRes, growthRes, customersRes, categoriesRes] = await Promise.all([
        businessService.getAnalyticsOverview(),
        businessService.getMonthlyTrends(6),
        businessService.getGrowthRate(),
        businessService.getTopCustomers(5),
        businessService.getCategoryBreakdown(),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (growthRes.success) setGrowth(growthRes.data);
      if (customersRes.success) setCustomers(customersRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatShortCurrency = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(1)}K`;
    return `₦${amount?.toFixed(0) || '0'}`;
  };

  if (loading) {
    return <LoadingIndicator text="Loading business analytics..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trends' && styles.tabActive]}
          onPress={() => setSelectedTab('trends')}
        >
          <Text style={[styles.tabText, selectedTab === 'trends' && styles.tabTextActive]}>Trends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'customers' && styles.tabActive]}
          onPress={() => setSelectedTab('customers')}
        >
          <Text style={[styles.tabText, selectedTab === 'customers' && styles.tabTextActive]}>Customers</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAnalytics} />}
      >
        {selectedTab === 'overview' && (
          <>
            {growth && (
              <View style={[styles.growthCard, { backgroundColor: growth.trend === 'up' ? '#E8F5E9' : '#FFF3E0' }]}>
                <View style={styles.growthHeader}>
                  <Text style={styles.growthLabel}>Monthly Growth</Text>
                  <View style={styles.growthBadge}>
                    <Ionicons
                      name={growth.trend === 'up' ? 'trending-up' : growth.trend === 'down' ? 'trending-down' : 'remove'}
                      size={16}
                      color={growth.trend === 'up' ? '#4CAF50' : growth.trend === 'down' ? '#F44336' : '#FFC107'}
                    />
                    <Text
                      style={[
                        styles.growthRate,
                        { color: growth.trend === 'up' ? '#4CAF50' : growth.trend === 'down' ? '#F44336' : '#FFC107' },
                      ]}
                    >
                      {Math.abs(growth.growthRate).toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.growthText}>
                  {growth.trend === 'up'
                    ? '📈 Your business is growing!'
                    : growth.trend === 'down'
                      ? '📉 Focus on customer retention'
                      : '➡️ Maintain steady performance'}
                </Text>
              </View>
            )}

            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="cash-multiple" size={28} color="#2196F3" />
                <Text style={styles.metricValue}>{formatCurrency(overview?.totalIncome)}</Text>
                <Text style={styles.metricLabel}>Total Income</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: '#FCE4EC' }]}>
                <MaterialCommunityIcons name="cash-minus" size={28} color="#E91E63" />
                <Text style={styles.metricValue}>{formatCurrency(overview?.totalExpenses)}</Text>
                <Text style={styles.metricLabel}>Total Expenses</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="chart-line" size={28} color="#4CAF50" />
                <Text style={styles.metricValue}>{formatCurrency(overview?.netProfit)}</Text>
                <Text style={styles.metricLabel}>Net Profit</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="account-group" size={28} color="#FF9800" />
                <Text style={styles.metricValue}>{overview?.uniqueCustomers || 0}</Text>
                <Text style={styles.metricLabel}>Unique Customers</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Month</Text>
              <View style={styles.performanceCard}>
                <View style={styles.performanceRow}>
                  <View style={styles.performanceItem}>
                    <Ionicons name="arrow-down-circle" size={24} color="#4CAF50" />
                    <View style={styles.performanceInfo}>
                      <Text style={styles.performanceLabel}>Income</Text>
                      <Text style={styles.performanceValue}>{formatCurrency(overview?.monthlyIncome)}</Text>
                    </View>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="arrow-up-circle" size={24} color="#F44336" />
                    <View style={styles.performanceInfo}>
                      <Text style={styles.performanceLabel}>Expenses</Text>
                      <Text style={styles.performanceValue}>{formatCurrency(overview?.monthlyExpenses)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.performanceDivider} />
                <View style={styles.performanceFooter}>
                  <Text style={styles.performanceLabel}>Avg Transaction</Text>
                  <Text style={styles.performanceValue}>{formatCurrency(overview?.avgTransactionValue)}</Text>
                </View>
              </View>
            </View>

            {categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category Breakdown</Text>
                <View style={styles.categoryCard}>
                  {categories.slice(0, 5).map((cat, index) => (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{cat.category}</Text>
                        <Text style={styles.categoryCount}>{cat.count} transactions</Text>
                      </View>
                      <Text style={styles.categoryValue}>{formatCurrency(cat.total)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {selectedTab === 'trends' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue Trends (Last 6 Months)</Text>
              <View style={styles.chartCard}>
                <View style={styles.chartArea}>
                  {trends.map((item, index) => {
                    const maxIncome = Math.max(...trends.map((t) => t.income));
                    const height = maxIncome > 0 ? (item.income / maxIncome) * 150 : 20;
                    return (
                      <View key={index} style={styles.chartCol}>
                        <View style={[styles.chartBar, { height, backgroundColor: colors.primary }]}>
                          <View style={styles.barTooltip}>
                            <Text style={styles.tooltipText}>{formatShortCurrency(item.income)}</Text>
                          </View>
                        </View>
                        <Text style={styles.chartLabel}>{item.month.split('-')[1]}</Text>
                      </View>
                    );
                  })}
                  {trends.length === 0 && <Text style={styles.noData}>No trend data available</Text>}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profit & Loss</Text>
              <View style={styles.plCard}>
                {trends.map((item, index) => (
                  <View key={index} style={styles.plItem}>
                    <Text style={styles.plMonth}>
                      {new Date(`${item.month}-01`).toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                    <View style={styles.plValues}>
                      <Text style={styles.plIncome}>+{formatShortCurrency(item.income)}</Text>
                      <Text style={styles.plExpenses}>-{formatShortCurrency(item.expenses)}</Text>
                      <Text style={[styles.plProfit, item.profit < 0 && styles.plLoss]}>
                        {item.profit >= 0 ? '+' : ''}
                        {formatShortCurrency(item.profit)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {selectedTab === 'customers' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Customers</Text>
              <View style={styles.customerCard}>
                {customers.map((customer, index) => (
                  <View key={index} style={styles.customerItem}>
                    <View style={styles.customerRank}>
                      <Text style={styles.customerRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>{customer.customerName || 'Anonymous'}</Text>
                      <Text style={styles.customerStats}>
                        {customer.transactionCount} transactions • Last:{' '}
                        {new Date(customer.lastTransaction).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.customerValue}>{formatCurrency(customer.totalSpent)}</Text>
                  </View>
                ))}
                {customers.length === 0 && <Text style={styles.emptyText}>No customer data available yet</Text>}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Insights</Text>
              <View style={styles.insightCard}>
                <View style={styles.insightItem}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                  <Text style={styles.insightText}>You have {overview?.uniqueCustomers || 0} unique customers</Text>
                </View>
                <View style={styles.insightItem}>
                  <Ionicons name="trending-up" size={20} color="#4CAF50" />
                  <Text style={styles.insightText}>
                    Average order value: {formatCurrency(overview?.avgTransactionValue)}
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <Ionicons name="repeat" size={20} color="#FF9800" />
                  <Text style={styles.insightText}>
                    {customers.length > 0 && customers[0].transactionCount > 5
                      ? 'High customer loyalty detected'
                      : 'Focus on customer retention'}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  scroll: { padding: 16, paddingBottom: 40 },
  growthCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  growthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  growthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthRate: {
    fontSize: 16,
    fontWeight: '700',
  },
  growthText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  performanceInfo: {
    gap: 4,
  },
  performanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  performanceDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  performanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  chartArea: {
    height: 200,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 30,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'flex-start',
  },
  barTooltip: {
    position: 'absolute',
    top: -28,
    width: 60,
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chartLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
  },
  plCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  plItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  plMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    width: 40,
  },
  plValues: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
    justifyContent: 'flex-end',
  },
  plIncome: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  plExpenses: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F44336',
  },
  plProfit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    minWidth: 60,
    textAlign: 'right',
  },
  plLoss: {
    color: '#F44336',
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  customerStats: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  customerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  noData: {
    color: colors.textLight,
    fontStyle: 'italic',
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
