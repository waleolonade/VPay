import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../styles/colors';
import billsService from '../../services/billsPaymentService';

export default function BettingScreen({ navigation, route }) {
    const [billers, setBillers] = useState([]);
    const [selectedBookie, setSelectedBookie] = useState(null);
    const [userId, setUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingBillers, setIsFetchingBillers] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    const serviceCharge = 100;
    const fadeAnim = useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        fetchBillers();
    }, []);

    const fetchBillers = async () => {
        setIsFetchingBillers(true);
        try {
            const res = await billsService.getBillers('Betting and Lottery');
            setBillers(res || []);
        } catch (err) {
            console.error('[Betting] Fetch billers error:', err);
        } finally {
            setIsFetchingBillers(false);
        }
    };

    const validateCustomer = async () => {
        if (!selectedBookie || userId.length < 5) return;

        setIsValidating(true);
        try {
            const res = await billsService.validateCustomer({
                billerId: selectedBookie.id,
                customerId: userId,
                divisionId: selectedBookie.division,
                paymentItem: selectedBookie.id,
            });

            if (res.success) {
                setCustomerName(res.data?.customerName || 'Verified Punter');
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else {
                setCustomerName('');
            }
        } catch (err) {
            console.error('[Betting] Validation error:', err);
            setCustomerName('');
        } finally {
            setIsValidating(false);
        }
    };

    const handleContinue = () => {
        if (!selectedBookie) return Alert.alert('Error', 'Please select a bookmaker');
        if (!userId) return Alert.alert('Error', 'Please enter your User ID');
        if (!amount || Number(amount) < 100) return Alert.alert('Error', 'Minimum amount is ₦100');

        navigation.navigate('TransferConfirmation', {
            type: 'betting',
            details: {
                provider: selectedBookie,
                customerId: userId,
                amount: Number(amount),
                serviceCharge,
                total: Number(amount) + serviceCharge,
                billerId: selectedBookie.id,
                billerName: selectedBookie.name,
                division: selectedBookie.division,
                productId: selectedBookie.product,
                customerName,
                walletType: route.params?.walletType || 'personal',
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Betting</Text>
                <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('Transactions')}>
                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Bookmaker Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Bookmaker</Text>
                    {isFetchingBillers ? (
                        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <View style={styles.bookieGrid}>
                            {billers.map((bookie) => (
                                <TouchableOpacity
                                    key={bookie.id}
                                    style={[
                                        styles.bookieCard,
                                        selectedBookie?.id === bookie.id && styles.bookieCardActive
                                    ]}
                                    onPress={() => setSelectedBookie(bookie)}
                                >
                                    <View style={styles.bookieIconContainer}>
                                        <Ionicons
                                            name="trophy"
                                            size={24}
                                            color={selectedBookie?.id === bookie.id ? '#fff' : colors.primary}
                                        />
                                    </View>
                                    <Text style={[styles.bookieName, selectedBookie?.id === bookie.id && styles.bookieTextActive]}>
                                        {bookie.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* User ID */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>User ID / Punter ID</Text>
                    <Input
                        placeholder="Enter your user ID"
                        value={userId}
                        onChangeText={(val) => {
                            setUserId(val);
                            if (val.length >= 8) validateCustomer();
                        }}
                        onBlur={validateCustomer}
                        icon="person-outline"
                        rightContent={
                            isValidating ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : customerName ? (
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            ) : null
                        }
                    />

                    {customerName ? (
                        <Animated.View style={[styles.customerBadge, { opacity: fadeAnim }]}>
                            <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
                            <Text style={styles.customerName}>{customerName}</Text>
                        </Animated.View>
                    ) : null}
                </View>

                {/* Amount */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top-up Amount</Text>
                    <Input
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        icon="cash-outline"
                        leftContent={<Text style={styles.currencyPrefix}>₦</Text>}
                    />
                    <View style={styles.presets}>
                        {[500, 1000, 2000, 5000].map(val => (
                            <TouchableOpacity
                                key={val}
                                style={styles.presetBtn}
                                onPress={() => setAmount(val.toString())}
                            >
                                <Text style={styles.presetText}>₦{val.toLocaleString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Bottom Summary */}
            {amount && selectedBookie && (
                <View style={styles.bottomSummary}>
                    <View style={styles.summaryContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryLabel}>Total Payable</Text>
                            <Text style={styles.summaryAmount}>₦{(Number(amount) + serviceCharge).toLocaleString()}</Text>
                        </View>
                        <Button
                            title="Continue"
                            onPress={handleContinue}
                            style={styles.continueBtn}
                            loading={isLoading}
                        />
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    historyBtn: { padding: 4 },
    scrollContent: { paddingBottom: 120 },
    section: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
    bookieGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    bookieCard: {
        width: '31%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F0F0F0'
    },
    bookieCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '05' },
    bookieIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    bookieName: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
    bookieTextActive: { color: colors.primary },
    customerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: -8,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary
    },
    customerName: { fontSize: 13, fontWeight: '600', color: colors.primary, marginLeft: 6 },
    currencyPrefix: { fontSize: 18, fontWeight: '700', color: colors.text, marginRight: 4 },
    presets: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    presetBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    presetText: { fontSize: 12, fontWeight: '600', color: colors.text },
    bottomSummary: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: colors.textLight },
    summaryAmount: { fontSize: 20, fontWeight: '800', color: colors.primary },
    continueBtn: { width: '45%', marginTop: 0 },
});
