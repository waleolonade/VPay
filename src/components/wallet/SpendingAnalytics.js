import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../styles/colors';

const { width } = Dimensions.get('window');

const SpendingAnalytics = ({ transactions = [] }) => {
  // Enhanced Mock categories with real-world fintech colors
  const categories = [
    { name: 'Shopping & Groceries', amount: 45000, color: '#FF7043', percent: 45 },
    { name: 'Transport & Fuel', amount: 20000, color: '#42A5F5', percent: 20 },
    { name: 'Utility Bills', amount: 25000, color: '#66BB6A', percent: 25 },
    { name: 'Entertainment', amount: 10000, color: '#AB47BC', percent: 10 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spending Insights</Text>
          <Text style={styles.subtitle}>Analyzing your March transactions</Text>
        </View>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>Monthly</Text>
        </View>
      </View>

      <View style={styles.list}>
        {categories.map((cat, i) => (
          <View key={i} style={styles.categoryRow}>
            <View style={styles.rowTop}>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catAmount}>₦{cat.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.progressBg}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${cat.percent}%`, backgroundColor: cat.color }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalValue}>₦100,000.00</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
  },
  periodBadge: {
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  list: {
    gap: 18,
  },
  categoryRow: {
    width: '100%',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
});

export default SpendingAnalytics;