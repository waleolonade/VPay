import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { transactionService } from '../../services/transactionService';
import { TransactionDetailScreen } from './TransactionDetailScreen';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 80;

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Bill Payment', value: 'bill' },
  { label: 'Airtime', value: 'airtime' },
  { label: 'Data', value: 'data' },
  { label: 'Wallet Fund', value: 'wallet_fund' },
];

const STATUSES = [
  { label: 'All', value: '' },
  { label: 'Success', value: 'success' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
];

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    fromDate: null,
    toDate: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('from'); // 'from' or 'to'

  const loadTransactions = useCallback(async (isRefresh = false, append = false) => {
    try {
      const params = {
        page: isRefresh ? 1 : page,
        limit: 15,
        type: filters.category,
        status: filters.status,
        ...(filters.fromDate && { fromDate: filters.fromDate.toISOString().split('T')[0] }),
        ...(filters.toDate && { toDate: filters.toDate.toISOString().split('T')[0] }),
      };

      if (isRefresh || append === false) {
        setLoading(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const res = await transactionService.getVFDTransactions(params);
      const data = res.data?.data || res.data || [];

      setTransactions(isRefresh || !append ? data : [...transactions, ...data]);
      setHasMore(data.length === 15);

      // Load summary
      try {
        const summaryRes = await transactionService.getTransactionSummary();
        setSummary(summaryRes.data || {});
      } catch {}
    } catch (error) {
      console.error('Load transactions error:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [page, filters, transactions]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setPage(page + 1);
      loadTransactions(false, true);
    }
  }, [page, hasMore, loadingMore, filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransactions(true);
  }, [loadTransactions]);

  const saveFilters = async () => {
    await AsyncStorage.setItem('transactionFilters', JSON.stringify(filters));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', status: '', fromDate: null, toDate: null });
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions(true);
    }, [])
  );

  useEffect(() => {
    AsyncStorage.getItem('transactionFilters').then(data => {
      if (data) setFilters(JSON.parse(data));
    });
  }, []);

  const TransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('TransactionDetail', { reference: item.reference })}
      activeOpacity={0.7}
    >
      <View style={styles.itemIcon}>
        <Ionicons
          name={item.type === 'credit' ? 'add-circle' : 'remove-circle'}
          size={24}
          color={item.type === 'credit' ? colors.success : colors.danger}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.description || item.category}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemType}>{item.category?.toUpperCase()}</Text>
          <Text style={styles.itemDate}>{new Date(item.created_at || item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={styles.itemAmount}>
        <Text style={[
          styles.amountText,
          { color: item.type === 'credit' ? colors.success : colors.danger }
        ]}>
          {item.type === 'credit' ? '+' : '-'}₦{parseFloat(item.amount || 0).toLocaleString()}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'success' ? '#E8F5E9' : item.status === 'pending' ? '#FFF3E0' : '#FFEBEE' }
        ]}>
          <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonItem}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine1} />
        <View style={styles.skeletonLine2} />
      </View>
      <View style={styles.skeletonAmount}>
        <View style={styles.skeletonLine3} />
        <View style={styles.skeletonBadge} />
      </View>
    </View>
  );

  const HeaderComponent = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Recent Transactions</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>₦{summary.total?.toLocaleString() || '0'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>₦{summary.income?.toLocaleString() || '0'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>₦{summary.expense?.toLocaleString() || '0'}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
        <Ionicons name="filter" size={20} color={colors.textLight} />
        <Text style={styles.filterText}>Filters</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={Array(5).fill({})}
          renderItem={renderSkeleton}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.skeletonList}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={({ item }) => <TransactionItem item={item} />}
        keyExtractor={(item) => item.reference || item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={HeaderComponent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>Your transaction history will appear here</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Wallet')}>
              <Text style={styles.emptyButtonText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loadingMore && (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.footerText}>Loading more...</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filters</Text>
          
          {/* Search */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Search</Text>
            <TouchableOpacity style={styles.searchInput} onPress={() => {}}>
              <Ionicons name="search" size={20} color={colors.textLight} />
              <Text style={styles.searchPlaceholder}>{filters.search || 'Search transactions'}</Text>
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Category</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => {}}>
              <Text style={styles.dropdownText}>{CATEGORIES.find(c => c.value === filters.category)?.label || 'All Categories'}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text style={styles.dropdownText}>{STATUSES.find(s => s.value === filters.status)?.label || 'All Statuses'}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Date Range */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => {
              setDateType('from');
              setDatePickerVisible(true);
            }}>
              <Text style={styles.dateText}>
                {filters.fromDate ? filters.fromDate.toLocaleDateString() : 'From Date'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => {
              setDateType('to');
              setDatePickerVisible(true);
            }}>
              <Text style={styles.dateText}>
                {filters.toDate ? filters.toDate.toLocaleDateString() : 'To Date'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={async () => {
              await saveFilters();
              loadTransactions(true);
              setShowFilters(false);
            }}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DatePicker
        modal
        open={datePickerVisible}
        date={filters[dateType === 'from' ? 'fromDate' : 'toDate'] || new Date()}
        mode="date"
        onConfirm={(date) => {
          setDatePickerVisible(false);
          setFilters(prev => ({
            ...prev,
            [dateType + 'Date']: date,
          }));
        }}
        onCancel={() => setDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.lightBg,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  itemType: {
    fontSize: 12,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  itemDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  itemAmount: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  skeletonList: {
    flex: 1,
    padding: spacing.lg,
  },
  skeletonItem: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    height: ITEM_HEIGHT,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    marginRight: spacing.md,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonLine1: {
    width: '80%',
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonLine2: {
    width: '60%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonAmount: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: 100,
  },
  skeletonLine3: {
    width: 80,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: 8,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 14,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  filterGroup: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
  },
  searchPlaceholder: {
    color: colors.textLight,
    fontSize: 16,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
  },
  dateButton: {
    padding: spacing.md,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  clearButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.textLight,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
