import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function TransactionReceiptScreen({ route, navigation }) {
  const { transaction } = route.params || {};
  const { user, accountMode } = useAuth();
  
  const isBusiness = accountMode === 'business';
  const isSalary = transaction?.category === 'Payroll';
  
  if (!transaction) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text>No transaction data found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{color: colors.primary, marginTop: 10}}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCredit = transaction.type === 'credit' || transaction.amount > 0;
  const amountStr = `₦${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const handleShare = async () => {
    try {
      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: ${colors.primary};">${isBusiness ? (user?.businessName || 'Business Receipt') : 'VPay Receipt'}</h1>
            <div style="font-size: 24px; font-weight: bold; margin: 20px 0;">${amountStr}</div>
            <p style="color: ${isCredit ? 'green' : 'red'}; font-weight: bold;">${isSalary ? 'SALARY PAYMENT' : (isCredit ? 'SUCCESSFUL CREDIT' : 'SUCCESSFUL DEBIT')}</p>
            <hr/>
            <div style="text-align: left; margin-top: 20px;">
              <p><strong>Date:</strong> ${transaction.date || new Date().toLocaleString()}</p>
              <p><strong>Merchant:</strong> ${isBusiness ? user?.businessName : 'VPay User'}</p>
              <p><strong>Reference:</strong> ${transaction.reference || 'N/A'}</p>
              <p><strong>Description:</strong> ${transaction.description || transaction.remarks || 'N/A'}</p>
              <p><strong>Status:</strong> Completed</p>
            </div>
            <div style="margin-top: 40px; font-size: 12px; color: #666;">
                Thank you for choosing ${isBusiness ? user?.businessName : 'VPay'}.
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Receipt</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.receiptCard}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
                <Ionicons name={isBusiness ? "business" : "flash"} size={30} color={colors.primary} />
            </View>
            <Text style={styles.logoText}>{isBusiness ? (user?.businessName || 'Business') : 'VPay'}</Text>
            {isBusiness && <Text style={styles.businessBadge}>OFFICIAL MERCHANT</Text>}
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Transaction Amount</Text>
            <Text style={styles.amountValue}>{amountStr}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isSalary ? '#E3F2FD' : (isCredit ? '#e8f5e9' : '#fff3e0') }]}>
                <Text style={[styles.statusText, { color: isSalary ? '#1565C0' : (isCredit ? '#2e7d32' : '#ef6c00') }]}>
                    {isSalary ? 'SALARY PAYMENT' : (isCredit ? 'SUCCESSFUL CREDIT' : 'SUCCESSFUL DEBIT')}
                </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsList}>
            <DetailRow label="Transaction Date" value={transaction.date || new Date().toLocaleString()} />
            <DetailRow label="Reference Number" value={transaction.reference || 'VP-9283749283'} />
            <DetailRow label={isSalary ? "Staff Account" : "Transaction Type"} value={transaction.category || 'Transfer'} />
            <DetailRow label="Description" value={transaction.description || transaction.remarks || 'Wallet Funding'} />
            {isBusiness && <DetailRow label="Business Owner" value={user?.firstName + ' ' + user?.lastName} />}
            <DetailRow label="Session ID" value="000013240520211534000000000000" />
          </View>

          <View style={styles.divider} />

          <Text style={styles.footerNote}>
            This is an official transaction receipt from VPay. For support, please contact help@vpay.app quoting your reference number.
          </Text>
        </View>

        <TouchableOpacity style={styles.downloadBtn} onPress={handleShare}>
            <Ionicons name="download-outline" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.downloadBtnText}>Download Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, copyable }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
  },
  logoText: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
  },
  businessBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
    opacity: 0.8,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 20,
    width: '100%',
  },
  detailsList: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textLight,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  footerNote: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  downloadBtn: {
      width: '100%',
      height: 56,
      backgroundColor: colors.primary,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
  },
  downloadBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
  },
  errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  }
});
