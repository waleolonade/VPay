import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import TransactionItem from '../transactions/TransactionItem';
import { colors } from '../../styles/colors';

const TransactionHistory = ({ transactions, navigation, ...props }) => (
  <FlatList
    data={transactions}
    renderItem={({ item }) => <TransactionItem item={item} navigation={navigation} />}
    keyExtractor={(item) => item.reference || item.id}
    ListEmptyComponent={
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transactions yet.</Text>
      </View>
    }
    {...props}
  />
);

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default TransactionHistory;