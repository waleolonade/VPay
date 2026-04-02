import { useState, useCallback, useRef, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    fromDate: null,
    toDate: null,
  });

  const pageRef = useRef(1);

  const loadTransactions = useCallback(async (isRefresh = false, append = false) => {
    try {
      const currentPage = isRefresh ? 1 : pageRef.current;
      const params = {
        page: currentPage,
        limit: 15,
        category: filters.category || undefined,
        status: filters.status || undefined,
        ...(filters.fromDate && { startDate: filters.fromDate.toISOString().split('T')[0] }),
        ...(filters.toDate && { endDate: filters.toDate.toISOString().split('T')[0] }),
      };

      if (isRefresh || !append) {
        setLoading(true);
        pageRef.current = 1;
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const res = await transactionService.getTransactions(params);
      const newData = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data : [];

      if (isRefresh || !append) {
        setTransactions(newData);
      } else {
        setTransactions(prev => {
          const knownKeys = new Set(prev.map(t => t.reference || t.id));
          const fresh = newData.filter(t => !knownKeys.has(t.reference || t.id));
          return [...prev, ...fresh];
        });
      }
      setHasMore(newData.length === 15);

      transactionService.getTransactionSummary()
        .then(s => setSummary(s?.data || null))
        .catch(() => {});
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      pageRef.current += 1;
      loadTransactions(false, true);
    }
  }, [loadingMore, hasMore, loadTransactions]);

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

  useEffect(() => {
    AsyncStorage.getItem('transactionFilters').then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.fromDate) parsed.fromDate = new Date(parsed.fromDate);
        if (parsed.toDate)   parsed.toDate   = new Date(parsed.toDate);
        setFilters(parsed);
      }
    });
  }, []);

  return {
    transactions,
    summary,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    filters,
    setFilters,
    loadTransactions,
    loadMore,
    onRefresh,
    saveFilters,
    clearFilters,
  };
};

export default useTransactions;
