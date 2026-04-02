import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Switch, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { walletService } from '../../services/walletService';
import socketService from '../../services/socketService';
import api from '../../services/api';
import { endpoints } from '../../constants/apiEndpoints';

// ─── Fee tiers (mirrors backend TRANSFER_FEE_TIERS) ───────────────────────────
const FEE_TIERS = [
  { max: 5_000,    fee: 10 },
  { max: 50_000,   fee: 25 },
  { max: Infinity, fee: 50 },
];
const getTransferFee = (amount) => {
  const n = Number(String(amount).replace(/[^0-9.]/g, '')) || 0;
  for (const t of FEE_TIERS) { if (n <= t.max) return t.fee; }
  return 50;
};
const fmt   = (n) => Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clean = (s) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;

// Popular NIP bank codes — pinned at top of picker
const POPULAR_CODES = new Set([
  '000014','000015','000013','000009','000004',
  '090267','100004','000023','000011','100033',
  '000007','000016','000017','000001','000021',
]);

// ─── Root Component ────────────────────────────────────────────────────────────
export default function BankTransferScreen({ navigation, route }) {
  const { user } = useAuth();

  const [step, setStep] = useState('recipient'); // 'recipient' | 'amount' | 'confirm'

  // Remote data
  const [banks, setBanks]                 = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [banksLoading, setBanksLoading]   = useState(true);

  // Recipient
  const [accountNumber, setAccountNumber]     = useState(route.params?.accountNumber || '');
  const [selectedBank, setSelectedBank]       = useState(
    route.params?.bankCode ? { code: route.params.bankCode, name: route.params.bankName } : null
  );
  const [beneficiaryName, setBeneficiaryName] = useState(route.params?.accountName || '');
  // detectMode: 'idle' | 'detecting' | 'resolved' | 'needs-bank' | 'error'
  const [detectMode, setDetectMode]   = useState(route.params?.bankCode ? 'resolved' : 'idle');
  const [resolveError, setResolveError] = useState('');

  // Bank picker
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [bankQuery, setBankQuery]                 = useState('');

  // Amount
  const [amount, setAmount]               = useState(route.params?.amount?.toString() || '');
  const [narration, setNarration]         = useState('');
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);

  // Confirm
  const [pin, setPin]         = useState('');
  const [sending, setSending] = useState(false);

  const resolveRef = useRef(null);

  // Load banks + beneficiaries + balance + saved accounts
  useEffect(() => {
    Promise.all([
      paymentService.getBanks(),
      api.get(endpoints.BENEFICIARIES, { params: { type: 'bank' } }),
      walletService.getWallets(),
      api.get(endpoints.SAVED_BANKS)
    ])
      .then(([banksRes, benefRes, walletRes, savedRes]) => {
        if (banksRes?.success) {
          const bData = banksRes.data;
          setBanks(Array.isArray(bData) ? bData : (bData?.banks || []));
        }
        if (benefRes?.success) {
          const bData = benefRes.data;
          setBeneficiaries(Array.isArray(bData) ? bData : (bData?.beneficiaries || []));
        }
        if (savedRes?.success && savedRes.data?.banks) {
          setSavedAccounts(savedRes.data.banks);
        }
        if (walletRes?.success) {
          const targetType = route.params?.walletType || 'personal';
          const wallets = Array.isArray(walletRes.data) ? walletRes.data : [walletRes.data];
          const w = wallets.find(x => x.walletType === targetType) || wallets[0];
          setWalletBalance(w?.balance ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, []);

  // Reset recipient state
  const resetRecipient = useCallback(() => {
    setSelectedBank(null);
    setBeneficiaryName('');
    setResolveError('');
    setDetectMode('idle');
    clearTimeout(resolveRef.current);
  }, []);

  // Handle account number change
  const handleAccountNumberChange = useCallback((text) => {
    const cleaned = text.replace(/\D/g, '');
    setAccountNumber(cleaned);
    if (cleaned.length < 10) resetRecipient();
  }, [resetRecipient]);

  // Auto-detect: try VFD intra first, then open bank picker
  const tryAutoDetect = useCallback(async (accNo) => {
    setDetectMode('detecting');
    setBeneficiaryName('');
    setResolveError('');
    setSelectedBank(null);

    // Step 1 — Try VFD intra (VPay wallet account)
    try {
      const res = await paymentService.resolveAccount(accNo, '999999');
      if (res?.success && res.data?.accountName) {
        setSelectedBank({ code: '999999', name: 'VFD MFB (VPay)' });
        setBeneficiaryName(res.data.accountName);
        setDetectMode('resolved');
        return;
      }
    } catch {}

    // Step 2 — External bank: need user to pick
    setDetectMode('needs-bank');
    setTimeout(() => setBankPickerVisible(true), 350);
  }, []);

  // Watch account number — trigger auto-detect at 10 digits
  useEffect(() => {
    clearTimeout(resolveRef.current);
    if (accountNumber.length === 10) {
      if (detectMode === 'resolved' && selectedBank && beneficiaryName) return;
      resolveRef.current = setTimeout(() => tryAutoDetect(accountNumber), 400);
    }
    return () => clearTimeout(resolveRef.current);
  }, [accountNumber, tryAutoDetect, detectMode, selectedBank, beneficiaryName]);

  // Socket.IO listener for real-time bank transfer events
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('bank_transfer_completed', (data) => {
      console.log('[Socket] Bank transfer completed:', data);
      // Refresh wallet balance
      walletService.getWallets().then((res) => {
        if (res?.success) {
          const targetType = route.params?.walletType || 'personal';
          const wallets = Array.isArray(res.data) ? res.data : [res.data];
          const w = wallets.find(x => x.walletType === targetType) || wallets[0];
          setWalletBalance(w?.balance ?? null);
        }
      });
    });

    return () => socket.off('bank_transfer_completed');
  }, []);

  // User picks bank from picker → resolve immediately
  const handleBankSelect = useCallback(async (bank) => {
    setBankPickerVisible(false);
    setBankQuery('');
    setSelectedBank(bank);
    setDetectMode('detecting');
    setBeneficiaryName('');
    setResolveError('');
    try {
      const res = await paymentService.resolveAccount(accountNumber, bank.code);
      if (res?.success && res.data?.accountName) {
        setBeneficiaryName(res.data.accountName);
        setDetectMode('resolved');
      } else {
        setResolveError('Account not found at this bank. Try another bank.');
        setDetectMode('error');
      }
    } catch {
      setResolveError('Could not verify account. Please try again.');
      setDetectMode('error');
    }
  }, [accountNumber]);

  // Quick-pick saved beneficiary
  const pickBeneficiary = useCallback((b) => {
    setAccountNumber(b.accountNumber);
    const bk = banks.find((x) => x.code === b.bankCode) || { code: b.bankCode, name: b.bankName };
    setSelectedBank(bk);
    setBeneficiaryName(b.accountName);
    setDetectMode('resolved');
  }, [banks]);

  // Sorted bank list: popular first, then alphabetical; filtered by query
  const filteredBanks = useMemo(() => {
    const q = bankQuery.toLowerCase();
    const list = q
      ? banks.filter((b) => b.name?.toLowerCase().includes(q) || b.code?.includes(bankQuery))
      : banks;
    if (q) return list;
    const popular = list.filter((b) => POPULAR_CODES.has(b.code));
    const rest    = list.filter((b) => !POPULAR_CODES.has(b.code)).sort((a, b) => a.name?.localeCompare(b.name));
    return [
      ...popular,
      { _divider: true, _key: '__div__' },
      ...rest,
    ];
  }, [banks, bankQuery]);

  const amountNum  = clean(amount);
  const fee        = getTransferFee(amountNum);
  const total      = amountNum + fee;
  const enoughBal  = walletBalance === null || total <= walletBalance;

  const canGoAmount  = detectMode === 'resolved' && !!beneficiaryName;
  const canGoConfirm = amountNum >= 100 && enoughBal;

  const handlePinKey = (k) => {
    if (k === '⌫') { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length < 6) setPin((p) => p + k);
  };

  const handleSend = async () => {
    if (pin.length < 6 || sending) return;
    setSending(true);
    try {
      const res = await paymentService.bankTransfer({
        accountNumber,
        bankCode:    selectedBank.code,
        bankName:    selectedBank.name,
        accountName: beneficiaryName,
        amount:      amountNum,
        narration:   narration.trim() || `Transfer to ${beneficiaryName}`,
        pin,
        walletType:  route.params?.walletType || 'personal',
        idempotencyKey: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
      if (res?.success) {
        if (saveBeneficiary) {
          api.post(endpoints.BENEFICIARIES, {
            type: 'bank', accountName: beneficiaryName,
            accountNumber, bankCode: selectedBank.code, bankName: selectedBank.name,
          }).catch(() => {});
        }
        Alert.alert(
          'Transfer Successful!',
          `₦${fmt(amountNum)} sent to ${beneficiaryName}.\n\nRef: ${res.data?.reference || '—'}`,
          [{ text: 'Done', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Transfer Failed', res?.message || 'Something went wrong. Please try again.');
        setPin('');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Transfer failed. Please try again.');
      setPin('');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (step === 'recipient') navigation.goBack();
    else if (step === 'amount') setStep('recipient');
    else { setStep('amount'); setPin(''); }
  };

  const STEPS = ['recipient', 'amount', 'confirm'];
  const stepIndex = STEPS.indexOf(step);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Transfer</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Step Progress Bar ─────────────────────────────── */}
      <View style={styles.progressBar}>
        {['Recipient', 'Amount', 'Confirm'].map((lbl, i) => (
          <React.Fragment key={lbl}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]}>
                {i < stepIndex
                  ? <Ionicons name="checkmark" size={13} color="#fff" />
                  : <Text style={[styles.progressNum, i === stepIndex && { color: '#fff' }]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.progressLbl, i === stepIndex && { color: colors.primary, fontWeight: '700' }]}>{lbl}</Text>
            </View>
            {i < 2 && <View style={[styles.progressLine, i < stepIndex && { backgroundColor: colors.primary }]} />}
          </React.Fragment>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 'recipient' && (
          <RecipientStep
            accountNumber={accountNumber}
            onChangeAccountNumber={handleAccountNumberChange}
            selectedBank={selectedBank}
            beneficiaryName={beneficiaryName}
            detectMode={detectMode}
            resolveError={resolveError}
            beneficiaries={beneficiaries}
            savedAccounts={savedAccounts}
            pickBeneficiary={pickBeneficiary}
            onOpenBankPicker={() => setBankPickerVisible(true)}
            canContinue={canGoAmount}
            onContinue={() => setStep('amount')}
          />
        )}
        {step === 'amount' && (
          <AmountStep
            beneficiaryName={beneficiaryName} selectedBank={selectedBank} accountNumber={accountNumber}
            amount={amount} setAmount={setAmount} narration={narration} setNarration={setNarration}
            saveBeneficiary={saveBeneficiary} setSaveBeneficiary={setSaveBeneficiary}
            fee={fee} total={total} walletBalance={walletBalance}
            canContinue={canGoConfirm} onContinue={() => { setStep('confirm'); setPin(''); }}
          />
        )}
        {step === 'confirm' && (
          <ConfirmStep
            beneficiaryName={beneficiaryName} selectedBank={selectedBank} accountNumber={accountNumber}
            amount={amountNum} fee={fee} total={total} narration={narration}
            pin={pin} onPinKey={handlePinKey} sending={sending} onSend={handleSend}
          />
        )}
      </KeyboardAvoidingView>

      {/* ── Bank Picker Modal ─────────────────────────────── */}
      <BankPickerModal
        visible={bankPickerVisible}
        banks={filteredBanks}
        query={bankQuery}     setQuery={setBankQuery}
        loading={banksLoading}
        onClose={() => { setBankPickerVisible(false); setBankQuery(''); }}
        onSelect={handleBankSelect}
      />
    </SafeAreaView>
  );
}

// ─── Step 1: Recipient ─────────────────────────────────────────────────────────
function RecipientStep({
  accountNumber, onChangeAccountNumber,
  selectedBank, beneficiaryName, detectMode, resolveError,
  beneficiaries, savedAccounts, pickBeneficiary,
  onOpenBankPicker, canContinue, onContinue,
}) {
  const borderColor =
    detectMode === 'resolved'  ? '#10b981'     :
    detectMode === 'error'     ? colors.danger :
    detectMode === 'detecting' || detectMode === 'needs-bank' ? colors.primary :
    '#e2e8f0';

  const hintText =
    accountNumber.length < 10        ? `${accountNumber.length}/10 digits` :
    detectMode === 'detecting'       ? 'Looking up bank and account name…' :
    detectMode === 'needs-bank'      ? 'Bank picker opened — select your bank' :
    detectMode === 'resolved'        ? `Verified at ${selectedBank?.name}` :
    detectMode === 'error'           ? resolveError :
    '';

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Who are you sending to?</Text>
      <Text style={styles.stepSub}>Enter the account number — we'll detect the bank and name automatically.</Text>

      {/* Linked Bank Accounts */}
      {savedAccounts && savedAccounts.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.fieldLabel}>My Saved Accounts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {savedAccounts.map((b, i) => (
              <TouchableOpacity key={`saved-${b.id || i}`} style={[styles.benefPill, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]} onPress={() => pickBeneficiary(b)} activeOpacity={0.75}>
                <View style={[styles.benefAvatar, { backgroundColor: '#0284c7' }]}>
                  <Ionicons name="business" size={20} color="#fff" />
                </View>
                <Text style={styles.benefName} numberOfLines={1}>{b.accountName?.split(' ')[0]}</Text>
                <Text style={styles.benefBank} numberOfLines={1}>{b.bankName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Beneficiaries */}
      {beneficiaries.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.fieldLabel}>Recent</Text>
          <View style={{ marginTop: 8 }}>
            {beneficiaries.slice(0, 5).map((b, i) => (
              <TouchableOpacity
                key={b.id || i}
                style={{
                  flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                  padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0',
                }}
                onPress={() => pickBeneficiary(b)}
                activeOpacity={0.75}
              >
                <View style={[styles.benefAvatar, { overflow: 'hidden' }]}>
                  {b.logo || b.bankLogo ? (
                    <Image source={{ uri: b.logo || b.bankLogo }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={styles.benefAvatarTxt}>{(b.accountName || '?')[0].toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.benefName, { textAlign: 'left', marginBottom: 2 }]} numberOfLines={1}>{b.accountName}</Text>
                  <Text style={[styles.benefBank, { textAlign: 'left', fontSize: 13 }]} numberOfLines={1}>
                    {b.accountNumber} • {b.bankName}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Account Number — only field the user needs to fill */}
      <Text style={styles.fieldLabel}>Account Number</Text>
      <View style={[styles.inputRow, { borderColor, borderWidth: 2 }]}>
        <TextInput
          style={styles.inputLarge}
          placeholder="0000000000"
          placeholderTextColor="#cbd5e1"
          keyboardType="number-pad"
          maxLength={10}
          value={accountNumber}
          onChangeText={onChangeAccountNumber}
          autoFocus
        />
        {detectMode === 'detecting' && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
        )}
        {detectMode === 'resolved' && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
        {detectMode === 'error'    && <Ionicons name="close-circle"     size={24} color={colors.danger} />}
        {accountNumber.length > 0 && detectMode === 'idle' && (
          <TouchableOpacity onPress={() => onChangeAccountNumber('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[
        styles.inputHint,
        detectMode === 'resolved' && { color: '#10b981' },
        detectMode === 'error'    && { color: colors.danger },
        (detectMode === 'detecting' || detectMode === 'needs-bank') && { color: colors.primary },
      ]}>
        {hintText}
      </Text>

      {/* ── Detecting ─────────────────────────────────────── */}
      {detectMode === 'detecting' && (
        <View style={styles.detectCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.detectTitle}>Checking account…</Text>
            <Text style={styles.detectSub}>Verifying bank and account holder name</Text>
          </View>
        </View>
      )}

      {/* ── Resolved ──────────────────────────────────────── */}
      {detectMode === 'resolved' && (
        <View style={[styles.detectCard, styles.detectCardSuccess]}>
          <View style={styles.detectAvatar}>
            <Text style={styles.detectAvatarLetter}>{(beneficiaryName || '?')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.detectSub}>Account Holder</Text>
            <Text style={styles.detectTitle}>{beneficiaryName}</Text>
            <TouchableOpacity style={styles.bankChip} onPress={onOpenBankPicker} activeOpacity={0.7}>
              <MaterialCommunityIcons name="bank" size={12} color={colors.primary} />
              <Text style={styles.bankChipName}>{selectedBank?.name}</Text>
              <Text style={styles.bankChipChange}> · Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Needs-bank (external account) ─────────────────── */}
      {detectMode === 'needs-bank' && (
        <View style={[styles.detectCard, { borderColor: '#fcd34d', backgroundColor: '#fffbeb' }]}>
          <Ionicons name="help-buoy-outline" size={28} color="#f59e0b" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.detectTitle, { color: '#92400e' }]}>Select your bank</Text>
            <Text style={[styles.detectSub,  { color: '#b45309' }]}>Account found — just confirm the bank</Text>
          </View>
          <TouchableOpacity style={styles.pickBankBtn} onPress={onOpenBankPicker} activeOpacity={0.8}>
            <Text style={styles.pickBankBtnTxt}>Pick Bank</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {detectMode === 'error' && (
        <View style={[styles.detectCard, { borderColor: '#fecdd3', backgroundColor: '#fff1f2' }]}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.detectTitle, { color: colors.danger }]}>Not found</Text>
            <Text style={[styles.detectSub,  { color: '#ef4444' }]}>{resolveError}</Text>
          </View>
          <TouchableOpacity
            style={[styles.pickBankBtn, { backgroundColor: `${colors.danger}15` }]}
            onPress={onOpenBankPicker}
            activeOpacity={0.8}
          >
            <Text style={[styles.pickBankBtnTxt, { color: colors.danger }]}>Try Bank</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.continueBtn, !canContinue && styles.btnDisabled]}
        onPress={onContinue}
        disabled={!canContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.continueBtnTxt}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 2: Amount ────────────────────────────────────────────────────────────
function AmountStep({
  beneficiaryName, selectedBank, accountNumber,
  amount, setAmount, narration, setNarration,
  saveBeneficiary, setSaveBeneficiary,
  fee, total, walletBalance,
  canContinue, onContinue,
}) {
  const num = clean(amount);
  const insufficient = walletBalance !== null && num > 0 && total > walletBalance;

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>How much?</Text>

      {/* Recipient summary chip */}
      <View style={styles.recipientChip}>
        <View style={styles.recipientChipAvatar}>
          <Text style={styles.recipientChipAvatarTxt}>{(beneficiaryName || '?')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.recipientChipName}>{beneficiaryName}</Text>
          <Text style={styles.recipientChipBank}>{selectedBank?.name}  ·  ****{accountNumber.slice(-4)}</Text>
        </View>
      </View>

      {/* Amount box */}
      <View style={[styles.amountBox, insufficient && { borderColor: colors.danger }]}>
        <Text style={styles.amountCurrency}>₦</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor="#cbd5e1"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
          autoFocus
        />
      </View>
      {walletBalance !== null && (
        <Text style={[styles.balanceHint, insufficient && { color: colors.danger }]}>
          Balance: ₦{fmt(walletBalance)}{insufficient ? '  ·  Insufficient funds' : ''}
        </Text>
      )}

      {/* Fee breakdown */}
      {num > 0 && (
        <View style={styles.feeCard}>
          <FeeRow label="Amount"        value={`₦${fmt(num)}`} />
          <FeeRow label="Transfer Fee"  value={`₦${fmt(fee)}`} />
          <View style={[styles.feeRowBase, { borderBottomWidth: 0 }]}>
            <Text style={[styles.feeLbl, { fontWeight: '700', color: colors.text }]}>Total Debit</Text>
            <Text style={[styles.feeVal, { fontWeight: '800', color: colors.primary, fontSize: 16 }]}>₦{fmt(total)}</Text>
          </View>
        </View>
      )}

      {/* Narration */}
      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Narration (optional)</Text>
      <TextInput
        style={styles.narrationInput}
        placeholder="What's this transfer for?"
        placeholderTextColor="#94a3b8"
        value={narration}
        onChangeText={setNarration}
        maxLength={100}
      />

      {/* Save beneficiary toggle */}
      <View style={styles.saveRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.saveTitle}>Save as beneficiary</Text>
          <Text style={styles.saveSub}>Quick access for future transfers</Text>
        </View>
        <Switch
          value={saveBeneficiary}
          onValueChange={setSaveBeneficiary}
          trackColor={{ false: '#e2e8f0', true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !canContinue && styles.btnDisabled]}
        onPress={onContinue}
        disabled={!canContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.continueBtnTxt}>Review Transfer</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

function FeeRow({ label, value }) {
  return (
    <View style={styles.feeRowBase}>
      <Text style={styles.feeLbl}>{label}</Text>
      <Text style={styles.feeVal}>{value}</Text>
    </View>
  );
}

// ─── Step 3: Confirm + PIN ─────────────────────────────────────────────────────
function ConfirmStep({
  beneficiaryName, selectedBank, accountNumber,
  amount, fee, total, narration,
  pin, onPinKey, sending, onSend,
}) {
  const PIN_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Confirm Transfer</Text>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        {[
          ['Beneficiary',    beneficiaryName],
          ['Bank',           selectedBank?.name],
          ['Account Number', accountNumber],
          narration ? ['Narration', narration] : null,
        ].filter(Boolean).map(([lbl, val]) => (
          <View key={lbl} style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>{lbl}</Text>
            <Text style={styles.summaryVal}>{val}</Text>
          </View>
        ))}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLbl}>Amount</Text>
          <Text style={styles.summaryVal}>₦{fmt(amount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLbl}>Transfer Fee</Text>
          <Text style={styles.summaryVal}>₦{fmt(fee)}</Text>
        </View>
        <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.summaryLbl, { fontWeight: '700', color: colors.text, fontSize: 15 }]}>Total Debit</Text>
          <Text style={[styles.summaryVal, { fontWeight: '800', color: colors.primary, fontSize: 20 }]}>₦{fmt(total)}</Text>
        </View>
      </View>

      {/* PIN dots */}
      <Text style={[styles.fieldLabel, { textAlign: 'center', marginBottom: 16 }]}>Enter Transaction PIN</Text>
      <View style={styles.pinDots}>
        {[0,1,2,3,4,5].map((i) => (
          <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotOn]} />
        ))}
      </View>

      {/* PIN pad */}
      <View style={styles.pinGrid}>
        {PIN_KEYS.map((k, i) =>
          k === '' ? <View key={i} style={styles.pinKeyBlank} /> : (
            <TouchableOpacity key={i} style={styles.pinKey} onPress={() => onPinKey(k)} activeOpacity={0.7}>
              {k === '⌫'
                ? <Ionicons name="backspace-outline" size={22} color={colors.text} />
                : <Text style={styles.pinKeyTxt}>{k}</Text>}
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendBtn, (pin.length < 6 || sending) && styles.btnDisabled]}
        onPress={onSend}
        disabled={pin.length < 6 || sending}
        activeOpacity={0.85}
      >
        {sending
          ? <ActivityIndicator size="small" color="#fff" />
          : <>
              <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.sendBtnTxt}>Send  ₦{fmt(total)}</Text>
            </>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Bank Picker Modal ─────────────────────────────────────────────────────────
function BankPickerModal({ visible, banks, query, setQuery, loading, onClose, onSelect }) {
  const renderItem = ({ item, index }) => {
    // Divider between popular and all-banks sections
    if (item._divider) {
      return (
        <View style={styles.bankDivider}>
          <View style={styles.bankDividerLine} />
          <Text style={styles.bankDividerLabel}>All Banks</Text>
          <View style={styles.bankDividerLine} />
        </View>
      );
    }
    return (
      <TouchableOpacity style={styles.bankItem} onPress={() => onSelect(item)} activeOpacity={0.7}>
        <View style={styles.bankItemIcon}>
          <MaterialCommunityIcons name="bank" size={18} color={colors.primary} />
        </View>
        <Text style={styles.bankItemName}>{item.name}</Text>
        <Text style={styles.bankItemCode}>{item.code}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Bank</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by name or code…"
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Popular banks header (only when not searching) */}
          {!query && !loading && (
            <View style={styles.bankSectionHdr}>
              <Text style={styles.bankSectionHdrTxt}>Popular Banks</Text>
            </View>
          )}

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 14, color: colors.textLight }}>Loading banks…</Text>
            </View>
          ) : (
            <FlatList
              data={banks}
              keyExtractor={(item, i) => item._key || item.code || String(i)}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                  <Ionicons name="search-outline" size={48} color="#cbd5e1" />
                  <Text style={{ color: colors.textLight, marginTop: 12 }}>No banks found</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backButton:  { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  // Progress bar
  progressBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  progressStep:    { alignItems: 'center', minWidth: 60 },
  progressDot:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  progressDotActive:{ backgroundColor: colors.primary },
  progressNum:     { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  progressLbl:     { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  progressLine:    { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginBottom: 20, marginHorizontal: 4 },

  // Steps
  stepContent: { padding: 20 },
  stepTitle:   { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  stepSub:     { fontSize: 14, color: colors.textLight, marginBottom: 24 },
  fieldLabel:  { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },

  // Account input
  inputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 56 },
  inputLarge: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: 3 },
  inputHint:  { fontSize: 12, color: '#94a3b8', marginTop: 6, marginLeft: 4 },

  // Bank selector
  bankSelector:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 56 },
  bankIconBg:      { width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bankSelectorTxt: { fontSize: 15, fontWeight: '600', color: colors.text },

  // Resolution card
  resolveCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginTop: 16 },
  resolveTxt:  { fontSize: 14, color: colors.textLight, marginLeft: 10 },

  // Beneficiary pills
  benefPill:      { alignItems: 'center', marginRight: 16, width: 64 },
  benefAvatar:    { width: 50, height: 50, borderRadius: 25, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' },
  benefAvatarTxt: { fontSize: 20, fontWeight: '700', color: colors.primary },
  benefName:      { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 6 },
  benefBank:      { fontSize: 10, color: colors.textLight, textAlign: 'center' },

  // Continue button
  continueBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 16, height: 56, marginTop: 32, gap: 8 },
  btnDisabled:    { opacity: 0.4 },
  continueBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Recipient chip (amount step)
  recipientChip:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  recipientChipAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  recipientChipAvatarTxt: { fontSize: 18, fontWeight: '700', color: colors.primary },
  recipientChipName:   { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  recipientChipBank:   { fontSize: 12, color: colors.textLight },

  // Amount input
  amountBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: colors.primary, paddingHorizontal: 20, height: 72, marginBottom: 8 },
  amountCurrency: { fontSize: 26, fontWeight: '700', color: '#64748b', marginRight: 4 },
  amountInput:    { flex: 1, fontSize: 36, fontWeight: '800', color: colors.text },
  balanceHint:    { fontSize: 13, color: '#64748b', marginBottom: 16, marginLeft: 4 },

  // Fee card
  feeCard:    { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, marginTop: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  feeRowBase: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  feeLbl:     { fontSize: 14, color: colors.textLight },
  feeVal:     { fontSize: 14, fontWeight: '600', color: colors.text },

  // Narration
  narrationInput: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text },

  // Save beneficiary
  saveRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16, gap: 12 },
  saveTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  saveSub:   { fontSize: 12, color: colors.textLight, marginTop: 2 },

  // Summary card
  summaryCard:    { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  summaryDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  summaryLbl:     { fontSize: 13, color: colors.textLight },
  summaryVal:     { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 16 },

  // PIN dots
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 28 },
  pinDot:  { width: 14, height: 14, borderRadius: 7, backgroundColor: '#e2e8f0', borderWidth: 1.5, borderColor: '#cbd5e1' },
  pinDotOn:{ backgroundColor: colors.primary, borderColor: colors.primary },

  // PIN grid
  pinGrid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 24, marginBottom: 28 },
  pinKey:      { width: 76, height: 76, borderRadius: 38, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  pinKeyBlank: { width: 76, height: 76 },
  pinKeyTxt:   { fontSize: 26, fontWeight: '700', color: colors.text },

  // Send button
  sendBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', borderRadius: 16, height: 58, gap: 4 },
  sendBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle:       { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSearch:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, margin: 16, paddingHorizontal: 14, height: 46 },
  modalSearchInput: { flex: 1, fontSize: 15, color: colors.text },
  bankItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  bankItemIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.primary}12`, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  bankItemName:     { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  bankItemCode:     { fontSize: 12, color: '#94a3b8' },

  // Bank picker sections
  bankSectionHdr:     { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#f8fafc' },
  bankSectionHdrTxt:  { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 },
  bankDivider:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#f8fafc' },
  bankDividerLine:    { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  bankDividerLabel:   { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 12 },

  // Auto-detect cards
  detectCard:        { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff', padding: 18, marginTop: 16 },
  detectCardSuccess: { borderColor: '#a7f3d0', backgroundColor: '#f0fdf4' },
  detectAvatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center' },
  detectAvatarLetter:{ fontSize: 20, fontWeight: '800', color: colors.primary },
  detectTitle:       { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  detectSub:         { fontSize: 12, color: '#64748b', marginBottom: 6 },

  // Bank chip (shown in resolved card)
  bankChip:       { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.primary}10`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 4 },
  bankChipName:   { fontSize: 12, fontWeight: '600', color: colors.primary, marginLeft: 5 },
  bankChipChange: { fontSize: 12, color: '#64748b' },

  // Pick-bank / change-bank button inside detect card
  pickBankBtn:    { backgroundColor: `${colors.primary}12`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  pickBankBtnTxt: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
