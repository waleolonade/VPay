import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Modal, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { walletService } from '../../services/walletService';
import socketService from '../../services/socketService';
import api from '../../services/api';
import { endpoints } from '../../constants/apiEndpoints';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

// Fee structure for peer-to-peer transfers
const FEE_TIERS = [
  { max: 10_000,    fee: 0 },  // No fee up to ₦10k
  { max: 50_000,    fee: 25 },
  { max: Infinity,  fee: 50 },
];

const getTransferFee = (amount) => {
  const n = Number(String(amount).replace(/[^0-9.]/g, '')) || 0;
  for (const t of FEE_TIERS) { if (n <= t.max) return t.fee; }
  return 50;
};

const fmt = (n) => {
  // Safely convert to number
  const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.-]/g, '')) : Number(n);
  // Ensure it's a valid number, default to 0
  const safeNum = isNaN(num) ? 0 : num;
  // Format with locale
  return safeNum.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const clean = (s) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;

// ─── Root Component ────────────────────────────────────────────────────────────
export default function VPayToVPayScreen({ navigation, route }) {
  const { user } = useAuth();

  const [step, setStep] = useState('recipient'); // 'recipient' | 'amount' | 'confirm'

  // Remote data
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState(null);
  const balanceRetryRef = useRef(0);

  // Recipient
  const [recipientQuery, setRecipientQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  // Amount
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Confirm
  const [pin, setPin] = useState('');
  const [sending, setSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTxn, setSuccessTxn] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [description, setDescription] = useState('');
  
  // Real-time notifications
  const [realtimeNotif, setRealtimeNotif] = useState(null);
  const notifTimeout = useRef(null);

  const searchTimeout = useRef(null);

  // ─── Real-time Socket.IO listeners ──────────────────────────────────────────
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Listen for successful transfer sent
    socket.on('transfer_sent', (data) => {
      console.log('[Socket] Transfer sent:', data);
      setRealtimeNotif({
        type: 'sent',
        message: `Sent ₦${fmt(data.amount)} to ${data.recipient}`,
        newBalance: data.newBalance,
      });
      // Update local balance
      setWalletBalance(data.newBalance ?? walletBalance);
      clearTimeout(notifTimeout.current);
      notifTimeout.current = setTimeout(() => setRealtimeNotif(null), 5000);
    });

    // Listen for money received
    socket.on('transfer_received', (data) => {
      console.log('[Socket] Transfer received:', data);
      setRealtimeNotif({
        type: 'received',
        message: `Received ₦${fmt(data.amount)} from ${data.sender}`,
        newBalance: data.newBalance,
      });
      // Update local balance
      setWalletBalance(data.newBalance ?? walletBalance);
      clearTimeout(notifTimeout.current);
      notifTimeout.current = setTimeout(() => setRealtimeNotif(null), 5000);
    });

    // Listen for balance updates from other operations
    socket.on('balance_updated', (data) => {
      console.log('[Socket] Balance updated event received:', JSON.stringify(data));
      if (data.balance !== undefined) {
        const balanceValue = parseFloat(data.balance);
        console.log(`[Socket] Setting balance to: ₦${fmt(balanceValue)} (raw: ${balanceValue})`);
        setWalletBalance(balanceValue);
        setBalanceError(null);
      }
    });

    // Listen for wallet operations (funding, withdrawal, etc.)
    socket.on('wallet_operation', (data) => {
      console.log('[Socket] Wallet operation:', data);
      loadBalance(); // Reload balance for accuracy
    });

    return () => {
      socket.off('transfer_sent');
      socket.off('transfer_received');
      socket.off('balance_updated');
      socket.off('wallet_operation');
      clearTimeout(notifTimeout.current);
    };
  }, [walletBalance, loadBalance]);

  // ─── Load balance from database ──────────────────────────────────────────
  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const res = await walletService.getWallets();
      console.log('[VPayToVPayScreen] Balance API response:', JSON.stringify(res, null, 2));
      
      if (res?.success) {
        const targetType = route.params?.walletType || 'personal';
        const wallets = Array.isArray(res.data) ? res.data : [res.data];
        const w = wallets.find(x => x.walletType === targetType) || wallets[0];
        
        const balanceValue = parseFloat(w?.balance ?? 0);
        console.log(`[VPayToVPayScreen] Loaded balance for ${targetType}: ₦${fmt(balanceValue)} (raw: ${balanceValue})`);
        
        setWalletBalance(balanceValue);
        setBalanceError(null);
        balanceRetryRef.current = 0;
      } else {
        const errMsg = res?.message || 'Failed to load balance';
        setBalanceError(errMsg);
        console.error('[VPayToVPayScreen] Balance load error:', errMsg);
      }
    } catch (err) {
      const errMsg = err?.message || 'Network error. Check your connection.';
      setBalanceError(errMsg);
      console.error('[VPayToVPayScreen] Balance load exception:', errMsg, err);
    } finally {
      setBalanceLoading(false);
    }
  }, [route.params]);

  // Load recent transfers + initial balance
  useEffect(() => {
    Promise.all([
      api.get(endpoints.GET_TRANSACTIONS, { params: { type: 'vpay' } }).catch(() => ({ data: [] })),
    ])
      .then(([txnRes]) => {
        if (txnRes?.success) {
          const mapped = (txnRes.data || []).map(t => {
            if (typeof t.recipient === 'string') {
              try { t.recipient = JSON.parse(t.recipient); } catch (e) {}
            }
            return t;
          });
          setRecentTransfers(mapped.slice(0, 5));
        }
      })
      .catch(() => {});
    
    loadBalance();
  }, [loadBalance]);

  // ─── Refresh balance on screen focus ──────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      console.log('[VPayToVPayScreen] Screen focused, refreshing balance...');
      loadBalance();
    }, [loadBalance])
  );

  // Search users with debounce
  const handleSearchChange = useCallback((text) => {
    setRecipientQuery(text);
    clearTimeout(searchTimeout.current);

    const cleanDigits = text.replace(/[^0-9]/g, '');

    // ── 10-digit VPay account number ─────────────────────────────────────────
    if (cleanDigits.length === 10) {
      setSearching(true);
      paymentService
        .verifyAccount(null, null, null, cleanDigits) // vpayAccountNumber
        .then((res) => {
          if (res?.success && res.data) {
            selectRecipient({
              id: res.data.id,
              firstName: res.data.firstName,
              lastName: res.data.lastName,
              phone: res.data.phone,
              avatar: res.data.avatar,
              accountNumber: res.data.accountNumber,
            });
          } else {
            Alert.alert('Not Found', 'No VPay account found with this number.');
          }
        })
        .catch((err) => {
          if (err.response?.status === 404) {
            Alert.alert('Not Found', 'No VPay account found with this number.');
          } else {
            Alert.alert('Error', err.response?.data?.message || 'Could not verify account. Please try again.');
          }
        })
        .finally(() => setSearching(false));
      return;
    }

    // ── 11-digit phone number ────────────────────────────────────────────────
    if (cleanDigits.length === 11) {
      setSearching(true);
      paymentService
        .verifyAccount(cleanDigits) // phone
        .then((res) => {
          if (res?.success && res.data) {
            selectRecipient({
              id: res.data.id,
              firstName: res.data.firstName,
              lastName: res.data.lastName,
              phone: res.data.phone,
              avatar: res.data.avatar,
              accountNumber: res.data.accountNumber,
            });
          } else {
            Alert.alert('Not Found', 'No VPay user with this phone number.');
          }
        })
        .catch((err) => {
          if (err.response?.status === 404) {
            Alert.alert('Not Found', 'No VPay user found with this phone number.');
          } else {
            Alert.alert('Error', err.response?.data?.message || 'Could not verify phone number. Please try again.');
          }
        })
        .finally(() => setSearching(false));
      return;
    }

    if (text.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      paymentService
        .searchVPayUsers(text)
        .then((res) => {
          setSearchResults(res?.success ? res.data : []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 500);
  }, [selectRecipient]);

  // Reset recipient
  const resetRecipient = useCallback(() => {
    setSelectedRecipient(null);
    setRecipientQuery('');
    setSearchResults([]);
  }, []);

  // Select recipient from search results
  const selectRecipient = useCallback((recipient) => {
    setSelectedRecipient(recipient);
    setRecipientQuery('');
    setSearchResults([]);
  }, []);

  const handleShareReceipt = async () => {
    if (!successTxn || !selectedRecipient) return;
    try {
      const formattedAmount = fmt(successTxn.amount);
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center; color: #333;">
            <h1 style="color: #10b981;">VPay Transaction Receipt</h1>
            <div style="margin: 30px 0; border: 1px solid #eee; padding: 20px; border-radius: 10px; text-align: left;">
              <p><strong>Recipient:</strong> ${selectedRecipient.firstName} ${selectedRecipient.lastName}</p>
              <p><strong>Phone:</strong> ${selectedRecipient.phone}</p>
              <p><strong>Amount:</strong> ₦${formattedAmount}</p>
              <p><strong>Fee:</strong> Free</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Reference:</strong> ${successTxn.reference || 'N/A'}</p>
              <p><strong>Status:</strong> Successful</p>
            </div>
            <p style="color: #666; font-size: 12px;">Thank you for using VPay!</p>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Error', 'Could not share receipt');
    }
  };

  // Send transfer
  const handleSend = async (validatedPin) => {
    const finalPin = validatedPin || pin;
    if (finalPin.length < 4 || sending || !selectedRecipient) return;

    setSending(true);
    try {
      const payload = {
        amount: clean(amount),
        narration: description.trim() || note.trim() || `Transfer to ${selectedRecipient.firstName}`,
        pin: finalPin,
        walletType: route.params?.walletType || 'personal',
        idempotencyKey: `vp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };

      // Prefer account number (OPay-style) over phone number
      if (selectedRecipient.accountNumber) {
        payload.recipientAccountNumber = selectedRecipient.accountNumber;
      } else {
        payload.recipientPhone = selectedRecipient.phone;
      }

      console.log('[VPayToVPayScreen] Sending transfer:', payload);
      const res = await paymentService.vpayTransfer(payload);
      console.log('[VPayToVPayScreen] Transfer response:', JSON.stringify(res, null, 2));

      if (res?.success) {
        setSuccessTxn(res.data);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        setPin('');
        setAmount('');
        setDescription('');
        setNote('');
        
        // Refresh balance after a short delay to ensure Socket.IO event is processed
        setTimeout(() => {
          console.log('[VPayToVPayScreen] Refreshing balance after transfer...');
          loadBalance();
        }, 1000);
      } else {
        Alert.alert('Transfer Failed', res?.message || 'Something went wrong.');
        setPin('');
      }
    } catch (e) {
      console.error('[VPayToVPayScreen] Transfer exception:', e);
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

  const amountNum = clean(amount);
  const fee = getTransferFee(amountNum);
  const total = amountNum + fee;
  const canGoAmount = !!selectedRecipient;
  const canGoConfirm = amountNum >= 100 && (walletBalance === null || total <= walletBalance);

  const STEPS = ['recipient', 'amount', 'confirm'];
  const stepIndex = STEPS.indexOf(step);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Real-time Notification Toast ──────────────────────────── */}
      {realtimeNotif && (
        <View style={[
          styles.realtimeToast,
          realtimeNotif.type === 'received' && styles.realtimeToastReceived,
          realtimeNotif.type === 'sent' && styles.realtimeToastSent,
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons
              name={realtimeNotif.type === 'received' ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={16}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.realtimeToastMsg}>{realtimeNotif.message}</Text>
              <Text style={styles.realtimeToastBalance}>Balance: ₦{fmt(realtimeNotif.newBalance)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>VPay Transfer</Text>
          <Text style={styles.headerSub}>Instant, fee-free to VPay users</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Progress Bar ──────────────────────────────────── */}
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

      {/* ── Content ───────────────────────────────────────── */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {step === 'recipient' && (
          <RecipientStep
            query={recipientQuery}
            onChangeQuery={handleSearchChange}
            searchResults={searchResults}
            searching={searching}
            selectedRecipient={selectedRecipient}
            recentTransfers={recentTransfers}
            onSelectRecipient={selectRecipient}
            onReset={resetRecipient}
            canContinue={canGoAmount}
            onContinue={() => setStep('amount')}
          />
        )}

        {step === 'amount' && selectedRecipient && (
          <AmountStep
            recipient={selectedRecipient}
            amount={amount}
            setAmount={setAmount}
            note={note}
            setNote={setNote}
            fee={fee}
            total={total}
            walletBalance={walletBalance}
            balanceLoading={balanceLoading}
            balanceError={balanceError}
            onRetryBalance={loadBalance}
            canContinue={canGoConfirm}
            onContinue={() => setStep('confirm')}
          />
        )}

        {step === 'confirm' && selectedRecipient && (
          <ConfirmStep
            recipient={selectedRecipient}
            amount={amountNum}
            total={total}
            pin={pin}
            onPinKey={(k) => {
              if (k === '⌫') setPin((p) => p.slice(0, -1));
              else if (pin.length === 3) {
                const newPin = pin + k;
                setPin(newPin);
                handleSend(newPin);
              }
              else if (pin.length < 4) setPin((p) => p + k);
            }}
            sending={sending}
            onSend={() => handleSend()}
          />
        )}
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={showConfirmModal}
        recipient={selectedRecipient}
        amount={amountNum}
        fee={fee}
        total={total}
        onConfirm={() => {
          setShowConfirmModal(false);
          setStep('confirm');
        }}
        onClose={() => setShowConfirmModal(false)}
      />

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconBg}>
              <Ionicons name="checkmark" size={50} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Transfer Successful!</Text>
            <Text style={styles.successMsg}>
              ₦{fmt(amountNum)} sent to {selectedRecipient?.firstName}
            </Text>
            {successTxn?.reference && (
              <Text style={styles.successRef}>Ref: {successTxn.reference}</Text>
            )}
            <TouchableOpacity
              style={[styles.successBtn, { marginBottom: 12, backgroundColor: '#f1f5f9' }]}
              onPress={handleShareReceipt}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.successBtnTxt, { color: colors.primary }]}>Share Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.popToTop();
              }}
            >
              <Text style={styles.successBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


// ─── Step 1: Recipient ─────────────────────────────────────────────────────────
function RecipientStep({
  query, onChangeQuery, searchResults, searching, selectedRecipient,
  recentTransfers, onSelectRecipient, onReset, canContinue, onContinue,
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Who are you sending to?</Text>
      
      {!selectedRecipient && (
        <TouchableOpacity style={styles.contactsButton}>
          <View style={styles.contactsIcon}>
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
          <Text style={styles.contactsText}>Select from Contacts</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      )}

      {/* Selected Recipient Card */}
      {selectedRecipient ? (
        <View style={styles.selectedRecipientCard}>
          <View style={styles.recipientAvatar}>
            <Text style={styles.recipientAvatarTxt}>
              {(selectedRecipient.firstName || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.recipientName}>{selectedRecipient.firstName} {selectedRecipient.lastName}</Text>
            <Text style={styles.recipientBank}>VPay • {selectedRecipient.accountNumber || selectedRecipient.phone}</Text>
          </View>
          <TouchableOpacity onPress={onReset} style={styles.changeBtn}>
            <Text style={styles.changeBtnTxt}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Account Number / Phone Number"
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={onChangeQuery}
              keyboardType="phone-pad"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { onChangeQuery(''); onSelectRecipient(null); }} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results or Recent */}
          {searching ? (
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : query.length >= 3 && searchResults.length > 0 ? (
            <View>
              <Text style={styles.sectionLabel}>Results</Text>
              {searchResults.map((user) => (
                <TouchableOpacity
                  key={user._id}
                  style={styles.userItem}
                  onPress={() => onSelectRecipient(user)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarTxt}>{(user.firstName || '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                    <Text style={styles.userBank}>
                      {user.accountNumber ? `VPay: ${user.accountNumber}` : `VPay • ${user.phone}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          ) : query.length >= 3 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>User not found</Text>
            </View>
          ) : recentTransfers.length > 0 ? (
            <View>
              <Text style={styles.sectionLabel}>Recent</Text>
              {recentTransfers.map((txn, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.userItem}
                  onPress={() => {
                    if (txn.recipient?.name && txn.recipient?.phone) {
                      onSelectRecipient({
                        _id: `${i}`,
                        firstName: txn.recipient.name.split(' ')[0],
                        lastName: txn.recipient.name.split(' ').slice(1).join(' ') || '',
                        phone: txn.recipient.phone,
                        accountNumber: txn.recipient.accountNumber,
                        avatar: txn.recipient.avatar
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.userAvatar, { overflow: 'hidden' }]}>
                    {txn.recipient?.avatar ? (
                      <Image source={{ uri: txn.recipient.avatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={styles.userAvatarTxt}>{(txn.recipient?.name || '?')[0].toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.userName}>{txn.recipient?.name}</Text>
                    <Text style={[styles.userBank, { fontSize: 13, marginTop: 2 }]}>
                      {txn.recipient?.accountNumber || txn.recipient?.phone} • VPay
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </>
      )}

      {selectedRecipient && (
        <TouchableOpacity
          style={[styles.continueBtn]}
          onPress={onContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnTxt}>Next</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── Step 2: Amount ───────────────────────────────────────────────────────────
function AmountStep({
  recipient, amount, setAmount, description, setDescription,
  fee, total, walletBalance, balanceLoading, balanceError, onRetryBalance,
  canContinue, onContinue,
}) {
  const insufficient = walletBalance !== null && total > 0 && total > walletBalance;
  const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Transfer Amount</Text>

      {/* Recipient mini card */}
      <View style={styles.miniRecipientCard}>
        <View style={styles.miniAvatar}>
          <Text style={styles.miniAvatarTxt}>{(recipient.firstName || '?')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.miniName}>{recipient.firstName} {recipient.lastName}</Text>
          <Text style={styles.miniBank}>VPay • {recipient.phone}</Text>
        </View>
      </View>

      {/* Amount Input */}
      <View style={[styles.amountContainer]}>
        <View style={[styles.amountInputRow, insufficient && styles.amountInputError]}>
          <Text style={styles.amountSymbol}>₦</Text>
          <TextInput
            style={styles.largeAmountInput}
            placeholder="0"
            placeholderTextColor="#cbd5e1"
            keyboardType="numeric"
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
            autoFocus
            adjustsFontSizeToFit
            numberOfLines={1}
          />
        </View>
        
        <View style={styles.balanceRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.balanceLabel}>Available Balance: </Text>
            {balanceLoading && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginHorizontal: 6 }} />
            )}
          </View>
          {balanceError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.danger }}>Error loading</Text>
              <TouchableOpacity
                onPress={onRetryBalance}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: colors.danger,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.balanceValue, insufficient && styles.errorText]}>
                ₦{fmt(walletBalance || 0)}
              </Text>
              {insufficient && <Text style={styles.errorHint}> (Insufficient)</Text>}
            </>
          )}
        </View>
      </View>

      {/* Quick Amounts */}
      <View style={styles.quickAmountGrid}>
        {QUICK_AMOUNTS.map(val => (
          <TouchableOpacity
            key={val}
            style={styles.quickAmountBtn}
            onPress={() => setAmount(String(val))}
          >
            <Text style={styles.quickAmountTxt}>₦{val.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description (Optional)</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Add a note"
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          maxLength={50}
        />
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !canContinue && styles.btnDisabled]}
        onPress={onContinue}
        disabled={!canContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.continueBtnTxt}>Send Money</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 3: Confirm + PIN ────────────────────────────────────────────────────
function ConfirmStep({
  recipient, amount, total, pin, onPinKey, sending, onSend,
}) {
  const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 20 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.pinHeader}>
        <Text style={styles.pinTitle}>Enter Payment PIN</Text>
        <Text style={styles.pinSub}>Confirm transfer of ₦{fmt(total)} to {recipient.firstName}</Text>
      </View>

      {/* PIN Entry */}
      <View style={styles.pinDots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.pinDot,
              i < pin.length && styles.pinDotFilled,
            ]}
          />
        ))}
      </View>

      {/* PIN Keyboard */}
      <View style={styles.pinGrid}>
        {PIN_KEYS.map((key, i) =>
          key === '' ? (
            <View key={`blank-${i}`} style={styles.pinKeyBlank} />
          ) : (
            <TouchableOpacity
              key={key}
              style={[styles.pinKey, key === '⌫' && { backgroundColor: '#f1f5f9' }]}
              onPress={() => onPinKey(key)}
              disabled={sending}
              activeOpacity={0.7}
            >
              {key === '⌫' ? (
                <Ionicons name="backspace-outline" size={24} color={colors.text} />
              ) : (
                <Text style={styles.pinKeyTxt}>{key}</Text>
              )}
            </TouchableOpacity>
          )
        )}
      </View>

      {sending && (
        <View style={styles.sendingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.sendingText}>Processing Transfer…</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Component: Confirm Modal ──────────────────────────────────────────────────
function ConfirmModal({ visible, recipient, amount, fee, total, onConfirm, onClose }) {
  if (!recipient) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Transfer</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.confirmDetails}>
            <View style={styles.confirmAvatarRow}>
              <View style={styles.confirmAvatar}>
                <Text style={styles.confirmAvatarTxt}>{(recipient.firstName || '?')[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.confirmName}>{recipient.firstName} {recipient.lastName}</Text>
              <Text style={styles.confirmPhone}>{recipient.phone}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>₦{fmt(amount)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Fee</Text>
              <Text style={[styles.detailValue, { color: '#10b981' }]}>Free</Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Deduction</Text>
              <Text style={styles.totalValue}>₦{fmt(total)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
            <Text style={styles.modalConfirmBtnTxt}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 11, color: '#64748b', marginTop: 1 },

  // Progress
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  progressStep: { alignItems: 'center', flex: 1 },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressDotActive: { backgroundColor: colors.primary },
  progressNum: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  progressLbl: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  progressLine: { width: 30, height: 2, backgroundColor: '#f1f5f9', marginBottom: 20 },

  stepContent: { padding: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 20 },
  
  // Recipient Step
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  contactsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  clearBtn: { padding: 4 },
  
  selectedRecipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 24,
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientAvatarTxt: { fontSize: 20, fontWeight: '700', color: '#fff' },
  recipientName: { fontSize: 16, fontWeight: '700', color: colors.text },
  recipientBank: { fontSize: 13, color: '#64748b', marginTop: 2 },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  changeBtnTxt: { fontSize: 12, fontWeight: '700', color: colors.primary },
  
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 12, marginTop: 10 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarTxt: { fontSize: 18, fontWeight: '600', color: '#64748b' },
  userName: { fontSize: 15, fontWeight: '600', color: colors.text },
  userBank: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  
  // Amount Step
  miniRecipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 30,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  miniAvatarTxt: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  miniName: { fontSize: 14, fontWeight: '600', color: colors.text },
  miniBank: { fontSize: 12, color: '#94a3b8' },
  
  amountContainer: { alignItems: 'center', marginBottom: 30 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.primary, paddingBottom: 8, width: '80%', justifyContent: 'center' },
  amountInputError: { borderBottomColor: colors.danger },
  amountSymbol: { fontSize: 32, fontWeight: '700', color: colors.text, marginRight: 8 },
  largeAmountInput: { fontSize: 40, fontWeight: '800', color: colors.text, textAlign: 'center' },
  balanceRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  balanceLabel: { fontSize: 13, color: '#64748b' },
  balanceValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  errorText: { color: colors.danger },
  errorHint: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  
  quickAmountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 30 },
  quickAmountBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9', minWidth: 80, alignItems: 'center' },
  quickAmountTxt: { fontSize: 14, fontWeight: '600', color: colors.text },
  
  inputGroup: { marginBottom: 30 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 },
  descriptionInput: { fontSize: 16, color: colors.text, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  
  // PIN Step
  pinHeader: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  pinTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  pinSub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  pinDots: { flexDirection: 'row', gap: 20, justifyContent: 'center', marginBottom: 50 },
  pinDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#e2e8f0' },
  pinDotFilled: { backgroundColor: colors.primary },
  pinGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, width: '100%' },
  pinKey: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  pinKeyTxt: { fontSize: 28, fontWeight: '600', color: colors.text },
  pinKeyBlank: { width: 80, height: 80 },
  
  sendingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  sendingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  confirmModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  
  confirmDetails: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 20, marginBottom: 24 },
  confirmAvatarRow: { alignItems: 'center', marginBottom: 20 },
  confirmAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  confirmAvatarTxt: { fontSize: 24, fontWeight: '700', color: '#fff' },
  confirmName: { fontSize: 18, fontWeight: '800', color: colors.text },
  confirmPhone: { fontSize: 14, color: '#64748b', marginTop: 2 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 14, color: '#64748b' },
  detailValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  totalRow: { borderBottomWidth: 0, marginTop: 8 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  
  modalConfirmBtn: { backgroundColor: colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalConfirmBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  // Real-time notification toast
  realtimeToast: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  realtimeToastReceived: { backgroundColor: '#10b981' },
  realtimeToastSent: { backgroundColor: '#8b5cf6' },
  realtimeToastMsg: { fontSize: 13, fontWeight: '600', color: '#fff' },
  realtimeToastBalance: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Success Modal
  successOverlay: { flex: 1, backgroundColor: 'rgba(255,255,255,1)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successCard: { alignItems: 'center', width: '100%' },
  successIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 12 },
  successMsg: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  successRef: { fontSize: 12, color: '#94a3b8', marginBottom: 40 },
  successBtn: { backgroundColor: colors.primary, height: 56, borderRadius: 16, width: '100%', justifyContent: 'center', alignItems: 'center' },
  successBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  // General
  continueBtn: { backgroundColor: colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  continueBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#e2e8f0', opacity: 1 },
});

