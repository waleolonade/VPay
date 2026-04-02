import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { useAuth } from '../../context/AuthContext';
import { walletService } from '../../services/walletService';
import BalanceCard from '../../components/home/BalanceCard';
import HeaderBar from '../../components/home/HeaderBar';
import LoadingIndicator from '../../components/LoadingIndicator';

const { width } = Dimensions.get('window');

export default function BusinessDashboardScreen({ navigation }) {
  const { user, accountMode, syncUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Watch for mode switch — go back to Main when toggling to personal
  useEffect(() => {
    if (accountMode === 'personal') {
      navigation.goBack();
    }
  }, [accountMode, navigation]);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      await syncUser();
      // Additional business-specific data fetching could go here
    } catch (error) {
      console.error('Business Dashboard load error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [syncUser]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const businessActions = [
    { id: 'payout', title: 'Payout', icon: 'send-outline', color: '#3F51B5' },
    { id: 'bills', title: 'Business Suite', icon: 'receipt-outline', color: '#4CAF50', screen: 'Bills' },
    { id: 'insights', title: 'Insights', icon: 'bar-chart-outline', color: '#FF9800', screen: 'BusinessInsights' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar 
        userName={user?.businessName || user?.firstName} 
        onNotificationPress={() => navigation.navigate('Notifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} colors={['#1a237e']} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Business Console</Text>
          <Text style={styles.businessSubtitle}>Manage your commercial operations</Text>

          <BalanceCard onAddMoney={() => navigation.navigate('Wallet')} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Toolkit</Text>
          </View>

          <View style={styles.grid}>
            {businessActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.gridItem}
                onPress={() => action.screen && navigation.navigate(action.screen)}
              >
                <View style={[styles.iconBg, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={28} color={action.color} />
                </View>
                <Text style={styles.gridLabel}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.qrBanner}
            onPress={() => navigation.navigate('BusinessQRScanner')}
          >
            <View>
              <Text style={styles.qrTitle}>Accept Payments</Text>
              <Text style={styles.qrSub}>Scan customer QR code to receive instantly</Text>
            </View>
            <View style={styles.qrCircle}>
                <Ionicons name="qr-code" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Today's Overview</Text>
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Sales</Text>
                    <Text style={styles.statValue}>₦0.00</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Orders</Text>
                    <Text style={styles.statValue}>0</Text>
                </View>
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  content: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a237e',
    marginTop: 8,
  },
  businessSubtitle: {
    fontSize: 14,
    color: '#5c6bc0',
    marginBottom: 20,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 48) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBg: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  qrBanner: {
    backgroundColor: '#1a237e',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  qrTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  qrSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    maxWidth: 200,
  },
  qrCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  statsCard: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 20,
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
  },
  statsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
  },
  statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  statBox: {
      flex: 1,
      alignItems: 'center',
  },
  statLabel: {
      fontSize: 12,
      color: colors.textLight,
      marginBottom: 4,
  },
  statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1a237e',
  },
  statDivider: {
      width: 1,
      height: 30,
      backgroundColor: '#f0f0f0',
  }
});
