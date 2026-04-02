import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../styles/colors';
import { savingsService } from '../../services/savingsService';

const { width } = Dimensions.get('window');

const PRODUCTS = {
  flex: {
    name: 'Flex Savings', icon: 'wallet-outline', gradient: ['#00C48C', '#00A878'],
    roi: 10, desc: 'Earn daily interest on your balance. Withdraw anytime, no penalties.',
    features: ['Daily interest accrual', 'Instant withdrawal', 'No minimum lock period', 'Fund anytime'],
  },
  safelock: {
    name: 'SafeLock', icon: 'lock-closed-outline', gradient: ['#7C3AED', '#5B21B6'],
    roi: 16, desc: 'Lock your money for 30–180 days. The longer you lock, the more you earn.',
    features: ['Up to 20% p.a.', 'No early withdrawal', 'Auto-renew option', 'Secure & guaranteed'],
    lockOptions: [
      { days: 30,  rate: 16, label: '30 Days' },
      { days: 60,  rate: 17, label: '60 Days' },
      { days: 90,  rate: 18, label: '90 Days' },
      { days: 180, rate: 20, label: '180 Days' },
    ],
  },
  target: {
    name: 'Target Savings', icon: 'ribbon-outline', gradient: ['#2962FF', '#0039CB'],
    roi: 15, desc: 'Set a savings goal and achieve it with optional auto-deductions from your wallet.',
    features: ['Goal tracking', 'Auto-save (Daily/Weekly/Monthly)', 'Withdraw at maturity', 'Up to 15% p.a.'],
  },
};

const FREQUENCIES = [
  { id: 'Daily',   icon: 'sunny-outline',   label: 'Daily' },
  { id: 'Weekly',  icon: 'calendar-outline', label: 'Weekly' },
  { id: 'Monthly', icon: 'calendar',         label: 'Monthly' },
];

export default function CreateSavingsPlanScreen({ navigation, route }) {
  const preselected = route.params?.planType || null;

  const [step, setStep]                 = useState(preselected ? 2 : 1);
  const [selectedType, setSelectedType] = useState(preselected || 'flex');
  const [planName, setPlanName]         = useState('');
  const [amount, setAmount]             = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [frequency, setFrequency]       = useState('Monthly');
  const [autoSave, setAutoSave]         = useState(false);
  const [autoSaveAmount, setAutoSaveAmount] = useState('');
  const [lockDays, setLockDays]         = useState(30);
  const [submitting, setSubmitting]     = useState(false);

  const product = PRODUCTS[selectedType];
  const lockOption = product?.lockOptions?.find(o => o.days === lockDays);

  // Calculate projected interest
  const projectedInterest = useMemo(() => {
    const principal = parseFloat(amount || targetAmount || '0');
    if (!principal) return 0;

    if (selectedType === 'safelock') {
      const rate = (lockOption?.rate || 16) / 100;
      return (principal * rate * lockDays) / 365;
    }
    if (selectedType === 'flex') {
      return (principal * 0.10) / 365 * 30; // 30-day projection
    }
    return (principal * 0.15) / 365 * 90; // 90-day projection for target
  }, [amount, targetAmount, selectedType, lockDays, lockOption]);

  const formatMoney = (n) => `₦${(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSelectType = (typeId) => {
    setSelectedType(typeId);
    setStep(2);
  };

  const handleCreate = async () => {
    if (selectedType !== 'flex' && !planName.trim()) return Alert.alert('Error', 'Please enter a plan name');
    
    const principal = parseFloat(selectedType === 'target' ? targetAmount : amount);
    if (isNaN(principal) || principal < 100) return Alert.alert('Error', 'Minimum amount is ₦100');

    try {
      setSubmitting(true);

      const maturityDate = selectedType === 'safelock'
        ? new Date(Date.now() + lockDays * 86400000).toISOString()
        : selectedType === 'target' ? new Date(Date.now() + 90 * 86400000).toISOString() : null;

      const payload = {
        planName: planName.trim() || (selectedType === 'flex' ? 'Flex Savings' : product.name),
        targetAmount: selectedType === 'target' ? principal : principal,
        frequency: selectedType === 'flex' ? 'daily' : selectedType === 'safelock' ? 'one-time' : frequency.toLowerCase(),
        isAutoSave: autoSave,
        autoSaveAmount: autoSave ? parseFloat(autoSaveAmount || '0') : 0,
        autoSaveRule: selectedType,
        ruleValue: selectedType === 'safelock' ? lockDays : 0,
        maturityDate,
      };

      const res = await savingsService.createSavings(payload);

      if (res.success) {
        // If Flex or SafeLock, also fund immediately
        if (res.data?.id && parseFloat(amount) > 0 && selectedType !== 'target') {
          try {
            await savingsService.fundPlan(res.data.id, parseFloat(amount));
          } catch (fundErr) {
            console.warn('Initial fund failed:', fundErr.message);
          }
        }

        Alert.alert('🎉 Success!', `Your ${product.name} plan has been created!`, [
          { text: 'View Plan', onPress: () => { navigation.goBack(); } },
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to create plan');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────── Step 1: Pick Product ────────────
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Choose a Product</Text>
      <Text style={styles.stepSub}>Select the savings product that fits your needs</Text>

      {Object.entries(PRODUCTS).map(([key, prod]) => (
        <TouchableOpacity
          key={key}
          style={[styles.typeCard, selectedType === key && { borderColor: prod.gradient[0], borderWidth: 2 }]}
          onPress={() => handleSelectType(key)}
          activeOpacity={0.7}
        >
          <LinearGradient colors={prod.gradient} style={styles.typeGrad}>
            <Ionicons name={prod.icon} size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.typeContent}>
            <Text style={styles.typeName}>{prod.name}</Text>
            <Text style={styles.typeDesc}>{prod.desc}</Text>
            <View style={styles.typeFeatures}>
              {prod.features.slice(0, 2).map((f, i) => (
                <View key={i} style={styles.featureChip}>
                  <Ionicons name="checkmark-circle" size={12} color={prod.gradient[0]} />
                  <Text style={[styles.featureText, { color: prod.gradient[0] }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.typeRoiBox}>
            <Text style={[styles.typeRoiNum, { color: prod.gradient[0] }]}>{prod.roi}%</Text>
            <Text style={styles.typeRoiLabel}>p.a.</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ──────────── Step 2: Plan Details ────────────
  const renderStep2 = () => (
    <View>
      {/* Selected product banner */}
      <LinearGradient colors={product.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
        <Ionicons name={product.icon} size={20} color="#fff" />
        <Text style={styles.bannerText}>{product.name}</Text>
        {!preselected && (
          <TouchableOpacity onPress={() => setStep(1)} style={styles.bannerChange}>
            <Text style={styles.bannerChangeText}>Change</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Plan Name (not for Flex) */}
      {selectedType !== 'flex' && (
        <>
          <Text style={styles.label}>Plan Name</Text>
          <TextInput
            style={styles.input}
            placeholder={selectedType === 'safelock' ? 'e.g. Emergency Fund Lock' : 'e.g. New Car, School Fees'}
            placeholderTextColor={colors.textLight}
            value={planName}
            onChangeText={setPlanName}
          />
        </>
      )}

      {/* ── SafeLock: Lock Period ── */}
      {selectedType === 'safelock' && (
        <>
          <Text style={styles.label}>Lock Period</Text>
          <View style={styles.lockRow}>
            {product.lockOptions.map(opt => (
              <TouchableOpacity
                key={opt.days}
                style={[styles.lockChip, lockDays === opt.days && styles.lockChipActive]}
                onPress={() => setLockDays(opt.days)}
              >
                <Text style={[styles.lockDays, lockDays === opt.days && styles.lockDaysActive]}>{opt.label}</Text>
                <Text style={[styles.lockRate, lockDays === opt.days && styles.lockRateActive]}>{opt.rate}% p.a.</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Amount */}
      <Text style={styles.label}>
        {selectedType === 'target' ? 'Target Amount (₦)' : selectedType === 'safelock' ? 'Amount to Lock (₦)' : 'Initial Deposit (₦)'}
      </Text>
      <View style={styles.amountWrap}>
        <Text style={styles.amountPrefix}>₦</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          value={selectedType === 'target' ? targetAmount : amount}
          onChangeText={selectedType === 'target' ? setTargetAmount : setAmount}
        />
      </View>

      {/* Quick amounts */}
      <View style={styles.quickRow}>
        {[5000, 10000, 50000, 100000].map(q => (
          <TouchableOpacity
            key={q}
            style={styles.quickChip}
            onPress={() => {
              const setter = selectedType === 'target' ? setTargetAmount : setAmount;
              setter(q.toString());
            }}
          >
            <Text style={styles.quickText}>₦{q.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Target: Auto-Save ── */}
      {selectedType === 'target' && (
        <>
          <Text style={[styles.label, { marginTop: 24 }]}>Save Frequency</Text>
          <View style={styles.freqRow}>
            {FREQUENCIES.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.freqCard, frequency === f.id && styles.freqCardActive]}
                onPress={() => setFrequency(f.id)}
              >
                <Ionicons name={f.icon} size={20} color={frequency === f.id ? '#fff' : colors.textLight} />
                <Text style={[styles.freqLabel, frequency === f.id && styles.freqLabelActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.toggleRow} onPress={() => setAutoSave(!autoSave)}>
            <View style={styles.toggleInfo}>
              <Ionicons name="repeat" size={20} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.toggleLabel}>Enable Auto-Save</Text>
                <Text style={styles.toggleSub}>Automatically deduct from wallet each {frequency.toLowerCase()}</Text>
              </View>
            </View>
            <View style={[styles.toggle, autoSave && styles.toggleOn]}>
              <View style={[styles.toggleKnob, autoSave && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>

          {autoSave && (
            <>
              <Text style={styles.label}>Auto-Save Amount (₦)</Text>
              <View style={styles.amountWrap}>
                <Text style={styles.amountPrefix}>₦</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                  value={autoSaveAmount}
                  onChangeText={setAutoSaveAmount}
                />
              </View>
            </>
          )}
        </>
      )}

      {/* ── Interest Projection ── */}
      {projectedInterest > 0 && (
        <View style={styles.projectionCard}>
          <View style={styles.projectionLeft}>
            <Ionicons name="trending-up" size={20} color="#00C48C" />
            <Text style={styles.projectionLabel}>
              {selectedType === 'safelock' ? `Interest in ${lockDays} days` : selectedType === 'flex' ? 'Est. interest in 30 days' : 'Est. interest in 90 days'}
            </Text>
          </View>
          <Text style={styles.projectionAmount}>{formatMoney(projectedInterest)}</Text>
        </View>
      )}

      {/* ── Feature List ── */}
      <View style={styles.featureList}>
        {product.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={product.gradient[0]} />
            <Text style={styles.featureRowText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* ── CTA ── */}
      <TouchableOpacity
        style={[styles.ctaBtn, submitting && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={submitting}
        activeOpacity={0.85}
      >
        <LinearGradient colors={product.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
          <Text style={styles.ctaBtnText}>{submitting ? 'Creating...' : `Create ${product.name}`}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 2 && !preselected ? setStep(1) : navigation.goBack())} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 1 ? 'New Savings' : `Create ${product.name}`}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {step === 1 ? renderStep1() : renderStep2()}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F4FF',
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D6DCE8' },
  stepDotActive: { backgroundColor: colors.primary },
  stepLine: { width: 70, height: 3, backgroundColor: '#D6DCE8', marginHorizontal: 8, borderRadius: 2 },
  stepLineActive: { backgroundColor: colors.primary },
  scroll: { padding: 20 },

  // ── Step 1 ──
  stepTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 4 },
  stepSub: { fontSize: 13, color: colors.textLight, marginBottom: 24 },

  typeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#F0F4FF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  typeGrad: {
    width: 50, height: 50, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  typeContent: { flex: 1 },
  typeName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 3 },
  typeDesc: { fontSize: 11, color: colors.textLight, lineHeight: 16, marginBottom: 6 },
  typeFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  featureText: { fontSize: 9, fontWeight: '700' },
  typeRoiBox: { alignItems: 'center', marginLeft: 8 },
  typeRoiNum: { fontSize: 22, fontWeight: '900' },
  typeRoiLabel: { fontSize: 9, color: colors.textLight, fontWeight: '700' },

  // ── Step 2 ──
  banner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, marginBottom: 24, gap: 10,
  },
  bannerText: { fontSize: 14, fontWeight: '700', color: '#fff', flex: 1 },
  bannerChange: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  bannerChangeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: '#F0F4FF',
  },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#F0F4FF',
    paddingHorizontal: 16,
  },
  amountPrefix: { fontSize: 20, fontWeight: '900', color: colors.text, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text, paddingVertical: 16 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickChip: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: `${colors.primary}08`, alignItems: 'center',
  },
  quickText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  // Lock period
  lockRow: { flexDirection: 'row', gap: 8 },
  lockChip: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0F4FF',
  },
  lockChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  lockDays: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 3 },
  lockDaysActive: { color: '#fff' },
  lockRate: { fontSize: 10, fontWeight: '700', color: colors.textLight },
  lockRateActive: { color: 'rgba(255,255,255,0.8)' },

  // Frequency
  freqRow: { flexDirection: 'row', gap: 10 },
  freqCard: {
    flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0F4FF',
  },
  freqCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  freqLabel: { fontSize: 12, fontWeight: '700', color: colors.textLight },
  freqLabelActive: { color: '#fff' },

  // Toggle
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: '#F0F4FF',
  },
  toggleInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  toggleSub: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: '#D6DCE8', justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },

  // Projection
  projectionCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E6FDF7', borderRadius: 14, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: '#B2F0E0',
  },
  projectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectionLabel: { fontSize: 12, fontWeight: '600', color: '#00A878' },
  projectionAmount: { fontSize: 16, fontWeight: '900', color: '#00C48C' },

  // Features
  featureList: { marginTop: 24, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureRowText: { fontSize: 13, color: colors.textMed, fontWeight: '600' },

  // CTA
  ctaBtn: { marginTop: 28, borderRadius: 16, overflow: 'hidden' },
  ctaGrad: { paddingVertical: 18, alignItems: 'center' },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
