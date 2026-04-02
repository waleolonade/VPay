import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../styles/colors';
import billsService from '../../services/billsPaymentService';

export default function InternetScreen({ navigation, route }) {
    const [billers, setBillers] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [customerId, setCustomerId] = useState('');
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingBillers, setIsFetchingBillers] = useState(false);
    const [isPlansLoading, setIsPlansLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    const serviceCharge = 100;
    const fadeAnim = useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        fetchBillers();
    }, []);

    useEffect(() => {
        if (selectedProvider) {
            fetchPlans();
            setCustomerName(''); // Reset validation
        }
    }, [selectedProvider]);

    const fetchBillers = async () => {
        setIsFetchingBillers(true);
        try {
            const res = await billsService.getBillers('Internet Subscription');
            setBillers(res || []);
        } catch (err) {
            console.error('[Internet] Fetch billers error:', err);
        } finally {
            setIsFetchingBillers(false);
        }
    };

    const fetchPlans = async () => {
        if (!selectedProvider) return;
        setIsPlansLoading(true);
        try {
            const res = await billsService.getBillerItems(
                selectedProvider.id,
                selectedProvider.division,
                selectedProvider.product
            );
            setPlans(res || []);
            setSelectedPlan(null);
        } catch (err) {
            console.error('[Internet] Fetch plans error:', err);
        } finally {
            setIsPlansLoading(false);
        }
    };

    const validateCustomer = async () => {
        if (!selectedProvider || customerId.length < 5 || !selectedPlan) return;

        setIsValidating(true);
        try {
            const res = await billsService.validateCustomer({
                billerId: selectedProvider.id,
                customerId: customerId,
                divisionId: selectedProvider.division,
                paymentItem: selectedPlan.paymentCode,
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
            console.error('[Internet] Validation error:', err);
            setCustomerName('');
        } finally {
            setIsValidating(false);
        }
    };

    const handleContinue = () => {
        if (!selectedProvider) return Alert.alert('Error', 'Please select a provider');
        if (!customerId) return Alert.alert('Error', 'Please enter your Account/User ID');
        if (!selectedPlan) return Alert.alert('Error', 'Please select a plan');

        navigation.navigate('TransferConfirmation', {
            type: 'internet_subscription',
            details: {
                provider: selectedProvider,
                customerId: customerId,
                plan: selectedPlan,
                amount: Number(selectedPlan.amount),
                serviceCharge,
                total: Number(selectedPlan.amount) + serviceCharge,
                billerId: selectedProvider.id,
                billerName: selectedProvider.name,
                division: selectedProvider.division,
                productId: selectedProvider.product,
                paymentItem: selectedPlan.paymentCode,
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
                <Text style={styles.headerTitle}>Internet Subscription</Text>
                <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('Transactions')}>
                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Provider Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Provider</Text>
                    {isFetchingBillers ? (
                        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <View style={styles.providerGrid}>
                            {billers.map((provider) => (
                                <TouchableOpacity
                                    key={provider.id}
                                    style={[
                                        styles.providerCard,
                                        selectedProvider?.id === provider.id && styles.providerCardActive
                                    ]}
                                    onPress={() => setSelectedProvider(provider)}
                                >
                                    <View style={styles.providerIconContainer}>
                                        <Ionicons
                                            name="globe"
                                            size={24}
                                            color={selectedProvider?.id === provider.id ? '#fff' : colors.primary}
                                        />
                                    </View>
                                    <Text style={[styles.providerName, selectedProvider?.id === provider.id && styles.providerTextActive]}>
                                        {provider.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Account ID */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account / User ID</Text>
                    <Input
                        placeholder="Enter account number or ID"
                        value={customerId}
                        onChangeText={(val) => {
                            setCustomerId(val);
                            if (val.length >= 8 && selectedPlan) validateCustomer();
                        }}
                        onBlur={validateCustomer}
                        icon="at-outline"
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

                {/* Plan Selection */}
                {selectedProvider && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Subscription Plan</Text>
                        {isPlansLoading ? (
                            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.planList}>
                                {plans.map(plan => (
                                    <TouchableOpacity
                                        key={plan.paymentCode}
                                        style={[
                                            styles.planCard,
                                            selectedPlan?.paymentCode === plan.paymentCode && styles.planCardActive
                                        ]}
                                        onPress={() => {
                                            setSelectedPlan(plan);
                                            if (customerId.length >= 8) validateCustomer();
                                        }}
                                    >
                                        <View style={styles.planInfo}>
                                            <Text style={[styles.planName, selectedPlan?.paymentCode === plan.paymentCode && styles.planTextActive]}>
                                                {plan.name || plan.paymentitemname}
                                            </Text>
                                        </View>
                                        <Text style={[styles.planAmount, selectedPlan?.paymentCode === plan.paymentCode && styles.planTextActive]}>
                                            ₦{Number(plan.amount).toLocaleString()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Sticky Bottom Summary */}
            {selectedPlan && selectedProvider && (
                <View style={styles.bottomSummary}>
                    <View style={styles.summaryContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryLabel}>Total Payable</Text>
                            <Text style={styles.summaryAmount}>₦{(Number(selectedPlan.amount) + serviceCharge).toLocaleString()}</Text>
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
    providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    providerCard: {
        width: '31%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F0F0F0'
    },
    providerCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '05' },
    providerIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    providerName: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
    providerTextActive: { color: colors.primary },
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
    planList: { gap: 12 },
    planCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        backgroundColor: '#fff'
    },
    planCardActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    planInfo: { flex: 1, marginRight: 12 },
    planName: { fontSize: 14, fontWeight: '600', color: colors.text },
    planAmount: { fontSize: 15, fontWeight: '700', color: colors.primary },
    planTextActive: { color: '#fff' },
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
