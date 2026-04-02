import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../../styles/colors';

/**
 * RecentTransactions Component
 * Displays recent transactions including bill payments
 * Integrates with VFDTech Bills Payment API transaction data
 */
export default function RecentTransactions({ 
  transactions = [], 
  onTransactionPress,
  showViewAll = true 
}) {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transaction}
      onPress={() => onTransactionPress && onTransactionPress(item.id)}
      activeOpacity={0.6}
    >
      <View style={styles.left}>
        <View style={[
          styles.iconBox,
          item.type === 'debit' && item.category === 'bill' && styles.billIcon
        ]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{item.date}</Text>
          {item.reference && (
            <Text style={styles.reference}>Ref: {item.reference}</Text>
          )}
        </View>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amount, 
          item.type === 'debit' && styles.debit,
          item.status === 'pending' && styles.pendingAmount
        ]}>
          {item.type === 'debit' ? '-' : '+'}₦{item.amount}
        </Text>
        {item.status === 'pending' && (
          <Text style={styles.status}>Pending</Text>
        )}
        {item.status === 'success' && item.type === 'debit' && (
          <Text style={styles.statusSuccess}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleViewAll = () => {
    if (onTransactionPress) {
      onTransactionPress('view-all');
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recent Transactions</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Transactions</Text>
        {showViewAll && (
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  viewAll: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.lightBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  billIcon: {
    backgroundColor: '#FFE8CC',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textLight,
  },
  reference: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  debit: {
    color: colors.danger,
  },
  pendingAmount: {
    color: colors.warning,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  statusSuccess: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
});
