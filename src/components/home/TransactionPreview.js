import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/colors';
import TransactionItem from '../transactions/TransactionItem';

const TransactionPreview = ({ transactions, onViewAll, onTransactionPress }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Recent Transactions</Text>
      <TouchableOpacity onPress={onViewAll}>
        <Text style={styles.viewAll}>View All</Text>
      </TouchableOpacity>
    </View>
    <FlatList
      data={transactions}
      renderItem={({ item }) => (
        <TransactionItem 
          item={item} 
          onPress={() => onTransactionPress(item)} 
        />
      )}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  viewAll: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default TransactionPreview;