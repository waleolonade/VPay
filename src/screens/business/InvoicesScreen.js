import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/colors';
import { invoiceService } from '../../services/invoiceService';
import LoadingIndicator from '../../components/LoadingIndicator';

const { width } = Dimensions.get('window');

export default function InvoicesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('present'); // 'present' or 'previous'
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [invRes, statRes] = await Promise.all([
        invoiceService.getInvoices(activeTab),
        invoiceService.getStats(),
      ]);
      if (invRes.success) setInvoices(invRes.data);
      if (statRes.success) setStats(statRes.data);
    } catch (e) {
      console.error('Invoices load error:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const formatMoney = (n) => `₦${(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderStatus = (status) => {
    switch(status) {
      case 'paid': return { color: '#00C48C', bg: '#E6FDF7', icon: 'checkmark-circle' };
      case 'pending': return { color: '#FF9800', bg: '#FFF3E0', icon: 'time' };
      case 'cancelled': return { color: '#F23D4F', bg: '#FDE8E8', icon: 'close-circle' };
      case 'overdue': return { color: '#E53935', bg: '#FFEBEE', icon: 'warning' };
      default: return { color: colors.textLight, bg: '#F0F4FF', icon: 'help-circle' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Requests</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Tracking & Analysis Header */}
        <Text style={styles.sectionTitle}>Tracking & Analysis</Text>
        <LinearGradient colors={['#1a237e', '#3949ab']} style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Requested</Text>
              <Text style={styles.statVal}>{formatMoney(stats?.totalRequested || 0)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Received</Text>
              <Text style={styles.statVal}>{formatMoney(stats?.paidVolume || 0)}</Text>
            </View>
          </View>
          <View style={styles.statBottom}>
            <View style={styles.statMini}>
              <Ionicons name="time" size={14} color="#FFD54F" />
              <Text style={styles.statMiniText}>Pending: {formatMoney(stats?.pendingVolume || 0)} ({stats?.pendingCount || 0})</Text>
            </View>
            <View style={styles.statMini}>
              <Ionicons name="checkmark-circle" size={14} color="#81C784" />
              <Text style={styles.statMiniText}>Paid: {stats?.paidCount || 0}</Text>
            </View>
          </View>
        </LinearGradient>

        <TouchableOpacity 
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateInvoice')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Send New Request</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabsWrap}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'present' && styles.tabActive]}
            onPress={() => { setLoading(true); setActiveTab('present'); }}
          >
            <Text style={[styles.tabText, activeTab === 'present' && styles.tabTextActive]}>Present (Pending)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'previous' && styles.tabActive]}
            onPress={() => { setLoading(true); setActiveTab('previous'); }}
          >
            <Text style={[styles.tabText, activeTab === 'previous' && styles.tabTextActive]}>Previous (History)</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.center}><LoadingIndicator text="Loading requests..." /></View>
        ) : invoices.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptySub}>You don't have any {activeTab} requests right now.</Text>
          </View>
        ) : (
          invoices.map(inv => {
            const config = renderStatus(inv.status);
            return (
              <View key={inv.id} style={styles.invCard}>
                <View style={styles.invHeader}>
                  <Text style={styles.invCustomer}>{inv.customer_name}</Text>
                  <Text style={styles.invAmount}>{formatMoney(inv.amount)}</Text>
                </View>
                {inv.description && <Text style={styles.invDesc}>{inv.description}</Text>}
                
                <View style={styles.invFooter}>
                  <Text style={styles.invDate}>Due: {new Date(inv.due_date).toLocaleDateString()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon} size={14} color={config.color} />
                    <Text style={[styles.statusText, { color: config.color }]}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                {inv.status === 'pending' && (
                  <View style={styles.linkWrap}>
                    <Text style={styles.linkUrl} numberOfLines={1} ellipsizeMode="tail">
                      vpay.app/pay/{inv.slug}
                    </Text>
                    <TouchableOpacity style={styles.copyBtn} onPress={() => {/* Copy to clipboard */}}>
                      <Ionicons name="copy-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff',
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'center' },
  scroll: { padding: 16 },
  
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  statsCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statBox: { flex: 1 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  statBottom: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 },
  statMini: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statMiniText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },

  createBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#00C48C', paddingVertical: 16, borderRadius: 16, marginBottom: 24,
    shadowColor: '#00C48C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', marginLeft: 8 },

  tabsWrap: { flexDirection: 'row', backgroundColor: '#E4E9F2', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textLight },
  tabTextActive: { color: colors.text, fontWeight: '800' },

  center: { marginTop: 40, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EDF1F7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingHorizontal: 40 },

  invCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EDF1F7' },
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  invCustomer: { fontSize: 15, fontWeight: '800', color: colors.text },
  invAmount: { fontSize: 16, fontWeight: '900', color: colors.primary },
  invDesc: { fontSize: 13, color: colors.textLight, marginBottom: 12 },
  invFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invDate: { fontSize: 11, color: colors.textMed, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  
  linkWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, backgroundColor: '#F8F9FD', padding: 10, borderRadius: 10 },
  linkUrl: { flex: 1, fontSize: 12, color: colors.textMed, fontWeight: '500' },
  copyBtn: { padding: 4 },
});
