import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../styles/colors';
import billsService from '../../services/billsPaymentService';

export default function CableTVScreen({ navigation, route }) {
    const [billers, setBillers] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [smartCardNumber, setSmartCardNumber] = useState('');
    const [packages, setPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingBillers, setIsFetchingBillers] = useState(false);
    const [isPackagesLoading, setIsPackagesLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    const serviceCharge = 100;
    const fadeAnim = useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        fetchBillers();
    }, []);

    useEffect(() => {
        if (selectedProvider) {
            fetchPackages();
            setCustomerName(''); // Reset validation
        }
    }, [selectedProvider]);

    const fetchBillers = async () => {
        setIsFetchingBillers(true);
        try {
            const res = await billsService.getBillers('Cable TV');
            setBillers(res || []);
        } catch (err) {
            console.error('[CableTV] Fetch billers error:', err);
        } finally {
            setIsFetchingBillers(false);
        }
    };

    const fetchPackages = async () => {
        if (!selectedProvider) return;
        setIsPackagesLoading(true);
        try {
            const res = await billsService.getBillerItems(
                selectedProvider.id,
                selectedProvider.division,
                selectedProvider.product
            );
            setPackages(res || []);
            setSelectedPackage(null);
        } catch (err) {
            console.error('[CableTV] Fetch packages error:', err);
        } finally {
            setIsPackagesLoading(false);
        }
    };

    const validateCustomer = async () => {
        if (!selectedProvider || smartCardNumber.length < 5 || !selectedPackage) return;

        setIsValidating(true);
        try {
            const res = await billsService.validateCustomer({
                billerId: selectedProvider.id,
                customerId: smartCardNumber,
                divisionId: selectedProvider.division,
                paymentItem: selectedPackage.paymentCode,
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
            console.error('[CableTV] Validation error:', err);
            setCustomerName('');
        } finally {
            setIsValidating(false);
        }
    };

    const handleContinue = () => {
        if (!selectedProvider) return Alert.alert('Error', 'Please select a provider');
        if (!smartCardNumber) return Alert.alert('Error', 'Please enter your SmartCard/IUC number');
        if (!selectedPackage) return Alert.alert('Error', 'Please select a package');

        navigation.navigate('TransferConfirmation', {
            type: 'cable_tv',
            details: {
                provider: selectedProvider,
                customerId: smartCardNumber,
                plan: selectedPackage,
                amount: Number(selectedPackage.amount),
                serviceCharge,
                total: Number(selectedPackage.amount) + serviceCharge,
                billerId: selectedProvider.id,
                billerName: selectedProvider.name,
                division: selectedProvider.division,
                productId: selectedProvider.product,
                paymentItem: selectedPackage.paymentCode,
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
                <Text style={styles.headerTitle}>Cable TV</Text>
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
                                            name="tv"
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

                {/* Decoder Number */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SmartCard / IUC Number</Text>
                    <Input
                        placeholder="Enter decoder number"
                        keyboardType="numeric"
                        value={smartCardNumber}
                        onChangeText={(val) => {
                            setSmartCardNumber(val);
                            if (val.length >= 10 && selectedPackage) validateCustomer();
                        }}
                        onBlur={validateCustomer}
                        icon="card-outline"
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

                {/* Package Selection */}
                {selectedProvider && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Package</Text>
                        {isPackagesLoading ? (
                            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.packageList}>
                                {packages.map(pkg => (
                                    <TouchableOpacity
                                        key={pkg.paymentCode}
                                        style={[
                                            styles.packageCard,
                                            selectedPackage?.paymentCode === pkg.paymentCode && styles.packageCardActive
                                        ]}
                                        onPress={() => {
                                            setSelectedPackage(pkg);
                                            if (smartCardNumber.length >= 10) validateCustomer();
                                        }}
                                    >
                                        <View style={styles.packageInfo}>
                                            <Text style={[styles.packageName, selectedPackage?.paymentCode === pkg.paymentCode && styles.packageTextActive]}>
                                                {pkg.name || pkg.paymentitemname}
                                            </Text>
                                        </View>
                                        <Text style={[styles.packageAmount, selectedPackage?.paymentCode === pkg.paymentCode && styles.packageTextActive]}>
                                            ₦{Number(pkg.amount).toLocaleString()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Sticky Bottom Summary */}
            {selectedPackage && selectedProvider && (
                <View style={styles.bottomSummary}>
                    <View style={styles.summaryContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryLabel}>Total Payable</Text>
                            <Text style={styles.summaryAmount}>₦{(Number(selectedPackage.amount) + serviceCharge).toLocaleString()}</Text>
                        </View>
                        <Button
                            title="Pay Now"
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
    providerGrid: { flexDirection: 'row', justifyContent: 'space-between' },
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
    packageList: { gap: 12 },
    packageCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        backgroundColor: '#fff'
    },
    packageCardActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    packageInfo: { flex: 1, marginRight: 12 },
    packageName: { fontSize: 14, fontWeight: '600', color: colors.text },
    packageAmount: { fontSize: 15, fontWeight: '700', color: colors.primary },
    packageTextActive: { color: '#fff' },
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
