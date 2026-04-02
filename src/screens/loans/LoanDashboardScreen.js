import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { loanService } from '../../services/loanService';
import LoadingIndicator from '../../components/LoadingIndicator';
import Button from '../../components/common/Button';

export default function LoanDashboardScreen({ navigation }) {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLoans();
    }, []);

    const loadLoans = async () => {
        try {
            setLoading(true);
            const res = await loanService.getLoans();
            if (res.success) {
                setLoans(res.data || []);
            }
        } catch (error) {
            console.error('Error loading loans:', error);
            Alert.alert('Error', 'Could not load loans');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadLoans();
        setRefreshing(false);
    };

    const activeLoan = loans.find(l => l.status === 'active' || l.status === 'disbursed');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Loans</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            >
                {loading && !refreshing ? (
                    <LoadingIndicator text="Fetching loan status..." />
                ) : activeLoan ? (
                    <View style={styles.activeCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardLabel}>Active Loan Balance</Text>
                            <Text style={styles.cardAmount}>₦{activeLoan.outstandingBalance.toLocaleString()}</Text>
                        </View>
                        
                        <View style={styles.cardStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Next Repayment</Text>
                                <Text style={styles.statValue}>₦{activeLoan.repaymentSchedule[0]?.amount?.toLocaleString() || '0'}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Due Date</Text>
                                <Text style={styles.statValue}>{new Date(activeLoan.dueDate).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        <Button 
                            title="Repay Now" 
                            onPress={() => {}} 
                            style={styles.repayButton}
                        />
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="cash-outline" size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Need some cash?</Text>
                        <Text style={styles.emptySub}>Get quick loans up to ₦500k in minutes. No paperwork, just your phone.</Text>
                        <Button 
                            title="Apply Now" 
                            onPress={() => navigation.navigate('ApplyLoan')}
                            style={styles.applyButton}
                        />
                    </View>
                )}

                <Text style={styles.sectionTitle}>Loan History</Text>
                {loans.filter(l => l.status !== 'active' && l.status !== 'disbursed').map((loan) => (
                    <TouchableOpacity key={loan.id} style={styles.historyItem}>
                        <View style={styles.historyLeft}>
                             <View style={[styles.historyIcon, { backgroundColor: loan.status === 'completed' ? '#E6FDF7' : '#FEECEC' }]}>
                                <Ionicons name={loan.status === 'completed' ? 'checkmark-circle' : 'close-circle'} size={20} color={loan.status === 'completed' ? '#00C48C' : '#FF5252'} />
                             </View>
                             <View>
                                <Text style={styles.historyName}>Loan ₦{loan.amount.toLocaleString()}</Text>
                                <Text style={styles.historyDate}>{new Date(loan.created_at).toLocaleDateString()}</Text>
                             </View>
                        </View>
                        <View style={styles.historyRight}>
                             <Text style={[styles.historyStatus, { color: loan.status === 'completed' ? '#00C48C' : '#FF5252' }]}>{loan.status.toUpperCase()}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    header: {
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'space-between',
       paddingHorizontal: 20,
       paddingVertical: 15,
       backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    scrollContent: {
        padding: 20,
    },
    activeCard: {
        backgroundColor: '#0A1F44',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
    },
    cardHeader: {
        marginBottom: 20,
    },
    cardLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    cardAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
    },
    cardStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 16,
    },
    repayButton: {
        backgroundColor: colors.primary,
        borderRadius: 14,
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#EBF0FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    applyButton: {
        width: '100%',
        borderRadius: 14,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 16,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    historyDate: {
        fontSize: 12,
        color: colors.textLight,
    },
    historyStatus: {
        fontSize: 11,
        fontWeight: '800',
    },
});
