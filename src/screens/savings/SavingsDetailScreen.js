import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Alert, TextInput, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/colors';
import { savingsService } from '../../services/savingsService';
import LoadingIndicator from '../../components/LoadingIndicator';

const { width } = Dimensions.get('window');

const TYPE_META = {
  flex:     { color: '#00C48C', gradient: ['#00C48C', '#00A878'], icon: 'wallet',      label: 'Flex Savings' },
  safelock: { color: '#7C3AED', gradient: ['#7C3AED', '#5B21B6'], icon: 'lock-closed', label: 'SafeLock' },
  target:   { color: '#2962FF', gradient: ['#2962FF', '#0039CB'], icon: 'ribbon',      label: 'Target Savings' },
};

export default function SavingsDetailScreen({ navigation, route }) {
  const { planId } = route.params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fund/Withdraw modal
  const [modalType, setModalType] = useState(null); // 'fund' | 'withdraw'
  const [modalAmount, setModalAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPlan = useCallback(async () => {
    try {
      const res = await savingsService.getPlanDetail(planId);
      if (res.success) setPlan(res.data);
    } catch (e) {
      console.error('Plan detail error:', e);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useFocusEffect(useCallback(() => { loadPlan(); }, [loadPlan]));
  const onRefresh = async () => { setRefreshing(true); await loadPlan(); setRefreshing(false); };

  const formatMoney = (n) => `₦${(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getType = () => {
    if (!plan) return 'flex';
    if (plan.autoSaveRule === 'safelock') return 'safelock';
    if (plan.autoSaveRule === 'flex') return 'flex';
    return 'target';
  };

  const handleFund = async () => {
    const amt = parseFloat(modalAmount);
    if (isNaN(amt) || amt < 100) return Alert.alert('Error', 'Minimum amount is ₦100');

    try {
      setProcessing(true);
      const res = await savingsService.fundPlan(planId, amt);
      if (res.success) {
        Alert.alert('Success', `${formatMoney(amt)} added to your plan!`);
        setModalType(null);
        setModalAmount('');
        loadPlan();
      } else {
        Alert.alert('Error', res.message || 'Failed to fund');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const type = getType();
    if (type === 'safelock') {
      const maturity = plan.maturityDate ? new Date(plan.maturityDate) : null;
      if (maturity && maturity > new Date()) {
        return Alert.alert(
          '🔒 SafeLock Active',
          `This plan is locked until ${maturity.toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })}. You cannot withdraw early.`,
          [{ text: 'OK' }]
        );
      }
    }

    Alert.alert(
      'Withdraw Savings',
      `Are you sure you want to withdraw ${formatMoney(plan.currentBalance)} + earned interest to your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const res = await savingsService.withdrawSavings(planId, plan.currentBalance);
              if (res.success) {
                Alert.alert('💰 Withdrawn!', `${formatMoney(res.data?.total || plan.currentBalance)} has been added to your wallet.`);
                loadPlan();
              } else {
                Alert.alert('Error', res.message || 'Withdrawal failed');
              }
            } catch (e) {
              Alert.alert('Error', e.message || 'Something went wrong');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}><LoadingIndicator text="Loading plan..." /></View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={{ color: colors.textLight }}>Plan not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const type = getType();
  const meta = TYPE_META[type];
  const progress = plan.targetAmount > 0 ? Math.min(100, (plan.currentBalance / plan.targetAmount) * 100) : 0;
  const daysLeft = plan.maturityDate ? Math.max(0, Math.ceil((new Date(plan.maturityDate) - new Date()) / 86400000)) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{plan.planName}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={meta.color} />}
      >
        {/* ── Balance Hero ── */}
        <LinearGradient colors={meta.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Ionicons name={meta.icon} size={22} color="#fff" />
            </View>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.heroBadgeText}>{meta.label}</Text>
            </View>
          </View>
          <Text style={styles.heroLabel}>Current Balance</Text>
          <Text style={styles.heroAmount}>{formatMoney(plan.currentBalance)}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Interest Earned</Text>
              <Text style={styles.heroStatVal}>+{formatMoney(plan.interestEarned)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Rate</Text>
              <Text style={styles.heroStatVal}>{((plan.interestRate || 0) * 100).toFixed(0)}% p.a.</Text>
            </View>
            {daysLeft !== null && (
              <>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>{daysLeft > 0 ? 'Days Left' : 'Matured'}</Text>
                  <Text style={styles.heroStatVal}>{daysLeft > 0 ? daysLeft : '✓'}</Text>
                </View>
              </>
            )}
          </View>
        </LinearGradient>

        {/* ── Progress (Target) ── */}
        {type === 'target' && plan.targetAmount > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Goal Progress</Text>
              <Text style={[styles.progressPct, { color: meta.color }]}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: meta.color }]} />
            </View>
            <View style={styles.progressFooter}>
              <Text style={styles.progressSaved}>Saved: {formatMoney(plan.currentBalance)}</Text>
              <Text style={styles.progressTarget}>Target: {formatMoney(plan.targetAmount)}</Text>
            </View>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => { setModalType('fund'); setModalAmount(''); }}>
            <View style={[styles.actionIcon, { backgroundColor: '#E6FDF7' }]}>
              <Ionicons name="add-circle" size={24} color="#00C48C" />
            </View>
            <Text style={styles.actionLabel}>Fund</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleWithdraw}>
            <View style={[styles.actionIcon, { backgroundColor: type === 'safelock' ? '#FDE8E8' : '#EBF2FF' }]}>
              <Ionicons
                name={type === 'safelock' ? 'lock-closed' : 'arrow-down-circle'}
                size={24}
                color={type === 'safelock' ? '#F23D4F' : colors.primary}
              />
            </View>
            <Text style={styles.actionLabel}>{type === 'safelock' ? 'Locked' : 'Withdraw'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Coming Soon', 'Settings will be available soon')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F5F0FF' }]}>
              <Ionicons name="settings-outline" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* ── Plan Details ── */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Plan Details</Text>
          <DetailRow label="Plan Name" value={plan.planName} />
          <DetailRow label="Type" value={meta.label} />
          <DetailRow label="Interest Rate" value={`${((plan.interestRate || 0) * 100).toFixed(0)}% per annum`} />
          <DetailRow label="Status" value={plan.status} highlight />
          {plan.frequency && <DetailRow label="Frequency" value={plan.frequency} />}
          {plan.isAutoSave && <DetailRow label="Auto-Save" value={`${formatMoney(plan.autoSaveAmount)} / ${plan.frequency}`} />}
          {plan.maturityDate && (
            <DetailRow
              label="Maturity Date"
              value={new Date(plan.maturityDate).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })}
            />
          )}
          <DetailRow label="Created" value={new Date(plan.startDate || plan.createdAt).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Fund Modal ── */}
      <Modal visible={modalType === 'fund'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Fund Savings</Text>
            <Text style={styles.modalSub}>Add money to {plan.planName}</Text>

            <View style={styles.modalAmountWrap}>
              <Text style={styles.modalAmountPrefix}>₦</Text>
              <TextInput
                style={styles.modalAmountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={modalAmount}
                onChangeText={setModalAmount}
                autoFocus
              />
            </View>

            <View style={styles.modalQuickRow}>
              {[1000, 5000, 10000, 50000].map(q => (
                <TouchableOpacity key={q} style={styles.modalQuickChip} onPress={() => setModalAmount(q.toString())}>
                  <Text style={styles.modalQuickText}>₦{q.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, processing && { opacity: 0.6 }]}
              onPress={handleFund}
              disabled={processing}
            >
              <Text style={styles.modalBtnText}>{processing ? 'Processing...' : 'Fund Now'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancel} onPress={() => setModalType(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: '#00C48C', fontWeight: '800', textTransform: 'capitalize' }]}>{value}</Text>
    </View>
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'center' },
  scroll: { padding: 20 },

  // ── Hero ──
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 },
  heroAmount: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 20 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 3 },
  heroStatVal: { fontSize: 14, color: '#fff', fontWeight: '800' },
  heroStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  // ── Progress ──
  progressCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  progressPct: { fontSize: 14, fontWeight: '900' },
  progressBg: { height: 8, backgroundColor: '#F0F4FF', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressSaved: { fontSize: 12, color: colors.textLight, fontWeight: '600' },
  progressTarget: { fontSize: 12, color: colors.textMed, fontWeight: '700' },

  // ── Actions ──
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: colors.text },

  // ── Details ──
  detailCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  detailTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 16 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4FF',
  },
  detailLabel: { fontSize: 13, color: colors.textLight, fontWeight: '600' },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: '700' },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#D6DCE8', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textLight, marginBottom: 24 },
  modalAmountWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F9FC', borderRadius: 16, paddingHorizontal: 20,
    borderWidth: 1, borderColor: '#F0F4FF',
  },
  modalAmountPrefix: { fontSize: 24, fontWeight: '900', color: colors.text, marginRight: 8 },
  modalAmountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.text, paddingVertical: 18 },
  modalQuickRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 24 },
  modalQuickChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: `${colors.primary}08`, alignItems: 'center',
  },
  modalQuickText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  modalBtn: {
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 12,
  },
  modalBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  modalCancel: { alignItems: 'center', paddingVertical: 12 },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.textLight },
});
