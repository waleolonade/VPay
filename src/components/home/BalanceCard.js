import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { walletService } from '../../services/walletService';
import { useAuth } from '../../context/AuthContext';

const BalanceCard = ({ balance, accountNumber, accountName, onAddMoney, onRefresh }) => {
  const { user, accountMode } = useAuth();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const isBusiness = accountMode === 'business';

  const liveBalance = balance !== undefined ? balance : 0;
  const liveAccount = accountNumber || '...';
  const displayAccountName = accountName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User Account';

  console.log('💳 BalanceCard Props:');
  console.log('   balance:', balance);
  console.log('   accountNumber:', accountNumber);
  console.log('   accountName:', accountName);
  console.log('   accountMode:', accountMode);
  console.log('   liveBalance:', liveBalance);
  console.log('   liveAccount:', liveAccount);

  const handleRefresh = async () => {
    if (onRefresh) {
      setLoading(true);
      await onRefresh();
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(liveAccount);
    // You could add a toast here if available
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, isBusiness && styles.businessCard]}>
        <View style={styles.topSection}>
          <View style={styles.leftInfo}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{isBusiness ? 'Business Balance' : 'Personal Balance'}</Text>
              <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)} style={styles.eyeIcon}>
                <Ionicons name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </View>
            <Text 
              style={styles.balance} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              {isBalanceVisible ? `₦${Number(liveBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₦ ****.**'}
            </Text>
            <Text style={styles.accountName} numberOfLines={1}>{displayAccountName}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.addMoneyBtn, isBusiness && styles.businessAddBtn]} 
            onPress={onAddMoney}
          >
            <Ionicons name={isBusiness ? "business-outline" : "add-circle"} size={20} color="white" />
            <Text style={styles.addMoneyText}>{isBusiness ? 'Receive' : 'Add Money'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomSection}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.accountLabel}>VFD Bank • {liveAccount}</Text>
            {loading ? (
                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.5)" style={{marginLeft: 8}} />
            ) : (
                <TouchableOpacity onPress={handleRefresh} style={{marginLeft: 8}}>
                  <Ionicons name="sync-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
            <Ionicons name="copy-outline" size={16} color="white" />
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  eyeIcon: {
    marginLeft: 8,
  },
  balance: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addMoneyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMoneyText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  businessCard: {
    backgroundColor: '#1a237e', // Dark indigo for business
    shadowColor: '#1a237e',
  },
  businessAddBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});

export default BalanceCard;
