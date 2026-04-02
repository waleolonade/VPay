import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { walletService } from '../../services/walletService';
import { transactionService } from '../../services/transactionService';
import { savingsService } from '../../services/savingsService';

// Import UI Components
import WalletBalance from '../../components/wallet/WalletBalance';
import ActionButtons from '../../components/wallet/ActionButtons';
import TransactionHistory from '../../components/wallet/TransactionHistory';
import LinkedAccounts from '../../components/wallet/LinkedAccounts';
import SpendingAnalytics from '../../components/wallet/SpendingAnalytics';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors } from '../../styles/colors';

import * as Animatable from 'react-native-animatable';

export default function WalletScreen({ navigation }) {
  const [walletDetails, setWalletDetails] = useState({
    availableBalance: 0,
    ledgerBalance: 0,
    bonusBalance: 0,
    accounts: [],
  });
  const [savingsSummary, setSavingsSummary] = useState({
    totalBalance: 0,
    activePlans: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const [detailsRes, transactionsRes, savingsRes] = await Promise.all([
        walletService.getWalletDetails(),
        transactionService.getTransactions(),
        savingsService.getSummary().catch(() => ({ success: false, data: { totalBalance: 0 } }))
      ]);

      if (detailsRes.success) {
        setWalletDetails(detailsRes.data);
      }
      if (transactionsRes.success) {
        setTransactions(transactionsRes.data);
      }
      if (savingsRes.success) {
        setSavingsSummary(savingsRes.data);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWalletData();
    }, [loadWalletData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  }, [loadWalletData]);

  const handleAction = (actionId) => {
    switch (actionId) {
      case 'add_money':
        navigation.navigate('VirtualAccountFund');
        break;
      case 'withdraw':
        navigation.navigate('SendMoney');
        break;
      case 'transfer':
        navigation.navigate('SendMoney');
        break;
      case 'request_money':
        navigation.navigate('RequestMoney');
        break;
      case 'statement':
        navigation.navigate('Statement');
        break;
    }
  };

  if (loading && !refreshing) {
    return <LoadingIndicator text="Syncing Wallet..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TransactionHistory
        transactions={transactions}
        onRefresh={onRefresh}
        refreshing={refreshing}
        navigation={navigation}
        ListHeaderComponent={
          <Animatable.View animation="fadeInUp" duration={800} useNativeDriver>
            {/* Wallet Balance Section */}
            <WalletBalance
              availableBalance={walletDetails.availableBalance}
              ledgerBalance={walletDetails.ledgerBalance}
              bonusBalance={walletDetails.bonusBalance}
              savingsBalance={savingsSummary.totalBalance}
            />

            {/* Action Buttons */}
            <Animatable.View animation="fadeInUp" duration={800} delay={200} useNativeDriver>
              <ActionButtons onActionPress={handleAction} />
            </Animatable.View>
            
            {/* Spending Analytics (AI Feature) */}
            <Animatable.View animation="fadeInUp" duration={800} delay={400} useNativeDriver>
              <SpendingAnalytics transactions={transactions} />
            </Animatable.View>

            {/* Linked Accounts */}
            <Animatable.View animation="fadeInUp" duration={800} delay={600} useNativeDriver>
              <LinkedAccounts accounts={walletDetails.accounts} />
            </Animatable.View>
            
            {/* Transaction History Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Recent Activity</Text>
            </View>
          </Animatable.View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
});
