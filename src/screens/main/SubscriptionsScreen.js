import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import subscriptionService from '../../services/subscriptionService';

export default function SubscriptionsScreen({ navigation }) {
    const [subscriptions, setSubscriptions] = useState([]);
    const [monthlyTotal, setMonthlyTotal] = useState('0.00');
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [serviceName, setServiceName] = useState('');
    const [amount, setAmount] = useState('');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [nextDate, setNextDate] = useState('');

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const res = await subscriptionService.getSubscriptions();
            setSubscriptions(res.data.subscriptions);
            setMonthlyTotal(res.data.monthlyTotal);
        } catch (error) {
            // fail silent on load
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleAdd = async () => {
        if (!serviceName || !amount || !nextDate) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        try {
            await subscriptionService.createSubscription({
                serviceName,
                amount: parseFloat(amount),
                billingCycle,
                nextBillingDate: nextDate
            });
            setModalVisible(false);
            fetchSubscriptions();
            Alert.alert('Success', 'Subscription tracked!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to add subscription');
        }
    };

    const handleCancel = (id) => {
        Alert.alert('Cancel Subscription?', 'Are you sure you want to stop tracking this subscription?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await subscriptionService.cancelSubscription(id);
                        fetchSubscriptions();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to cancel');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                    <Ionicons name="receipt-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                    <Text style={styles.billingCycle}>{item.billingCycle} • Next: {new Date(item.nextBillingDate).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.amount}>₦{parseFloat(item.amount).toLocaleString()}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                    <Text style={styles.cancelText}>Cancel Track</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Estimated Monthly Spend</Text>
                <Text style={styles.summaryTotal}>₦{parseFloat(monthlyTotal).toLocaleString()}</Text>
            </View>

            <FlatList
                data={subscriptions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSubscriptions} tintColor={colors.primary} />}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
                            <Text style={styles.emptyText}>No Active Subscriptions</Text>
                            <Text style={styles.emptySub}>Track your Netflix, Spotify, and more!</Text>
                        </View>
                    )
                }
            />

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Track Subscription</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput style={styles.input} placeholder="Service Name (e.g. Netflix)" value={serviceName} onChangeText={setServiceName} />
                        <TextInput style={styles.input} placeholder="Amount (₦)" keyboardType="numeric" value={amount} onChangeText={setAmount} />

                        <View style={styles.cycleRow}>
                            {['weekly', 'monthly', 'yearly'].map(cycle => (
                                <TouchableOpacity
                                    key={cycle}
                                    style={[styles.cycleBtn, billingCycle === cycle && styles.cycleBtnActive]}
                                    onPress={() => setBillingCycle(cycle)}
                                >
                                    <Text style={[styles.cycleText, billingCycle === cycle && styles.cycleTextActive]}>{cycle}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput style={styles.input} placeholder="Next Billing Date (YYYY-MM-DD)" value={nextDate} onChangeText={setNextDate} />

                        <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                            <Text style={styles.submitText}>Save Subscription</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    summaryBox: { backgroundColor: colors.primary, padding: 25, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center' },
    summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
    summaryTotal: { color: '#fff', fontSize: 32, fontWeight: '700' },
    listContainer: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: 15 },
    serviceName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
    billingCycle: { fontSize: 13, color: colors.textLight, textTransform: 'capitalize' },
    amount: { fontSize: 16, fontWeight: '700', color: colors.text },
    cardActions: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15, alignItems: 'flex-end' },
    cancelBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: `${colors.danger}15`, borderRadius: 8 },
    cancelText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, color: colors.text, fontWeight: '600', marginTop: 15 },
    emptySub: { fontSize: 14, color: colors.textLight, marginTop: 5 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 15, color: colors.text },
    cycleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    cycleBtn: { flex: 1, marginHorizontal: 5, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
    cycleBtnActive: { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
    cycleText: { color: colors.textLight, textTransform: 'capitalize' },
    cycleTextActive: { color: colors.primary, fontWeight: '600' },
    submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
