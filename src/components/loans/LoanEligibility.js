import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

export default function LoanEligibility({ status = 'eligible', amount = '500000' }) {
  return (
    <View style={styles.container}>
      <View style={styles.statusBadge(status)}>
        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
      </View>
      <Text style={styles.label}>Loan Eligibility</Text>
      <Text style={styles.amount}>₦{amount}</Text>
      <Text style={styles.description}>You are eligible to borrow up to this amount</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statusBadge: (status) => ({
    backgroundColor:
      status === 'eligible'
        ? colors.success + '20'
        : status === 'pending'
        ? colors.warning + '20'
        : colors.danger + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  }),
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color:
      status === 'eligible'
        ? colors.success
        : status === 'pending'
        ? colors.warning
        : colors.danger,
  },
  label: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: colors.textLight,
  },
});
