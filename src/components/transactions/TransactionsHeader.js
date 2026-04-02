import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../styles/colors';

const TransactionsHeader = ({ summary, onOpenFilters, onOpenAI, fmt }) => {
  const income = summary?.totalCredit ?? 0;
  const expense = summary?.totalDebit ?? 0;
  const net = summary?.netBalance ?? (income - expense);
  const netPositive = net >= 0;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const topCats = summary?.topCategories || [];

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Transaction History</Text>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: '#10b981' }]}>
          <Ionicons name="arrow-down-circle" size={18} color="#10b981" style={{ marginBottom: 2 }} />
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>₦{fmt(income)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: '#ef4444' }]}>
          <Ionicons name="arrow-up-circle" size={18} color="#ef4444" style={{ marginBottom: 2 }} />
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>₦{fmt(expense)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: netPositive ? '#2563eb' : '#f59e0b' }]}>
          <Ionicons name={netPositive ? 'trending-up' : 'trending-down'} size={18} color={netPositive ? '#2563eb' : '#f59e0b'} style={{ marginBottom: 2 }} />
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryValue, { color: netPositive ? '#2563eb' : '#f59e0b' }]}>{netPositive ? '+' : ''}₦{fmt(net)}</Text>
        </View>
      </View>

      {income > 0 && (
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Savings Rate</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: savingsRate >= 20 ? '#10b981' : '#f59e0b' }}>{savingsRate}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${Math.min(savingsRate, 100)}%`, backgroundColor: savingsRate >= 20 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
          </View>
        </View>
      )}

      {topCats.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>TOP SPENDING</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {topCats.map((c, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6'][i % 5], marginRight: 5 }} />
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>{c.category} · ₦{fmt(c.total)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.aiCard} onPress={onOpenAI} activeOpacity={0.85}>
        <View style={styles.aiCardLeft}>
          <View style={styles.aiIconBg}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiCardTitle}>VPay AI Advisor</Text>
            <Text style={styles.aiCardSub}>Get personalised financial tips</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6366f1" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.filterButton} onPress={onOpenFilters}>
        <Ionicons name="filter" size={20} color={colors.textLight} />
        <Text style={styles.filterText}>Filters</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.lightBg,
    padding: 16,
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
    padding: 8,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  aiCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f2fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  aiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  aiCardSub: {
    fontSize: 13,
    color: '#475569',
  },
});

export default TransactionsHeader;
