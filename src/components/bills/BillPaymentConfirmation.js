import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/colors';
import LoadingIndicator from '../LoadingIndicator';
import { AuthContext } from '../../context/AuthContext';
import { biometricService } from '../../services/biometricService';

const CATEGORY_META = {
  airtime: { icon: 'phone-portrait', color: '#2962FF', bg: '#EBF0FF' },
  data: { icon: 'wifi', color: '#0284C7', bg: '#E9F4FB' },
  'cable tv': { icon: 'tv', color: '#7C3AED', bg: '#F2EDFF' },
  utility: { icon: 'flash', color: '#F59E0B', bg: '#FEF9EC' },
  internet: { icon: 'globe', color: '#00897B', bg: '#E6F7F5' },
  education: { icon: 'school', color: '#0052CC', bg: '#EBF2FF' },
  betting: { icon: 'football', color: '#E53935', bg: '#FFEBEA' },
};

const getCategoryMeta = (cat = '') => {
  const key = cat.toLowerCase();
  return CATEGORY_META[key] || { icon: 'receipt', color: colors.primary, bg: colors.primaryLight };
};

const formatDate = (date) => {
  const d = date || new Date();
  return d.toLocaleDateString('en-NG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (date) => {
  const d = date || new Date();
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
};

export default function BillPaymentConfirmation({
  paymentDetails = {},
  loading,
  onConfirm,
  onCancel,
}) {
  const { user } = useContext(AuthContext);
  const [pin, setPin] = React.useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled]     = useState(false);
  const [hasSavedPin, setHasSavedPin]               = useState(false);
  const [biometricType, setBiometricType]           = useState('fingerprint');

  // ── Check biometric availability once on mount ───────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [available, enabled, savedPin] = await Promise.all([
          biometricService.isAvailable(),
          biometricService.isEnabled(),
          biometricService.hasSavedTransactionPin(),
        ]);
        setBiometricAvailable(available);
        setBiometricEnabled(enabled);
        setHasSavedPin(savedPin);

        if (available) {
          const types = await biometricService.getSupportedTypes();
          const { AuthenticationType } = await import('expo-local-authentication');
          if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('face');
          }
        }
      } catch { /* best-effort */ }
    })();
  }, []);

  // ── Biometric authorisation for transaction ───────────────────────────
  const handleBiometricAuth = async () => {
    try {
      const result = await biometricService.authenticateForTransaction(
        (parseFloat(paymentDetails.amount) || 0) + (parseFloat(paymentDetails.convenienceFee) || 0),
      );
      if (!result.success) return;

      const storedPin = await biometricService.getTransactionPin();
      if (!storedPin) {
        Alert.alert(
          'PIN Not Saved',
          'Please enter your PIN manually this once to link it to your biometrics.',
        );
        return;
      }
      onConfirm(storedPin);
    } catch {
      Alert.alert('Error', 'Biometric authorisation failed. Please enter your PIN.');
    }
  };

  // ── Confirm with PIN, and offer to save PIN for biometric future use ──
  const handleConfirmWithPin = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('PIN Required', 'Please enter your 4-digit transaction PIN');
      return;
    }

    if (biometricAvailable && biometricEnabled && !hasSavedPin) {
      Alert.alert(
        'Save PIN for Biometrics?',
        'Would you like to use your fingerprint / Face ID for future payments instead of typing your PIN?',
        [
          { text: 'Not Now', style: 'cancel', onPress: () => onConfirm(pin) },
          {
            text: 'Save & Pay',
            onPress: async () => {
              try { await biometricService.saveTransactionPin(pin); setHasSavedPin(true); } catch { }
              onConfirm(pin);
            },
          },
        ],
      );
    } else {
      onConfirm(pin);
    }
  };

  const amount = parseFloat(paymentDetails.amount) || 0;
  const fee = parseFloat(paymentDetails.convenienceFee) || 0;
  const totalAmount = amount + fee;

  const now = new Date();
  const meta = getCategoryMeta(paymentDetails.billerCategory || '');

  const senderName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You'
    : 'You';
  const senderPhone = user?.phone || '—';

  // Detail row component
  const DetailRow = ({ icon, label, value, valueStyle, isLast }) => (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={16} color={colors.textLight} style={styles.detailIcon} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, valueStyle]} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel} disabled={loading}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Confirm Payment</Text>
          <Text style={styles.subtitle}>Review before you pay</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Amount Hero ── */}
        <View style={styles.amountHero}>
          <View style={[styles.billerIcon, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={28} color={meta.color} />
          </View>
          <Text style={styles.billerName}>{paymentDetails.billerName}</Text>
          <Text style={styles.itemName}>{paymentDetails.itemName}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₦</Text>
            <Text style={styles.amountValue}>{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
          </View>
          {fee > 0 && (
            <Text style={styles.feeNote}>Includes ₦{fee.toFixed(2)} convenience fee</Text>
          )}
        </View>

        {/* ── Transaction Metadata Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction Details</Text>

          <View style={styles.partySection}>
            {/* Sender */}
            <View style={styles.partyRow}>
              <View style={styles.partyAvatar}>
                <Text style={styles.partyAvatarText}>{senderName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>From (Sender)</Text>
                <Text style={styles.partyName}>{senderName}</Text>
                <Text style={styles.partyPhone}>{senderPhone}</Text>
              </View>
              <View style={[styles.partyBadge, { backgroundColor: '#EBF0FF' }]}>
                <Ionicons name="person" size={12} color={colors.primary} />
              </View>
            </View>

            {/* Arrow separator */}
            <View style={styles.arrowSeparator}>
              <View style={styles.arrowLine} />
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-down" size={14} color={colors.primary} />
              </View>
              <View style={styles.arrowLine} />
            </View>

            {/* Receiver */}
            <View style={styles.partyRow}>
              <View style={[styles.partyAvatar, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon} size={18} color={meta.color} />
              </View>
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>To (Recipient)</Text>
                <Text style={styles.partyName}>{paymentDetails.billerName}</Text>
                <Text style={styles.partyPhone}>{paymentDetails.itemName}</Text>
              </View>
              <View style={[styles.partyBadge, { backgroundColor: meta.bg }]}>
                <Ionicons name="business" size={12} color={meta.color} />
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          <DetailRow icon="person-circle-outline" label="Customer ID" value={paymentDetails.customerId} />
          <DetailRow icon="cash-outline" label="Amount" value={`₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`} />
          {fee > 0 && (
            <DetailRow icon="add-circle-outline" label="Convenience Fee" value={`₦${fee.toFixed(2)}`} />
          )}
          <DetailRow icon="pricetag-outline" label="Total" value={`₦${totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`} valueStyle={{ color: colors.primary, fontWeight: '800' }} />
          <DetailRow icon="calendar-outline" label="Date" value={formatDate(now)} />
          <DetailRow icon="time-outline" label="Time" value={formatTime(now)} isLast />
        </View>

        {/* ── PIN Authorization ── */}
        <View style={styles.pinCard}>
          <View style={styles.pinHeader}>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.pinTitle}>Authorize Payment</Text>
              <Text style={styles.pinSubtitle}>Enter your 4-digit transaction PIN</Text>
            </View>
          </View>

          {/* Biometric quick-auth button (shown when available + enabled + PIN saved) */}
          {biometricAvailable && biometricEnabled && hasSavedPin && (
            <TouchableOpacity
              style={styles.biometricAuthBtn}
              onPress={handleBiometricAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.biometricAuthIcon}>
                <MaterialCommunityIcons
                  name={biometricType === 'face' ? 'face-recognition' : 'fingerprint'}
                  size={28}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.biometricAuthLabel}>
                  Pay with {biometricType === 'face' ? 'Face ID' : 'Fingerprint'}
                </Text>
                <Text style={styles.biometricAuthSub}>Tap to authenticate instantly</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}

          {/* Divider between biometric & PIN */}
          {biometricAvailable && biometricEnabled && hasSavedPin && (
            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or PIN</Text>
              <View style={styles.orLine} />
            </View>
          )}

          <TextInput
            style={styles.pinInput}
            placeholder="• • • •"
            placeholderTextColor={colors.textLighter}
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            editable={!loading}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, pin.length < 4 && styles.confirmBtnDisabled]}
          onPress={handleConfirmWithPin}
          disabled={loading || pin.length < 4}
          activeOpacity={0.85}
        >
          {loading ? (
            <LoadingIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Pay ₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, color: colors.textLight, marginTop: 1 },

  // Amount Hero
  amountHero: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  billerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  billerName: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  itemName: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2, marginBottom: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start' },
  currency: { color: 'rgba(255,255,255,0.8)', fontSize: 22, fontWeight: '700', marginTop: 6, marginRight: 2 },
  amountValue: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  feeNote: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6 },

  // Metadata card
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#0D1F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  // Party rows (sender/receiver)
  partySection: { marginBottom: 4 },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  partyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partyAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  partyInfo: { flex: 1 },
  partyLabel: { fontSize: 11, color: colors.textLight, fontWeight: '600', marginBottom: 2 },
  partyName: { fontSize: 15, fontWeight: '800', color: colors.text },
  partyPhone: { fontSize: 12, color: colors.textLight, marginTop: 1 },
  partyBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 21,
    marginVertical: 2,
  },
  arrowLine: { flex: 1, height: 1, backgroundColor: colors.border },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },

  separator: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLeft: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { marginRight: 8 },
  detailLabel: { fontSize: 13, color: colors.textMed, fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '700', color: colors.text, maxWidth: '55%', textAlign: 'right' },

  // PIN Card
  pinCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#0D1F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  lockIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  pinSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  pinInput: {
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 28,
    letterSpacing: 14,
    textAlign: 'center',
    color: colors.text,
    fontWeight: 'bold',
  },

  // Biometric quick-auth
  biometricAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,82,204,0.2)',
    gap: 12,
  },
  biometricAuthIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  biometricAuthLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  biometricAuthSub: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: 11, color: colors.textLighter, fontWeight: '600', letterSpacing: 0.5 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtnText: { color: colors.textMed, fontWeight: '700', fontSize: 15 },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnDisabled: { backgroundColor: colors.textLighter, shadowOpacity: 0 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
