import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

const categoryIcons = {
  deposit: { name: 'wallet-outline', color: '#4caf50' },
  transfer: { name: 'paper-plane-outline', color: '#2196f3' },
  airtime: { name: 'phone-portrait-outline', color: '#ff9800' },
  data: { name: 'wifi-outline', color: '#00bcd4' },
  bills: { name: 'receipt-outline', color: '#e91e63' },
  savings: { name: 'safe-outline', color: '#9c27b0' },
  default: { name: 'swap-horizontal-outline', color: '#757575' },
};

const TransactionItem = ({ item, navigation, onPress }) => {
  const iconConfig = categoryIcons[item.category?.toLowerCase()] || categoryIcons.default;
  const isCredit = item.type === 'credit';

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress || (() => navigation?.navigate('TransactionReceipt', { transaction: item }))}
      activeOpacity={0.6}
    >
      <View style={[styles.itemIcon, { backgroundColor: `${iconConfig.color}10` }]}>
        <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.description || item.category || 'Transaction'}
        </Text>
        <Text style={styles.itemDate}>
          {new Date(item.created_at || item.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
        </Text>
      </View>

      <View style={styles.itemRight}>
        <Text style={[styles.amountText, { color: isCredit ? '#2e7d32' : '#c62828' }]}>
          {isCredit ? '+' : '-'}₦{parseFloat(item.amount || 0).toLocaleString()}
        </Text>
        <Text style={[styles.statusText, { color: item.status === 'completed' || item.status === 'success' ? '#4caf50' : '#ffa000' }]}>
          {item.status || 'Pending'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default TransactionItem;
