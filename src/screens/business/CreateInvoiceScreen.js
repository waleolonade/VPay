import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { invoiceService } from '../../services/invoiceService';

export default function CreateInvoiceScreen({ navigation }) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Simple due date helper (add days)
  const setDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]); // YYYY-MM-DD
  };

  const handleCreate = async () => {
    if (!customerName.trim() || !amount || !dueDate) {
      return Alert.alert('Error', 'Please fill in Customer Name, Amount, and Due Date');
    }

    try {
      setSubmitting(true);
      const res = await invoiceService.createInvoice({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        amount: parseFloat(amount),
        description: description.trim(),
        dueDate,
      });

      if (res.success) {
        Alert.alert('Success', 'Payment request sent successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to create request');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.pageSubtitle}>Send a payment request to your customer</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (₦)*</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.amountPrefix}>₦</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              placeholderTextColor={colors.textLight}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. john@example.com"
              placeholderTextColor={colors.textLight}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is this payment for?"
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date* (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-05-10"
              placeholderTextColor={colors.textLight}
              value={dueDate}
              onChangeText={setDueDate}
            />
            <View style={styles.quickDateRow}>
              <TouchableOpacity style={styles.quickChip} onPress={() => setDays(0)}><Text style={styles.quickText}>Today</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickChip} onPress={() => setDays(7)}><Text style={styles.quickText}>In 7 Days</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickChip} onPress={() => setDays(30)}><Text style={styles.quickText}>In 30 Days</Text></TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.btn, submitting && { opacity: 0.7 }]} 
            onPress={handleCreate}
            disabled={submitting}
          >
            <Text style={styles.btnText}>{submitting ? 'Creating...' : 'Send Request'}</Text>
          </TouchableOpacity>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EDF1F7',
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'center' },
  scroll: { padding: 20 },
  pageSubtitle: { fontSize: 13, color: colors.textLight, marginBottom: 24, textAlign: 'center' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: '#EDF1F7',
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  amountWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    borderRadius: 12, borderWidth: 1, borderColor: '#EDF1F7', paddingHorizontal: 16,
  },
  amountPrefix: { fontSize: 20, fontWeight: '900', color: colors.text, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text, paddingVertical: 16 },

  quickDateRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E4E9F2' },
  quickText: { fontSize: 11, fontWeight: '700', color: colors.textMed },

  btn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
