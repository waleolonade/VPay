import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '../../../styles/colors';
import Header from '../../../components/common/Header';
import { bankService } from '../../../services/bankService';
import { cardService } from '../../../services/cardService';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button';

export default function CardsScreen({ navigation }) {
    const isFocused = useIsFocused();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [banks, setBanks] = useState([]);
    const [vpayCards, setVpayCards] = useState([]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [bankRes, cardRes] = await Promise.all([
                bankService.getSavedBanksAndCards(),
                cardService.getCards()
            ]);

            if (bankRes?.success) {
                setBanks(bankRes.data?.banks || []);
            }
            if (cardRes?.success) {
                setVpayCards(cardRes.data || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused, fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleRequestVirtual = async () => {
        Alert.alert(
            'Request Virtual Card',
            'A ₦1,000 issuance fee applies for virtual cards. Proceed?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Proceed', 
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const res = await cardService.requestVirtualCard('Verve');
                            if (res.success) {
                                Alert.alert('Success', 'Your virtual card has been issued!');
                                fetchData();
                            } else {
                                Alert.alert('Error', res.message || 'Issuance failed');
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Insufficient balance or network error');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const activeVCard = vpayCards.find(c => c.cardType === 'virtual' && c.is_active);

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Cards & Bank Accounts" onBackPress={() => navigation.goBack()} />

            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            >
                {/* 1. Main VPay Card Preview */}
                {activeVCard ? (
                    <View style={styles.cardPreview}>
                        <View style={styles.visaHeader}>
                            <Text style={styles.bankName}>VPAY VIRTUAL</Text>
                            <Text style={styles.visaText}>VERVE</Text>
                        </View>
                        <Ionicons name="hardware-chip" size={32} color="#fcb900" style={styles.chip} />
                        <Text style={styles.cardNumber}>••••  ••••  ••••  {activeVCard.last4}</Text>
                        <View style={styles.cardFooter}>
                            <View>
                                <Text style={styles.cardLabel}>CARD HOLDER</Text>
                                <Text style={styles.cardValue}>{user?.firstName} {user?.lastName}</Text>
                            </View>
                            <View>
                                <Text style={styles.cardLabel}>EXPIRES</Text>
                                <Text style={styles.cardValue}>{activeVCard.expiryMonth}/{activeVCard.expiryYear}</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.emptyCardPrompt} onPress={handleRequestVirtual}>
                         <View style={styles.promptIconBox}>
                            <Ionicons name="add" size={32} color={colors.primary} />
                         </View>
                         <Text style={styles.promptTitle}>Get a VPay Virtual Card</Text>
                         <Text style={styles.promptSub}>Pay securely on Netflix, Amazon, etc.</Text>
                    </TouchableOpacity>
                )}

                {/* 2. Management Sections */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Manage Cards</Text>
                </View>
                <View style={styles.actionsBox}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleRequestVirtual}>
                        <Ionicons name="card" size={24} color={colors.primary} />
                        <Text style={styles.actionText}>Get New Virtual Card</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="card-outline" size={24} color={colors.primary} />
                        <Text style={styles.actionText}>Request Physical Card</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Linked external bank accounts</Text>
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                ) : banks.length > 0 ? (
                    <View style={styles.accountsList}>
                        {banks.map((item) => (
                            <View key={item.id} style={styles.accountCard}>
                                <View style={styles.bankIconBg}>
                                    <MaterialCommunityIcons name="bank" size={20} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.accountName}>{item.accountName}</Text>
                                    <Text style={styles.accountSub}>{item.bankName} • {item.accountNumber}</Text>
                                </View>
                                {item.isDefault && (
                                    <View style={styles.defaultBadge}>
                                        <Text style={styles.defaultText}>Default</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <TouchableOpacity style={styles.emptyAccounts} onPress={() => navigation.navigate('LinkBankAccount')}>
                        <Text style={styles.emptyAccountsText}>+ Add external bank account</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={[styles.actionBtn, styles.linkExternalBtn]} 
                    onPress={() => navigation.navigate('LinkBankAccount')}
                >
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                    <Text style={styles.actionText}>Link Another Bank</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20 },
    cardPreview: { backgroundColor: '#0f172a', borderRadius: 24, padding: 24, height: 210, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15, justifyContent: 'space-between', marginBottom: 30 },
    visaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bankName: { color: '#fff', fontWeight: '800', letterSpacing: 1, fontSize: 13 },
    visaText: { color: '#fff', fontSize: 18, fontStyle: 'italic', fontWeight: '900', letterSpacing: 1 },
    chip: { marginTop: -10 },
    cardNumber: { color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 3, fontFamily: 'monospace' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 4, letterSpacing: 1 },
    cardValue: { color: '#fff', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
    
    emptyCardPrompt: { height: 210, borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', marginBottom: 30 },
    promptIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    promptTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
    promptSub: { fontSize: 13, color: colors.textLight },

    sectionHeader: { marginBottom: 12 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
    
    accountsList: { marginBottom: 10 },
    accountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    bankIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    accountName: { fontSize: 15, fontWeight: '700', color: colors.text },
    accountSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    defaultBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    defaultText: { fontSize: 10, fontWeight: '700', color: '#10b981' },

    emptyAccounts: { padding: 20, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, marginBottom: 10 },
    emptyAccountsText: { color: colors.primary, fontWeight: '700' },

    actionsBox: { backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
    actionText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 16 },
    linkExternalBtn: { backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 8 },
});
