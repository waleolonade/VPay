import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/colors';
import { savingsService } from '../../services/savingsService';
import LoadingIndicator from '../../components/LoadingIndicator';

const { width } = Dimensions.get('window');

const PRODUCTS = [
  {
    id: 'flex',     name: 'Flex Savings',    icon: 'wallet-outline',
    desc: 'Earn daily interest, withdraw anytime',
    roi: '10% p.a.', gradient: ['#00C48C', '#00A878'],
    tagline: 'Instant Access',
  },
  {
    id: 'safelock',  name: 'SafeLock',        icon: 'lock-closed-outline',
    desc: 'Lock money for 30–180 days, earn more',
    roi: '16–20% p.a.', gradient: ['#7C3AED', '#5B21B6'],
    tagline: 'Fixed Deposit',
  },
  {
    id: 'target',    name: 'Target Savings',  icon: 'ribbon-outline',
    desc: 'Save towards a goal with auto-save',
    roi: '12–15% p.a.', gradient: ['#2962FF', '#0039CB'],
    tagline: 'Goal-based',
  },
];

export default function SavingsScreen({ navigation }) {
  const [summary, setSummary] = useState({ totalBalance: 0, totalInterest: 0, activePlans: 0, totalPlans: 0 });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, plansRes] = await Promise.all([
        savingsService.getSummary().catch(() => ({ success: false })),
        savingsService.getSavings().catch(() => ({ success: false })),
      ]);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (plansRes.success) setPlans(plansRes.data || []);
    } catch (e) {
      console.error('Savings load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const formatMoney = (n) => `₦${(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Group plans by type (using autoSaveRule field)
  const activePlans = plans.filter(p => p.status === 'active');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}><LoadingIndicator text="Loading Savings..." /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Savings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateSavingsPlan')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Hero Balance Card ── */}
        <LinearGradient colors={['#0C1E3E', '#1A3A6A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Savings Balance</Text>
          <Text style={styles.heroAmount}>{formatMoney(summary.totalBalance)}</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroPill}>
              <Ionicons name="trending-up" size={14} color="#00C48C" />
              <Text style={styles.heroPillText}>+{formatMoney(summary.totalInterest)} interest</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="layers-outline" size={14} color="#A78BFA" />
              <Text style={styles.heroPillText}>{summary.activePlans} active plan{summary.activePlans !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Product Cards ── */}
        <Text style={styles.sectionTitle}>Savings Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
          {PRODUCTS.map(product => (
            <TouchableOpacity
              key={product.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CreateSavingsPlan', { planType: product.id })}
            >
              <LinearGradient colors={product.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.productCard}>
                <View style={styles.productIconWrap}>
                  <Ionicons name={product.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDesc}>{product.desc}</Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productRoi}>{product.roi}</Text>
                  <View style={styles.productTag}>
                    <Text style={styles.productTagText}>{product.tagline}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Active Plans ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Active Plans</Text>
          <Text style={styles.sectionCount}>{activePlans.length}</Text>
        </View>

        {activePlans.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="leaf-outline" size={48} color={colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No savings plans yet</Text>
            <Text style={styles.emptySub}>Start saving today and watch your money grow!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreateSavingsPlan')}>
              <Text style={styles.emptyBtnText}>Create Your First Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activePlans.map(plan => {
            const progress = plan.targetAmount > 0 ? Math.min(100, (plan.currentBalance / plan.targetAmount) * 100) : 0;
            const isTarget = plan.autoSaveRule !== 'flex' && plan.autoSaveRule !== 'safelock';
            const isSafeLock = plan.autoSaveRule === 'safelock';
            const planColor = isSafeLock ? '#7C3AED' : isTarget ? '#2962FF' : '#00C48C';
            const planIcon = isSafeLock ? 'lock-closed' : isTarget ? 'ribbon' : 'wallet';
            const planType = isSafeLock ? 'SafeLock' : isTarget ? 'Target' : 'Flex';

            return (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => navigation.navigate('SavingsDetail', { planId: plan.id })}
                activeOpacity={0.7}
              >
                <View style={styles.planTop}>
                  <View style={[styles.planIconWrap, { backgroundColor: `${planColor}15` }]}>
                    <Ionicons name={planIcon} size={22} color={planColor} />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.planName}</Text>
                    <Text style={styles.planType}>{planType} • {plan.interestRate * 100}% p.a.</Text>
                  </View>
                  <View style={[styles.planBadge, { backgroundColor: `${planColor}12` }]}>
                    <Text style={[styles.planBadgeText, { color: planColor }]}>Active</Text>
                  </View>
                </View>

                {/* Balance */}
                <View style={styles.planBalanceRow}>
                  <View>
                    <Text style={styles.planBalLabel}>Balance</Text>
                    <Text style={styles.planBalAmount}>{formatMoney(plan.currentBalance)}</Text>
                  </View>
                  {isTarget && plan.targetAmount > 0 && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.planBalLabel}>Target</Text>
                      <Text style={styles.planBalTarget}>{formatMoney(plan.targetAmount)}</Text>
                    </View>
                  )}
                  {isSafeLock && plan.maturityDate && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.planBalLabel}>Matures</Text>
                      <Text style={styles.planBalTarget}>{new Date(plan.maturityDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar (Target plans) */}
                {isTarget && plan.targetAmount > 0 && (
                  <View style={styles.progressWrap}>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: planColor }]} />
                    </View>
                    <Text style={[styles.progressText, { color: planColor }]}>{Math.round(progress)}%</Text>
                  </View>
                )}

                {/* Interest earned */}
                {plan.interestEarned > 0 && (
                  <View style={styles.interestRow}>
                    <Ionicons name="trending-up" size={14} color="#00C48C" />
                    <Text style={styles.interestText}>+{formatMoney(plan.interestEarned)} interest earned</Text>
                  </View>
                )}

                {/* Auto-save indicator */}
                {plan.isAutoSave && (
                  <View style={styles.autoSaveRow}>
                    <Ionicons name="repeat" size={14} color={colors.primary} />
                    <Text style={styles.autoSaveText}>{formatMoney(plan.autoSaveAmount)} / {plan.frequency}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Floating Action ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSavingsPlan')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.fabGrad}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F4FF',
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  // ── Hero ──
  heroCard: {
    borderRadius: 24, padding: 24, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 6 },
  heroAmount: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 16, letterSpacing: -0.5 },
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  heroPillText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // ── Products ──
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 },
  sectionCount: {
    fontSize: 12, fontWeight: '800', color: colors.primary,
    backgroundColor: `${colors.primary}12`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  productRow: { gap: 14, paddingRight: 20, marginBottom: 28 },
  productCard: {
    width: width * 0.55, borderRadius: 20, padding: 20, minHeight: 170,
    justifyContent: 'space-between',
  },
  productIconWrap: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  productName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  productDesc: { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 16, marginBottom: 14 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productRoi: { fontSize: 13, fontWeight: '900', color: '#fff' },
  productTag: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  productTagText: { fontSize: 9, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },

  // ── Plan Cards ──
  planCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  planIconWrap: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  planInfo: { flex: 1 },
  planName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  planType: { fontSize: 11, color: colors.textLight, fontWeight: '600' },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  planBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  planBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  planBalLabel: { fontSize: 10, color: colors.textLight, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  planBalAmount: { fontSize: 18, fontWeight: '900', color: colors.text },
  planBalTarget: { fontSize: 13, fontWeight: '700', color: colors.textMed },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressBg: { flex: 1, height: 6, backgroundColor: '#F0F4FF', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '800' },

  interestRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  interestText: { fontSize: 11, color: '#00C48C', fontWeight: '700' },

  autoSaveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, backgroundColor: `${colors.primary}08`,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start',
  },
  autoSaveText: { fontSize: 11, color: colors.primary, fontWeight: '700' },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F4FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textLight, textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // ── FAB ──
  fab: {
    position: 'absolute', right: 20, bottom: 36,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  fabGrad: {
    width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center',
  },
});
