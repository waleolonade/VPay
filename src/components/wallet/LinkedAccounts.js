import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

const LinkedAccounts = ({ accounts }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Linked Accounts</Text>
      <TouchableOpacity>
        <Text style={styles.seeAll}>See All</Text>
      </TouchableOpacity>
    </View>
    {(!accounts || accounts.length === 0) ? (
      <View style={styles.emptyBox}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
        <Text style={styles.emptyText}>No linked accounts found.</Text>
        <Text style={styles.emptySubText}>Your wallet is active, but no accounts are linked yet.</Text>
      </View>
    ) : (
      <FlatList
        data={accounts}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.accountCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={styles.bankIconBox}>
                  <Ionicons name="business-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.chip} />
            </View>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.bankName}>{item.bankName || 'VPay MFB'}</Text>
                <Text style={styles.accountNumber}>{item.accountNumber}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 10,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  emptySubText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  accountCard: {
    width: 220,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    width: 34,
    height: 24,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    opacity: 0.3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bankName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
});

export default LinkedAccounts;