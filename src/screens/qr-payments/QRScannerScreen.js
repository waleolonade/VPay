import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { qrPaymentService } from '../../services/qrPaymentService';
import { walletService } from '../../services/walletService';
import { AuthContext } from '../../context/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_W * 0.68;

// ─── QR payload shape expected from QRGeneratorScreen ────────────────────────
// { type: 'vpay', phone, name, accountNumber, amount?, note? }
// { type: 'bill', billerId, billerName, billType, customerNumber, amount }

const parseQRData = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.type) return parsed;
  } catch (_) {}

  // Fallback: bare phone number
  if (/^0[789][01]\d{8}$/.test(raw.trim())) {
    return { type: 'vpay', phone: raw.trim() };
  }

  return null;
};

// ─── Scanline animation ───────────────────────────────────────────────────────
function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME_SIZE - 4] });

  return (
    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
  );
}

// ─── Corner markers ───────────────────────────────────────────────────────────
function CornerMarker({ style }) {
  return <View style={[styles.corner, style]} />;
}

// ─── Payment confirmation sheet ───────────────────────────────────────────────
function PaymentSheet({ visible, payload, onConfirm, onCancel, loading }) {
  const [pin, setPin] = useState('');
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    if (visible) {
      setPin('');
      setEditAmount(payload?.amount ? String(payload.amount) : '');
    }
  }, [visible, payload]);

  if (!payload) return null;

  const isVPay = payload.type === 'vpay';
  const displayAmount = editAmount || payload.amount;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>
            {isVPay ? 'Send Money' : 'Pay Bill'}
          </Text>

          {/* Recipient */}
          <View style={styles.recipientRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(payload.name || payload.billerName || payload.phone || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recipientName}>
                {payload.name || payload.billerName || 'Unknown'}
              </Text>
              <Text style={styles.recipientSub}>
                {isVPay
                  ? (payload.phone || payload.accountNumber)
                  : `Customer: ${payload.customerNumber}`}
              </Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{isVPay ? 'VPay' : 'Bill'}</Text>
            </View>
          </View>

          {/* Amount */}
          <Text style={styles.fieldLabel}>Amount (₦)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.nairaSign}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder={payload.amount ? String(payload.amount) : '0.00'}
              placeholderTextColor={colors.textLight}
              editable={!payload.amount} // locked when amount is already encoded in QR
            />
          </View>

          {payload.note ? (
            <Text style={styles.noteText}>Note: {payload.note}</Text>
          ) : null}

          {/* PIN */}
          <Text style={styles.fieldLabel}>Transaction PIN</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="numeric"
            secureTextEntry
            placeholder="● ● ● ●"
            placeholderTextColor={colors.textLight}
            maxLength={4}
          />

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!displayAmount || pin.length !== 4 || loading) && styles.confirmBtnDisabled,
            ]}
            onPress={() => onConfirm({ pin, amount: Number(editAmount || payload.amount) })}
            disabled={!displayAmount || pin.length !== 4 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>
                Pay ₦{Number(displayAmount || 0).toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Manual entry modal ───────────────────────────────────────────────────────
function ManualEntryModal({ visible, onSubmit, onClose }) {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!/^0[789][01]\d{8}$/.test(phone)) {
      return Alert.alert('Invalid Phone', 'Enter a valid 11-digit Nigerian phone number.');
    }
    if (!amount || Number(amount) < 10) {
      return Alert.alert('Invalid Amount', 'Minimum transfer is ₦10.');
    }
    onSubmit({ type: 'vpay', phone, amount: Number(amount) });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Manual Transfer</Text>

          <Text style={styles.fieldLabel}>Recipient Phone</Text>
          <TextInput
            style={styles.pinInput}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="080XXXXXXXX"
            placeholderTextColor={colors.textLight}
            maxLength={11}
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Amount (₦)</Text>
          <TextInput
            style={styles.pinInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.textLight}
          />

          <TouchableOpacity
            style={[styles.confirmBtn, (!phone || !amount) && styles.confirmBtnDisabled]}
            onPress={handleSubmit}
            disabled={!phone || !amount}
          >
            <Text style={styles.confirmBtnText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function QRScannerScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch]             = useState(false);
  const [scanned, setScanned]         = useState(false);
  const [parsedPayload, setParsedPayload] = useState(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showManualModal, setShowManualModal]   = useState(false);
  const [paying, setPaying]           = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);

  // Fetch balance once so the sheet can show it
  useEffect(() => {
    walletService.getWallet()
      .then((res) => setWalletBalance(res?.data?.balance ?? res?.balance ?? null))
      .catch(() => {});
  }, []);

  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;

    const payload = parseQRData(data);
    if (!payload) {
      Vibration.vibrate(100);
      Alert.alert(
        'Unrecognised QR Code',
        'This code is not a valid VPay payment QR. Try scanning another one.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }],
      );
      setScanned(true);
      return;
    }

    Vibration.vibrate([0, 80]);
    setScanned(true);
    setParsedPayload(payload);
    setShowPaymentSheet(true);
  };

  const handlePaymentConfirm = async ({ pin, amount }) => {
    if (!parsedPayload) return;
    setPaying(true);

    try {
      if (parsedPayload.type === 'vpay') {
        await qrPaymentService.qrPayVPay({
          phone:  parsedPayload.phone || parsedPayload.accountNumber,
          amount,
          note:   parsedPayload.note,
          pin,
          qrRaw:  JSON.stringify(parsedPayload),
        });
      } else if (parsedPayload.type === 'bill') {
        await qrPaymentService.qrPayBill({
          billerId:      parsedPayload.billerId,
          billerName:    parsedPayload.billerName,
          billType:      parsedPayload.billType,
          customerNumber:parsedPayload.customerNumber,
          division:      parsedPayload.division,
          paymentItem:   parsedPayload.paymentItem,
          productId:     parsedPayload.productId,
          amount,
          pin,
          phoneNumber:   parsedPayload.phoneNumber,
          qrRaw:         JSON.stringify(parsedPayload),
        });
      }

      setShowPaymentSheet(false);
      navigation.replace('TransferSuccess', {
        amount,
        paymentDetails: {
          billerName: parsedPayload.name || parsedPayload.billerName || parsedPayload.phone,
          billerCategory: parsedPayload.type === 'vpay' ? 'transfer' : parsedPayload.billType,
          customerId: parsedPayload.phone || parsedPayload.customerNumber,
          amount,
          convenienceFee: 0,
        },
      });
    } catch (err) {
      Alert.alert(
        'Payment Failed',
        err?.data?.message || err?.message || 'Something went wrong. Check your PIN and balance.',
        [{ text: 'Try Again', onPress: () => { setParsedPayload(null); setScanned(false); setShowPaymentSheet(false); } }],
      );
    } finally {
      setPaying(false);
    }
  };

  const handleManualSubmit = (payload) => {
    setShowManualModal(false);
    setParsedPayload(payload);
    setScanned(true);
    setShowPaymentSheet(true);
  };

  const resetScan = () => {
    setScanned(false);
    setParsedPayload(null);
    setShowPaymentSheet(false);
  };

  // ── Permission states ──────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={72} color={colors.primary} />
        <Text style={styles.permTitle}>Camera Permission Needed</Text>
        <Text style={styles.permSubtitle}>
          VPay needs access to your camera to scan payment QR codes.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textLight }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Main camera UI ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Dark overlay with viewfinder cutout */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan to Pay</Text>
          <TouchableOpacity onPress={() => setTorch((t) => !t)} style={styles.iconBtn}>
            <Ionicons
              name={torch ? 'flash' : 'flash-outline'}
              size={24}
              color={torch ? colors.warning : '#fff'}
            />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          {/* Corner markers */}
          <CornerMarker style={styles.cornerTL} />
          <CornerMarker style={styles.cornerTR} />
          <CornerMarker style={styles.cornerBL} />
          <CornerMarker style={styles.cornerBR} />
          {!scanned && <ScanLine />}
          {scanned && !showPaymentSheet && (
            <View style={styles.scannedOverlay}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
          )}
        </View>

        {/* Hint text */}
        <Text style={styles.hintText}>
          Point your camera at a VPay QR code
        </Text>

        {/* Balance chip */}
        {walletBalance !== null && (
          <View style={styles.balanceChip}>
            <Ionicons name="wallet-outline" size={14} color="#fff" />
            <Text style={styles.balanceChipText}>
              Balance: ₦{Number(walletBalance).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Bottom actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowManualModal(true)}
          >
            <Ionicons name="keypad-outline" size={22} color="#fff" />
            <Text style={styles.actionBtnText}>Manual Entry</Text>
          </TouchableOpacity>

          {scanned && !showPaymentSheet && (
            <TouchableOpacity style={styles.actionBtn} onPress={resetScan}>
              <Ionicons name="refresh-outline" size={22} color="#fff" />
              <Text style={styles.actionBtnText}>Scan Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('RequestMoney')}
          >
            <Ionicons name="qr-code-outline" size={22} color="#fff" />
            <Text style={styles.actionBtnText}>My QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment confirmation sheet */}
      <PaymentSheet
        visible={showPaymentSheet}
        payload={parsedPayload}
        loading={paying}
        onConfirm={handlePaymentConfirm}
        onCancel={() => { setShowPaymentSheet(false); resetScan(); }}
      />

      {/* Manual entry modal */}
      <ManualEntryModal
        visible={showManualModal}
        onSubmit={handleManualSubmit}
        onClose={() => setShowManualModal(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CORNER = 22;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  // ── Permission ──
  permissionContainer: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  permTitle:    { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 10 },
  permSubtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center', lineHeight: 22 },
  permBtn: {
    marginTop: 28, backgroundColor: colors.primary,
    paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // ── Camera overlay ──
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topTitle:  { fontSize: 18, fontWeight: '700', color: '#fff' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Viewfinder ──
  viewfinder: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    position: 'relative', overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,196,140,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Corner markers ──
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff', borderWidth: BORDER },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  hintText: {
    marginTop: 24, color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center',
  },

  // ── Balance chip ──
  balanceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  balanceChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // ── Bottom bar ──
  bottomBar: {
    position: 'absolute', bottom: 48, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 16,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // ── Payment sheet ──
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  sheetHandle: {
    alignSelf: 'center', width: 40, height: 4,
    backgroundColor: colors.border, borderRadius: 2, marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 20 },

  recipientRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: colors.primary },
  recipientName: { fontSize: 16, fontWeight: '700', color: colors.text },
  recipientSub:  { fontSize: 13, color: colors.textLight, marginTop: 2 },
  typeBadge: {
    backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMed, marginBottom: 8 },

  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 16, backgroundColor: colors.inputBg,
  },
  nairaSign:  { fontSize: 22, fontWeight: '700', color: colors.text, marginRight: 4 },
  amountInput:{ flex: 1, fontSize: 28, fontWeight: '800', color: colors.text, paddingVertical: 10 },

  noteText: { fontSize: 13, color: colors.textLight, marginBottom: 12, fontStyle: 'italic' },

  pinInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    padding: 14, fontSize: 16, color: colors.text,
    backgroundColor: colors.inputBg, letterSpacing: 6,
  },

  confirmBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  cancelBtn:     { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { color: colors.textLight, fontSize: 15, fontWeight: '600' },
});
