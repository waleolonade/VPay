import React from 'react';
import { View, StyleSheet } from 'react-native';

const TransactionSkeleton = () => (
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

const styles = StyleSheet.create({
  skeletonItem: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 24,
    marginBottom: 8,
    height: 80,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    marginRight: 16,
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
});

export default TransactionSkeleton;
