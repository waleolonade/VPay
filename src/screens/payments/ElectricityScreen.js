import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../styles/colors';
import billsService from '../../services/billsPaymentService';

export default function ElectricityScreen({ navigation, route }) {
    const [billers, setBillers] = useState([]);
    const [selectedDisco, setSelectedDisco] = useState(null);
    const [items, setItems] = useState([]);
    const [meterNumber, setMeterNumber] = useState('');
    const [meterType, setMeterType] = useState('PREPAID'); // 'PREPAID' or 'POSTPAID'
    const [amount, setAmount] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingBillers, setIsFetchingBillers] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isItemsLoading, setIsItemsLoading] = useState(false);

    const serviceCharge = 100;
    const fadeAnim = useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        fetchBillers();
    }, []);

    useEffect(() => {
        if (selectedDisco) {
            fetchItems();
            setCustomerName(''); // Reset validation when DISCO changes
        }
    }, [selectedDisco]);

    const fetchBillers = async () => {
        setIsFetchingBillers(true);
        try {
            const res = await billsService.getBillers('Utility');
            setBillers(res || []);
        } catch (err) {
            console.error('[Electricity] Fetch billers error:', err);
        } finally {
            setIsFetchingBillers(false);
        }
    };

    const fetchItems = async () => {
        if (!selectedDisco) return;
        setIsItemsLoading(true);
        try {
            const res = await billsService.getBillerItems(
                selectedDisco.id,
                selectedDisco.division,
                selectedDisco.product
            );
            setItems(res || []);
        } catch (err) {
            console.error('[Electricity] Fetch items error:', err);
        } finally {
            setIsItemsLoading(false);
        }
    };

    const validateCustomer = async () => {
        if (!selectedDisco || meterNumber.length < 5) return;

        // Find the correct item based on meterType
        const selectedItem = items.find(item =>
            (item.name || item.paymentitemname || '').toUpperCase().includes(meterType)
        ) || items[0];

        setIsValidating(true);
        try {
            const res = await billsService.validateCustomer({
                billerId: selectedDisco.id,
                customerId: meterNumber,
                divisionId: selectedDisco.division,
                paymentItem: selectedItem?.paymentCode || selectedDisco.id,
            });

            if (res.success) {
                setCustomerName(res.data?.customerName || 'Verified Account');
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else {
                setCustomerName('');
            }
        } catch (err) {
            console.error('[Electricity] Validation error:', err);
            setCustomerName('');
        } finally {
            setIsValidating(false);
        }
    };

    const handleContinue = () => {
        if (!selectedDisco) return Alert.alert('Error', 'Please select a DISCO');
        if (!meterNumber) return Alert.alert('Error', 'Please enter your Meter Number');
        if (!amount || Number(amount) < 1000) return Alert.alert('Error', 'Minimum amount is ₦1,000');

        const selectedItem = items.find(item =>
            (item.name || item.paymentitemname || '').toUpperCase().includes(meterType)
        ) || items[0];

        navigation.navigate('TransferConfirmation', {
            type: 'electricity',
            details: {
                provider: selectedDisco,
                customerId: meterNumber,
                meterType,
                amount: Number(amount),
                serviceCharge,
                total: Number(amount) + serviceCharge,
                billerId: selectedDisco.id,
                billerName: selectedDisco.name,
                division: selectedDisco.division,
                productId: selectedDisco.product,
                paymentItem: selectedItem?.paymentCode || selectedDisco.id,
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
                <Text style={styles.headerTitle}>Electricity</Text>
                <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('Transactions')}>
                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* DISCO Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Provider</Text>
                    {isFetchingBillers ? (
                        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoList}>
                            {billers.map((disco) => (
                                <TouchableOpacity
                                    key={disco.id}
                                    style={[
                                        styles.discoCard,
                                        selectedDisco?.id === disco.id && styles.discoCardActive
                                    ]}
                                    onPress={() => setSelectedDisco(disco)}
                                >
                                    <View style={styles.discoIconContainer}>
                                        <Ionicons
                                            name="flash"
                                            size={24}
                                            color={selectedDisco?.id === disco.id ? '#fff' : colors.primary}
                                        />
                                    </View>
                                    <Text
                                        style={[styles.discoName, selectedDisco?.id === disco.id && styles.discoTextActive]}
                                        numberOfLines={2}
                                    >
                                        {disco.name.replace(' Electric', '').replace(' PLC', '')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Meter Details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Meter Details</Text>
                        <View style={styles.typeSelector}>
                            {['PREPAID', 'POSTPAID'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeOption, meterType === type && styles.typeOptionActive]}
                                    onPress={() => {
                                        setMeterType(type);
                                        setCustomerName('');
                                    }}
                                >
                                    <Text style={[styles.typeOptionText, meterType === type && styles.typeOptionTextActive]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Input
                        placeholder="Enter Meter Number"
                        keyboardType="numeric"
                        value={meterNumber}
                        onChangeText={(val) => {
                            setMeterNumber(val);
                            if (val.length >= 10) validateCustomer();
                        }}
                        onBlur={validateCustomer}
                        icon="flash-outline"
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
                    <Text style={styles.sectionTitle}>Amount</Text>
                    <Input
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        icon="cash-outline"
                        leftContent={<Text style={styles.currencyPrefix}>₦</Text>}
                    />
                    <View style={styles.presets}>
                        {[2000, 5000, 10000, 20000].map(val => (
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
            {amount && selectedDisco && (
                <View style={styles.bottomSummary}>
                    <View style={styles.summaryContent}>
                        <View>
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
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
    discoList: { paddingRight: 16 },
    discoCard: {
        width: 100,
        height: 110,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
        justifyContent: 'center'
    },
    discoCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '05' },
    discoIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    discoName: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
    discoTextActive: { color: colors.primary },
    typeSelector: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 8, padding: 2 },
    typeOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    typeOptionActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    typeOptionText: { fontSize: 11, fontWeight: '700', color: colors.textLight },
    typeOptionTextActive: { color: colors.primary },
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
