import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../styles/colors';

const { width } = Dimensions.get('window');

export default function WalletCard({ wallet, isActive, onPress }) {
  const { type, balance, accountNumber, bankName, name } = wallet;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(accountNumber);
  };

  const isBusiness = type === 'business';

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={[
        styles.card,
        isBusiness ? styles.businessCard : styles.personalCard,
        isActive && styles.activeCard
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{isBusiness ? 'BUSINESS' : 'PERSONAL'}</Text>
        </View>
        <Ionicons name="shield-checkmark" size={20} color="rgba(255,255,255,0.8)" />
      </View>

      <Text style={styles.walletLabel}>{name || (isBusiness ? 'Business Wallet' : 'Personal Wallet')}</Text>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.currencySymbol}>₦</Text>
        <Text style={styles.balanceText}>{Number(balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.bankLabel}>{bankName || 'VFD Bank'}</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountNumber}>{accountNumber || 'Fetching...'}</Text>
            {accountNumber && (
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.chip} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width * 0.85,
    height: 200,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 8,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  personalCard: {
    backgroundColor: '#1e293b', // Deep Slate
  },
  businessCard: {
    backgroundColor: '#4338ca', // Indigo 700
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  currencySymbol: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 4,
  },
  balanceText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  bankLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  accountNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  copyBtn: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 4,
    borderRadius: 6,
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: '#fbbf24', // Amber 400
    borderRadius: 6,
    opacity: 0.8,
  },
});
