import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

const { width } = Dimensions.get('window');

const WalletBalance = ({ availableBalance, ledgerBalance, savingsBalance = 0, bonusBalance = 0 }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#1a237e']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.label}>Total Available Balance</Text>
          <TouchableOpacity onPress={() => setIsVisible(!isVisible)}>
            <Ionicons 
              name={isVisible ? "eye-outline" : "eye-off-outline"} 
              size={20} 
              color="rgba(255, 255, 255, 0.7)" 
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.balance}>
          {isVisible ? `₦${Number(availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₦ ****.**'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Ledger Balance</Text>
            <Text style={styles.footerValue}>
                {isVisible ? `₦${Number(ledgerBalance).toLocaleString()}` : '****'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Bonus Fund</Text>
            <Text style={styles.footerValue}>
                {isVisible ? `₦${Number(bonusBalance).toLocaleString()}` : '****'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Savings Vault Integration */}
      <TouchableOpacity style={styles.savingsCard}>
        <View style={styles.savingsIconBox}>
          <Ionicons name="safe-outline" size={24} color={colors.secondary} />
        </View>
        <View style={styles.savingsInfo}>
          <Text style={styles.savingsLabel}>Savings Vault</Text>
          <Text style={styles.savingsAmount}>
            {isVisible ? `₦${Number(savingsBalance).toLocaleString()}` : '₦ ****.**'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  balance: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 12,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footerValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15,
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  savingsIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 2,
  },
  savingsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
});

export default WalletBalance;