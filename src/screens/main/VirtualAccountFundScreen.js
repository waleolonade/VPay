import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../styles/colors';
import { walletService } from '../../services/walletService';
import Button from '../../components/common/Button';

export default function VirtualAccountFundScreen({ navigation }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [accountData, setAccountData] = useState(null);

    const handleGenerate = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount.');
            return;
        }

        setLoading(true);
        try {
            const res = await walletService.generateVirtualAccount(Number(amount));
            if (res.data.success) {
                setAccountData(res.data.data);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text, label) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied', `${label} copied to clipboard!`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fund Wallet</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                    <Text style={styles.infoText}>
                        Generate a temporary virtual account number to instantly fund your wallet via bank transfer.
                    </Text>
                </View>

                {!accountData ? (
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Amount to Fund (₦)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 5000"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <Button 
                            title={loading ? "Generating..." : "Generate Account Number"} 
                            onPress={handleGenerate}
                            disabled={loading || !amount}
                            style={styles.submitButton}
                        />
                    </View>
                ) : (
                    <View style={styles.resultContainer}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={60} color={colors.success} />
                        </View>
                        <Text style={styles.successTitle}>Account Generated!</Text>
                        <Text style={styles.successDesc}>
                            Please transfer exactly <Text style={styles.boldText}>₦{accountData.amount}</Text> to the account below within the next hour.
                        </Text>

                        <View style={styles.accountCard}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Bank Name</Text>
                                <Text style={styles.detailValue}>{accountData.bankName}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Account Number</Text>
                                <View style={styles.copyRow}>
                                    <Text style={styles.accountNumber}>{accountData.accountNumber}</Text>
                                    <TouchableOpacity onPress={() => copyToClipboard(accountData.accountNumber, 'Account Number')}>
                                        <Ionicons name="copy-outline" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Valid For</Text>
                                <Text style={styles.detailValue}>{accountData.validityMinutes} Minutes</Text>
                            </View>
                        </View>

                        <Text style={styles.warningText}>
                            Note: This account number is temporary and will expire! Do not save it for future use.
                        </Text>

                        <Button 
                            title="Done" 
                            type="outline"
                            onPress={() => navigation.navigate('Wallet')}
                            style={{marginTop: 20}}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.lightBg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: 20 },
    infoBox: {
        flexDirection: 'row', backgroundColor: `${colors.primary}10`, padding: 16,
        borderRadius: 12, alignItems: 'center', marginBottom: 24, gap: 12
    },
    infoText: { flex: 1, color: colors.primary, fontSize: 14, lineHeight: 20 },
    formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 24, fontWeight: '600', color: colors.text },
    submitButton: { width: '100%' },
    resultContainer: { alignItems: 'center', marginTop: 10 },
    successIcon: { marginBottom: 15 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
    successDesc: { textAlign: 'center', color: colors.textMed, fontSize: 15, lineHeight: 22, paddingHorizontal: 20, marginBottom: 30 },
    boldText: { fontWeight: 'bold', color: colors.text },
    accountCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, marginBottom: 20 },
    detailRow: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 15 },
    detailLabel: { fontSize: 13, color: colors.textLight, marginBottom: 5 },
    detailValue: { fontSize: 16, fontWeight: '600', color: colors.text },
    copyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    accountNumber: { fontSize: 22, fontWeight: 'bold', color: colors.primary, letterSpacing: 2 },
    warningText: { textAlign: 'center', color: colors.danger, fontSize: 13, paddingHorizontal: 20, marginTop: 10 },
});
