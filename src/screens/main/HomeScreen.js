import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import { dashboardService } from '../../services/dashboardService';
import billsService from '../../services/billsPaymentService';
import { walletService } from '../../services/walletService';
// Import UI Components
import HeaderBar from '../../components/home/HeaderBar';
import BalanceCard from '../../components/home/BalanceCard';
import ServiceGrid from '../../components/home/ServiceGrid';
import PromotionsSlider from '../../components/home/PromotionsSlider';
import TransactionPreview from '../../components/home/TransactionPreview';
import AISmartSuggestions from '../../components/home/AISmartSuggestions';
import FloatingQRButton from '../../components/home/super/FloatingQRButton';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors } from '../../styles/colors';

export default function HomeScreen({ navigation }) {
  const { user, accessToken, accountMode, syncUser } = useAuth();
  const { unreadCount, fetchNotifications } = useNotifications(accessToken);
  const [dashboardData, setDashboardData] = useState({
    balance: 0,
    accountNumber: '...',
    recentTransactions: [],
    suggestions: [],
    user: null,
    businessActive: false
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [discoverItems, setDiscoverItems] = useState([]);

  const isBusiness = accountMode === 'business';

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      await syncUser();
      const [dashRes, categories, walletDetails] = await Promise.all([
        dashboardService.getDashboard().catch(() => ({ success: false, data: {} })),
        billsService.getCategories().catch(() => []),
        walletService.getWalletDetails().catch((e) => ({ silent: !!e?.silent, data: { success: false } }))
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboardData(prev => ({ 
          ...prev, 
          ...dashRes.data,
          businessActive: !!(walletDetails.data?.data?.accounts?.find(a => a.type === 'business')?.accountName)
        }));
      }

      // Sync specific wallet data based on mode
      if (walletDetails.success || walletDetails.data?.success) {
        console.log('💰 Wallet Details Response:', JSON.stringify(walletDetails.data, null, 2));
        const accountsArray = walletDetails.data.data?.accounts || [];
        console.log('📊 Accounts Array:', accountsArray);
        console.log('🔍 Account Mode:', accountMode);
        const activeWallet = accountsArray.find(a => a.type === accountMode) || accountsArray[0];
        console.log('✅ Active Wallet:', activeWallet);
        if (activeWallet) {
          console.log('💵 Setting Balance:', activeWallet.balance);
          console.log('🔢 Setting Account Number:', activeWallet.accountNumber);
          setDashboardData(prev => ({
            ...prev,
            balance: activeWallet.balance,
            accountNumber: activeWallet.accountNumber
          }));
        } else {
          console.log('⚠️ No active wallet found!');
        }

        // Redirect to Business Dashboard if active
        if (accountMode === 'business' && !!activeWallet?.accountName) {
            navigation.navigate('BusinessDashboard');
            return;
        }
      } else {
        if (!walletDetails.silent) {
          console.log('❌ Wallet details request failed:', walletDetails);
        }
      }

      // Map dynamic VFD Biller Categories
      const categoryMap = isBusiness ? {
        'Airtime': { icon: 'briefcase-outline', gradient: ['#4A148C', '#7B1FA2'], action: 'payroll', subtitle: 'Manage Staff' },
        'Data': { icon: 'document-text-outline', gradient: ['#0D47A1', '#1976D2'], action: 'invoices', subtitle: 'Send Invoices' },
        'Bills': { icon: 'megaphone-outline', gradient: ['#E65100', '#F57C00'], action: 'marketing', subtitle: 'Bulk SMS' },
      } : {
        'Airtime': { icon: 'phone-portrait-outline', gradient: ['#FF9800', '#F57C00'], action: 'airtime', subtitle: 'Recharge instantly' },
        'Cable TV': { icon: 'tv-outline', gradient: ['#E91E63', '#C2185B'], action: 'bills', subtitle: 'Pay cable subscriptions' },
        'Data': { icon: 'wifi-outline', gradient: ['#00BCD4', '#0097A7'], action: 'data', subtitle: 'Buy data bundles' },
      };

      const dynamicItems = (categories || []).map((cat, index) => {
        const mapped = categoryMap[cat.category] || { icon: 'grid-outline', gradient: ['#9E9E9E', '#757575'], action: 'bills', subtitle: 'Pay bills' };
        return {
          id: `dyn-${index}`,
          title: cat.category,
          subtitle: mapped.subtitle,
          action: mapped.action,
          gradient: mapped.gradient,
          icon: mapped.icon
        };
      });

      // Premium static discoveries
      const staticItems = [
        { 
          id: 'static-savings', title: 'Smart Savings', subtitle: 'Earn up to 15% interest p.a.',
          action: 'savings', gradient: ['#2196F3', '#1565C0'], icon: 'wallet-outline'
        },
        { 
          id: 'static-loan', title: 'Quick Loans', subtitle: 'Get instant loans up to ₦500k',
          action: 'loan', gradient: ['#9C27B0', '#6A1B9A'], icon: 'cash-outline'
        }
      ];

      setDiscoverItems([...dynamicItems, ...staticItems]);
    } catch (error) {
      if (!error.silent) {
        console.error('Error loading dashboard:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      fetchNotifications();
    }, [loadDashboard, fetchNotifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'send':
        navigation.navigate('SendMoney');
        break;
      case 'airtime':
        navigation.navigate('Airtime');
        break;
      case 'data':
        navigation.navigate('Data');
        break;
      case 'bills':
        navigation.navigate('Bills');
        break;
      case 'loans':
        navigation.navigate('Loans');
        break;
      case 'savings':
        navigation.navigate('Savings');
        break;
      case 'invest':
        navigation.navigate('Invest');
        break;
      default:
        navigation.navigate('MoreServices');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderBar
        user={dashboardData.user || user}
        unreadCount={dashboardData.unreadCount || unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <LoadingIndicator text="Syncing your account..." />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Account Card / Setup Prompt */}
            {isBusiness && !dashboardData.businessActive ? (
              <TouchableOpacity 
                style={styles.setupCard} 
                onPress={() => navigation.navigate('BusinessRequest')}
              >
                <View style={styles.setupIcon}>
                  <Ionicons name="business" size={32} color={colors.primary} />
                </View>
                <View style={styles.setupTextContainer}>
                  <Text style={styles.setupTitle}>Complete Business Setup</Text>
                  <Text style={styles.setupSubtitle}>Activate your business account to start accepting payments.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <BalanceCard
                balance={dashboardData.balance}
                accountNumber={dashboardData.accountNumber}
                accountName={dashboardData.user?.firstName ? `${dashboardData.user.firstName} ${dashboardData.user.lastName}` : undefined}
                onAddMoney={() => navigation.navigate('Wallet')}
                onRefresh={loadDashboard}
              />
            )}

            {/* Quick Services Grid */}
            <ServiceGrid onActionPress={handleQuickAction} />
            
            {/* Finance Insights Carousel */}
            <AISmartSuggestions suggestions={dashboardData.suggestions} />

            {/* Promotions Banner */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Discover</Text>
              <PromotionsSlider 
                promotions={discoverItems.length > 0 ? discoverItems : undefined}
                onPromoPress={(promo) => {
                  if (promo.action === 'airtime') navigation.navigate('Airtime');
                  else if (promo.action === 'data') navigation.navigate('Data');
                  else if (promo.action === 'bills') navigation.navigate('Bills');
                  else if (promo.action === 'savings') navigation.navigate('Savings');
                  else if (promo.action === 'loan') navigation.navigate('Loans');
                  else if (promo.action === 'investment') navigation.navigate('Investments');
                  else if (promo.action === 'referral') navigation.navigate('Referral');
                  else if (promo.action === 'cashback') navigation.navigate('Rewards');
                }}
              />
            </View>

            {/* Recent Activity */}
            <View style={[styles.section, { marginBottom: 100 }]}>
              <TransactionPreview
                transactions={dashboardData.recentTransactions}
                onViewAll={() => navigation.navigate('Wallet')}
                onTransactionPress={(item) => navigation.navigate('TransactionDetail', { transactionId: item.id })}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <FloatingQRButton onScanPress={() => navigation.navigate(isBusiness ? 'BusinessQRScanner' : 'QRScanner')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}08`,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
    borderStyle: 'dashed',
  },
  setupIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  setupTextContainer: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  setupSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 20,
    marginBottom: 12,
  },
});

