import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../../styles/colors';
import useTransactions from '../../hooks/useTransactions';
import TransactionItem from '../../components/transactions/TransactionItem';
import TransactionSkeleton from '../../components/transactions/TransactionSkeleton';
import TransactionsHeader from '../../components/transactions/TransactionsHeader';
import EmptyState from '../../components/common/EmptyState';
import FilterModal from '../../components/transactions/FilterModal';
import AIAdvisorModal from '../../components/transactions/AIAdvisorModal';

const { width } = Dimensions.get('window');

const fmt = (n) => {
  const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.-]/g, '')) : Number(n);
  const safeNum = isNaN(num) ? 0 : num;
  return safeNum.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function TransactionsScreen({ navigation }) {
  const {
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
  } = useTransactions();

  const [showFilters, setShowFilters] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTransactions(true);
    }, [])
  );

  const handleApplyFilters = async () => {
    await saveFilters();
    loadTransactions(true);
    setShowFilters(false);
  };

  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={Array(5).fill({})}
          renderItem={() => <TransactionSkeleton />}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={({ item }) => <TransactionItem item={item} navigation={navigation} />}
        keyExtractor={(item, index) => item.reference || item.id || `txn-${index}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <TransactionsHeader
            summary={summary}
            onOpenFilters={() => setShowFilters(true)}
            onOpenAI={() => setShowAIModal(true)}
            fmt={fmt}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No transactions yet"
            subtitle="Your transaction history will appear here"
            buttonText="Add Funds"
            onPress={() => navigation.navigate('Wallet')}
          />
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

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
        onClear={clearFilters}
      />

      <AIAdvisorModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        summary={summary}
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
    padding: 16,
    paddingBottom: 100,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 14,
  },
});
