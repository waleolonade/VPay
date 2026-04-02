import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from '../../styles/colors';
import Button from '../../components/common/Button';
import { transactionService } from '../../services/transactionService';

/**
 * TransactionDetailScreen
 * Professional view for individual transaction details.
 * Supports PDF Receipt generation and real-time database fetching.
 */
export default function TransactionDetailScreen({ route, navigation }) {
    const { transactionId, reference } = route.params || {};
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchTransactionDetails();
    }, [transactionId, reference]);

    const fetchTransactionDetails = async () => {
        setLoading(true);
        try {
            let data;
            if (reference) {
                const res = await transactionService.getTransactionByReference(reference);
                data = res.data;
            } else if (transactionId) {
                const res = await transactionService.getTransactionByReference(transactionId);
                data = res.data;
            }

            if (data) {
                setTransaction({
                    ...data,
                    rawData: data,
                    title: data.category === 'bill' ? `${data.description || 'Bill Payment'}` : data.description || 'Transfer',
                    date: new Date(data.created_at || data.completed_at).toLocaleString(),
                    amount: parseFloat(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                    type: data.type || 'debit',
                    status: data.status || 'completed',
                    reference: data.reference,
                    category: data.category?.charAt(0).toUpperCase() + data.category?.slice(1) || 'General',
                    recipient: data.recipient_name || 'N/A'
                });
            }
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
            Alert.alert('Error', 'Failed to load transaction details.');
        } finally {
            setLoading(false);
        }
    };

    const generateReceiptPDF = async () => {
        if (!transaction) return;
        setIsExporting(true);

        const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 32px; font-weight: bold; color: ${colors.primary}; }
            .title { font-size: 18px; color: #666; margin-top: 10px; }
            .amount-box { text-align: center; margin: 40px 0; padding: 20px; background: #f9f9f9; border-radius: 10px; }
            .amount { font-size: 36px; font-weight: 800; color: ${transaction.type === 'debit' ? '#D32F2F' : '#2E7D32'}; }
            .details { width: 100%; border-collapse: collapse; }
            .details td { padding: 15px 0; border-bottom: 1px solid #f0f0f0; }
            .label { color: #888; font-size: 14px; }
            .value { text-align: right; font-weight: 600; font-size: 15px; }
            .footer { margin-top: 60px; text-align: center; color: #aaa; font-size: 12px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; background: #E8F5E9; color: #2E7D32; font-weight: bold; font-size: 12px; margin-top: 10px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">VPay</div>
            <div class="title">Transaction Receipt</div>
            <div class="status">${transaction.status}</div>
          </div>

          <div class="amount-box">
            <div class="label">Total Amount</div>
            <div class="amount">₦${transaction.amount}</div>
          </div>

          <table class="details">
            <tr><td class="label">Transaction Type</td><td class="value">${transaction.category}</td></tr>
            <tr><td class="label">Description</td><td class="value">${transaction.title}</td></tr>
            <tr><td class="label">Recipient / Biller</td><td class="value">${transaction.recipient}</td></tr>
            <tr><td class="label">Date & Time</td><td class="value">${transaction.date}</td></tr>
            <tr><td class="label">Reference ID</td><td class="value">${transaction.reference}</td></tr>
          </table>

          <div class="footer">
            <p>Thank you for using VPay!</p>
            <p>This is a computer-generated receipt and requires no signature.</p>
          </div>
        </body>
      </html>
    `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate receipt PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleRepeatTransaction = () => {
        if (!transaction || !transaction.rawData) return;
        const raw = transaction.rawData;
        const cat = raw.category?.toLowerCase() || '';

        if (cat === 'airtime') {
            navigation.navigate('Airtime', {
                phoneNumber: raw.recipient_phone || raw.metadata?.phone || raw.recipient?.phone || '',
                amount: raw.amount
            });
        } else if (cat === 'data') {
            navigation.navigate('Data', {
                phoneNumber: raw.recipient_phone || raw.metadata?.phone || raw.recipient?.phone || ''
            });
        } else if (cat === 'transfer' || cat === 'vpay_transfer') {
            navigation.navigate('SendMoney', {
                accountNumber: raw.recipient_account || raw.recipient?.accountNumber || raw.metadata?.accountNumber || '',
                amount: raw.amount,
                bankCode: raw.recipient_bank_code || raw.recipient?.bankCode || raw.metadata?.bankCode || '',
                bankName: raw.recipient_bank_name || raw.recipient?.bankName || raw.metadata?.bankName || '',
                accountName: raw.recipient_name || raw.recipient?.accountName || raw.metadata?.accountName || raw.metadata?.recipientName || ''
            });
        } else if (cat === 'bill') {
            navigation.navigate('Bills');
        } else {
            Alert.alert('Info', 'Repeat is not supported for this transaction type yet.');
        }
    };

    const DetailRow = ({ label, value, isLast }) => (
        <View style={[styles.detailRow, isLast && styles.noBorder]}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || 'N/A'}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loaderText}>Loading details...</Text>
            </View>
        );
    }

    if (!transaction) {
        return (
            <View style={styles.loaderContainer}>
                <Text style={styles.loaderText}>Transaction not found.</Text>
                <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={[styles.amountValue, { color: transaction.type === 'credit' ? colors.success : colors.danger }]}>
                        {transaction.type === 'debit' ? '-' : '+'} ₦{transaction.amount}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: transaction.status === 'completed' ? '#E8F5E9' : '#FFF3E0' }]}>
                        <Text style={[styles.statusText, { color: transaction.status === 'completed' ? '#2E7D32' : '#EF6C00' }]}>
                            {transaction.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailsCard}>
                    <DetailRow label="Transaction Type" value={transaction.category} />
                    <DetailRow label="Description" value={transaction.title} />
                    <DetailRow label="Recipient / Biller" value={transaction.recipient} />
                    <DetailRow label="Date & Time" value={transaction.date} />
                    <DetailRow label="Reference ID" value={transaction.reference} isLast={true} />
                </View>

                <View style={styles.actions}>
                    <Button
                        title={isExporting ? "Generating..." : "Download Receipt"}
                        onPress={generateReceiptPDF}
                        style={styles.actionButton}
                        disabled={isExporting}
                    />
                    <Button
                        title="Repeat Transaction"
                        type="outline"
                        onPress={handleRepeatTransaction}
                        style={styles.actionButton}
                    />
                    <Button
                        title="Back to Home"
                        type="text"
                        onPress={() => navigation.navigate('Home')}
                        style={styles.actionButton}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.lightBg,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loaderText: {
        marginTop: 12,
        color: colors.textLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    content: {
        padding: 16,
    },
    amountCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    amountLabel: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightBg,
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    detailLabel: {
        fontSize: 14,
        color: colors.textLight,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        maxWidth: '70%',
        textAlign: 'right',
    },
    actions: {
        gap: 12,
    },
    actionButton: {
        width: '100%',
    },
});
