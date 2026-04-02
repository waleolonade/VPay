import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import { bankService } from '../../../services/bankService';
import Header from '../../../components/common/Header';

export default function LinkBankAccountScreen({ navigation }) {
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountName, setAccountName] = useState('');
  
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [bankQuery, setBankQuery] = useState('');
  
  const [saving, setSaving] = useState(false);
  
  const resolveRef = useRef(null);

  // Load banks on mount
  useEffect(() => {
    bankService.getBankList()
      .then(res => {
        if (res?.success) setBanks(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingBanks(false));
  }, []);

  // Handle account number change
  const handleAccountNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    setAccountNumber(cleaned);
    if (cleaned.length < 10) {
      setAccountName('');
      setResolveError('');
    }
  };

  // Resolve account name
  const resolveAccount = useCallback(async (accNo, bCode) => {
    if (!accNo || !bCode) return;
    setResolving(true);
    setAccountName('');
    setResolveError('');
    
    try {
      const res = await bankService.resolveAccount(accNo, bCode);
      if (res?.success && res.data?.accountName) {
        setAccountName(res.data.accountName);
      } else {
        setResolveError('Could not verify account name.');
      }
    } catch (error) {
      setResolveError(error.message || 'Account resolution failed.');
    } finally {
      setResolving(false);
    }
  }, []);

  // Auto-resolve when account number hits 10 digits and bank is selected
  useEffect(() => {
    clearTimeout(resolveRef.current);
    if (accountNumber.length === 10 && selectedBank) {
      resolveRef.current = setTimeout(() => resolveAccount(accountNumber, selectedBank.code), 400);
    }
    return () => clearTimeout(resolveRef.current);
  }, [accountNumber, selectedBank, resolveAccount]);

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setBankPickerVisible(false);
    setBankQuery('');
    if (accountNumber.length === 10) {
      resolveAccount(accountNumber, bank.code);
    }
  };

  const handleSave = async () => {
    if (!selectedBank || accountNumber.length !== 10 || !accountName) {
      Alert.alert('Incomplete details', 'Please ensure all account details are provided and verified.');
      return;
    }

    setSaving(true);
    try {
      const res = await bankService.addBankAccount({
        accountNumber,
        accountName,
        bankCode: selectedBank.code,
        bankName: selectedBank.name
      });
      if (res?.success) {
        Alert.alert('Success', 'Bank account linked successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', res?.message || 'Failed to link bank account.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to link bank account.');
    } finally {
      setSaving(false);
    }
  };

  const filteredBanks = useMemo(() => {
    const q = bankQuery.toLowerCase();
    return banks.filter(b => b.name?.toLowerCase().includes(q) || b.code?.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [banks, bankQuery]);

  const canSave = selectedBank && accountNumber.length === 10 && accountName && !resolving;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Link Bank Account" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Select Bank</Text>
        <TouchableOpacity 
          style={styles.pickerTrigger} 
          onPress={() => setBankPickerVisible(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="bank" size={20} color={colors.primary} style={{ marginRight: 12 }} />
          <Text style={[styles.pickerText, !selectedBank && { color: '#94a3b8' }]}>
            {selectedBank ? selectedBank.name : 'Select your bank'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <Text style={styles.label}>Account Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit account number"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          maxLength={10}
          value={accountNumber}
          onChangeText={handleAccountNumberChange}
        />

        {resolving && (
          <View style={styles.statusBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>Resolving account name...</Text>
          </View>
        )}

        {accountName ? (
          <View style={[styles.statusBox, styles.successBox]}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={[styles.statusText, { color: '#10b981', fontWeight: '700' }]}>{accountName}</Text>
          </View>
        ) : resolveError ? (
          <View style={[styles.statusBox, styles.errorBox]}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={[styles.statusText, { color: colors.danger }]}>{resolveError}</Text>
          </View>
        ) : null}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" style={{ marginRight: 10 }} />
          <Text style={styles.infoText}>We will verify the account name with your bank to ensure your details are correct.</Text>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, !canSave && styles.btnDisabled]} 
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Link Account</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Bank Picker Modal */}
      <Modal visible={bankPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setBankPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search bank name..."
                placeholderTextColor="#94a3b8"
                value={bankQuery}
                onChangeText={setBankQuery}
              />
            </View>

            {loadingBanks ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.bankItem} onPress={() => handleBankSelect(item)}>
                    <Text style={styles.bankItemName}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#e2e8f0" />
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 20 },
  pickerTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  pickerText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 16, fontSize: 16, color: colors.text, fontWeight: '500', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 12, borderRadius: 10, marginTop: 12 },
  successBox: { backgroundColor: '#f0fdf4', borderColor: '#bbfcce', borderWidth: 1 },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 },
  statusText: { fontSize: 14, color: '#3b82f6', marginLeft: 10 },
  infoBox: { flexDirection: 'row', backgroundColor: '#f0f9ff', padding: 15, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, color: '#1e40af', lineHeight: 18 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 40, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', paddingHorizontal: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, marginVertical: 15 },
  searchInput: { flex: 1, height: 45, fontSize: 15, color: colors.text },
  bankItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  bankItemName: { fontSize: 15, color: colors.text, fontWeight: '500' },
});
