import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { loanService } from '../../services/loanService';
import Button from '../../components/common/Button';

export default function ApplyLoanScreen({ navigation }) {
    const [amount, setAmount] = useState('50000');
    const [duration, setDuration] = useState(3); // months
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [offer, setOffer] = useState(null);

    useEffect(() => {
        fetchOffer();
    }, [amount, duration]);

    const fetchOffer = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 1000) {
            setOffer(null);
            return;
        }
        
        try {
            setCalculating(true);
            const res = await loanService.calculateLoan(numAmount, duration);
            if (res.success) {
                setOffer(res.data);
            }
        } catch (error) {
            console.error('Error calculating loan:', error);
        } finally {
            setCalculating(false);
        }
    };

    const handleApply = async () => {
        if (!amount || !purpose) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const res = await loanService.applyLoan({
                amount: parseFloat(amount),
                duration,
                purpose,
                pin: '1234' // Placeholder PIN, should prompt user
            });

            if (res.success) {
                Alert.alert('Success', 'Your loan has been disbursed successfully!', [
                    { text: 'OK', onPress: () => navigation.navigate('Loans') }
                ]);
            } else {
                Alert.alert('Error', res.message || 'Loan application failed');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Apply for Loan</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionLabel}>How much do you need?</Text>
                <View style={styles.inputWrapper}>
                    <Text style={styles.currencyPrefix}>₦</Text>
                    <TextInput
                        style={styles.amountInput}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="0"
                    />
                </View>

                <View style={styles.durationRow}>
                    {[1, 3, 6, 12].map(m => (
                        <TouchableOpacity 
                            key={m} 
                            style={[styles.durationItem, duration === m && styles.durationItemSelected]}
                            onPress={() => setDuration(m)}
                        >
                            <Text style={[styles.durationText, duration === m && styles.durationTextSelected]}>{m} Months</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {calculating ? (
                    <View style={styles.calcBox}>
                        <ActivityIndicator color={colors.primary} />
                        <Text style={styles.calcText}>Calculating your offer...</Text>
                    </View>
                ) : offer && (
                    <View style={styles.offerBox}>
                        <View style={styles.offerRow}>
                             <Text style={styles.offerLabel}>Total Repayable</Text>
                             <Text style={styles.offerValue}>₦{offer.totalRepayable.toLocaleString()}</Text>
                        </View>
                        <View style={styles.offerRow}>
                             <Text style={styles.offerLabel}>Monthly Interest</Text>
                             <Text style={styles.offerValue}>{offer.interestRate}%</Text>
                        </View>
                        <View style={styles.offerDivider} />
                        <Text style={styles.scheduleTitle}>Repayment Schedule</Text>
                        {offer.schedule.map((item, index) => (
                            <View key={index} style={styles.scheduleItem}>
                                <Text style={styles.scheduleMonth}>Month {item.month}</Text>
                                <Text style={styles.scheduleAmount}>₦{item.amount.toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>What's the purpose?</Text>
                <TextInput
                    style={styles.purposeInput}
                    value={purpose}
                    onChangeText={setPurpose}
                    placeholder="e.g. Business expansion, Medical bills"
                    multiline
                />

                <Button 
                    title={loading ? "Processing..." : "Submit Application"} 
                    onPress={handleApply}
                    disabled={loading || !offer}
                    style={styles.submitButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4FF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    scrollContent: {
        padding: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textLight,
        marginBottom: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingBottom: 8,
        marginBottom: 24,
    },
    currencyPrefix: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        marginRight: 8,
    },
    amountInput: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        flex: 1,
    },
    durationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    durationItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#F7F9FC',
        borderWidth: 1,
        borderColor: '#E1E9F6',
    },
    durationItemSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    durationText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
    durationTextSelected: {
        color: '#fff',
    },
    calcBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F7F9FC',
        borderRadius: 16,
    },
    calcText: {
        marginLeft: 10,
        fontSize: 14,
        color: colors.textLight,
    },
    offerBox: {
        backgroundColor: '#F0F4FF',
        borderRadius: 20,
        padding: 20,
    },
    offerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    offerLabel: {
        fontSize: 14,
        color: colors.textLight,
    },
    offerValue: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    offerDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 12,
    },
    scheduleTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 12,
    },
    scheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    scheduleMonth: {
        fontSize: 13,
        color: colors.textLight,
    },
    scheduleAmount: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
    purposeInput: {
        backgroundColor: '#F7F9FC',
        borderRadius: 16,
        padding: 16,
        height: 100,
        fontSize: 15,
        color: colors.text,
        textAlignVertical: 'top',
        marginBottom: 32,
    },
    submitButton: {
        borderRadius: 16,
        height: 56,
    },
});
