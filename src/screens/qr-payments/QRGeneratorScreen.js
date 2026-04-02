import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { qrPaymentService } from '../../services/qrPaymentService';
import { AuthContext } from '../../context/AuthContext';

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2500, 5000];

export default function QRGeneratorScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [amount, setAmount]   = useState('');
  const [note, setNote]       = useState('');
  const [wallet, setWallet]   = useState(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef(null);

  useEffect(() => {
    qrPaymentService.getMyQRToken()
      .then((res) => setWallet(res?.data ?? res))
      .catch(() => Alert.alert('Error', 'Could not load wallet details.'))
      .finally(() => setLoading(false));
  }, []);

  // Build the JSON payload embedded in the QR code
  // wallet is the /qr/token response: { phone, name, accountNumber, walletId, issuedAt }
  const buildQRPayload = () => {
    if (!wallet) return '';
    const payload = {
      type:          'vpay',
      phone:         wallet.phone || user?.phone || '',
      name:          wallet.name  || (user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.name || '')),
      accountNumber: wallet.accountNumber || '',
      ...(amount && { amount: Number(amount) }),
      ...(note   && { note }),
    };
    return JSON.stringify(payload);
  };

  const qrValue = buildQRPayload();
  const hasAmount = !!amount && Number(amount) > 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Pay me on VPay!\n${
          hasAmount ? `Amount: ₦${Number(amount).toLocaleString()}\n` : ''
        }Phone: ${user?.phone || wallet?.phone || ''}${note ? `\nNote: ${note}` : ''}`,
        title: 'VPay Payment Request',
      });
    } catch (_) {}
  };

  const handlePrint = async () => {
    try {
      const svgString = await new Promise((resolve, reject) => {
        if (qrRef.current) {
          qrRef.current.toDataURL((data) => resolve(data));
        } else {
          reject(new Error('QR ref not ready'));
        }
      });

      const html = `
        <html><body style="display:flex;flex-direction:column;align-items:center;padding:40px;font-family:sans-serif;">
          <h2 style="color:#0052CC">VPay Payment QR Code</h2>
          <img src="data:image/png;base64,${svgString}" width="200" height="200"/>
          ${hasAmount ? `<p style="font-size:22px;font-weight:bold">₦${Number(amount).toLocaleString()}</p>` : ''}
          <p>${user?.firstName ?? ''} ${user?.lastName ?? ''}</p>
          ${note ? `<p style="color:#666">${note}</p>` : ''}
        </body></html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      }
    } catch (err) {
      Alert.alert('Error', 'Could not export QR code.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <TouchableOpacity onPress={handleShare} style={styles.backBtn}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* QR Card */}
            <View style={styles.qrCard}>
              <View style={styles.qrLogoRow}>
                <View style={styles.qrLogoBox}>
                  <Text style={styles.qrLogoText}>V</Text>
                </View>
                <Text style={styles.qrBrandText}>VPay</Text>
              </View>

              <View style={styles.qrWrapper}>
                {qrValue ? (
                  <QRCode
                    value={qrValue}
                    size={200}
                    color={colors.text}
                    backgroundColor="#fff"
                    getRef={(ref) => { qrRef.current = ref; }}
                    logo={require('../../../assets/icon.png')}
                    logoSize={36}
                    logoBackgroundColor="#fff"
                    logoBorderRadius={8}
                    quietZone={8}
                  />
                ) : (
                  <View style={styles.qrEmpty}>
                    <Ionicons name="qr-code-outline" size={64} color={colors.textLighter} />
                    <Text style={styles.qrEmptyText}>Loading your details…</Text>
                  </View>
                )}
              </View>

              <Text style={styles.qrName}>
                {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.name || '—'}
              </Text>
              <Text style={styles.qrPhone}>{user?.phone || wallet?.phone || ''}</Text>

              {hasAmount && (
                <View style={styles.amountBadge}>
                  <Text style={styles.amountBadgeText}>
                    ₦{Number(amount).toLocaleString()}
                  </Text>
                </View>
              )}
              {note ? <Text style={styles.qrNote}>{note}</Text> : null}
            </View>

            {/* Optional amount */}
            <Text style={styles.sectionLabel}>Request a specific amount (optional)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.nairaSign}>₦</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              />
              {amount ? (
                <TouchableOpacity onPress={() => setAmount('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textLight} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Preset amounts */}
            <View style={styles.presetRow}>
              {PRESET_AMOUNTS.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.presetChip, amount === String(v) && styles.presetChipActive]}
                  onPress={() => setAmount(String(v))}
                >
                  <Text style={[styles.presetChipText, amount === String(v) && styles.presetChipTextActive]}>
                    ₦{v.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. For dinner last night"
              placeholderTextColor={colors.textLight}
              value={note}
              onChangeText={setNote}
              maxLength={80}
            />

            {/* Actions */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Share QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn} onPress={handlePrint}>
              <Ionicons name="download-outline" size={20} color={colors.primary} />
              <Text style={styles.outlineBtnText}>Save / Print as PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Ionicons name="scan-outline" size={20} color={colors.text} />
              <Text style={styles.scanBtnText}>Scan Someone's Code</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  content: { padding: 20, paddingBottom: 48 },

  // ── QR Card ──
  qrCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: 28,
    alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12,
    elevation: 4, marginBottom: 24,
  },
  qrLogoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  qrLogoBox:  {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  qrLogoText:  { color: '#fff', fontWeight: '900', fontSize: 18 },
  qrBrandText: { fontSize: 18, fontWeight: '800', color: colors.text },

  qrWrapper: {
    padding: 12, backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  qrEmpty:     { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  qrEmptyText: { color: colors.textLight, fontSize: 13, marginTop: 8 },

  qrName:      { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 16 },
  qrPhone:     { fontSize: 13, color: colors.textLight, marginTop: 4 },
  amountBadge: {
    marginTop: 12, backgroundColor: colors.primaryLight,
    paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20,
  },
  amountBadgeText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  qrNote:          { fontSize: 13, color: colors.textLight, marginTop: 8, fontStyle: 'italic' },

  // ── Amount input ──
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMed, marginBottom: 10 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, backgroundColor: colors.surface, marginBottom: 12,
  },
  nairaSign:   { fontSize: 22, fontWeight: '700', color: colors.textMed, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.text, paddingVertical: 10 },

  // ── Presets ──
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  presetChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  presetChipActive:     { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  presetChipText:       { fontSize: 13, fontWeight: '600', color: colors.textMed },
  presetChipTextActive: { color: colors.primary },

  // ── Note ──
  noteInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    padding: 14, fontSize: 14, color: colors.text, backgroundColor: colors.surface,
  },

  // ── Buttons ──
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 15, marginTop: 24,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 2, borderColor: colors.primary, borderRadius: 14,
    paddingVertical: 14, marginTop: 12, backgroundColor: colors.surface,
  },
  outlineBtnText: { color: colors.primary, fontSize: 16, fontWeight: '700' },

  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, marginTop: 12,
  },
  scanBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
