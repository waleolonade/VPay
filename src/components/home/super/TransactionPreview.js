import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';

const CATEGORY_ICONS = {
    bill: { icon: 'receipt-outline', color: '#7C3AED', bg: '#F2EDFF' },
    airtime: { icon: 'phone-portrait-outline', color: '#2962FF', bg: '#EBF0FF' },
    data: { icon: 'wifi-outline', color: '#0284C7', bg: '#E9F4FB' },
    credit: { icon: 'arrow-down-outline', color: '#00C48C', bg: '#E6FDF7' },
    debit: { icon: 'arrow-up-outline', color: '#F23D4F', bg: '#FFEBEA' },
};

export default function TransactionPreview({ transactions = [], onViewAll, onTransactionPress }) {

    const getVisuals = (category, type) => {
        if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
        return type === 'credit' ? CATEGORY_ICONS.credit : CATEGORY_ICONS.debit;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.listCard}>
                {transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="receipt-outline" size={32} color={colors.textLight} />
                        </View>
                        <Text style={styles.emptyTitle}>No transactions yet</Text>
                        <Text style={styles.emptySubtitle}>Your transaction history will appear here</Text>
                    </View>
                ) : (
                    transactions.map((txn, index) => {
                        const isLast = index === transactions.length - 1;
                        const visuals = getVisuals(txn.category, txn.type);
                        const amountPrefix = txn.type === 'credit' ? '+' : '-';
                        const amountColor = txn.type === 'credit' ? colors.success : colors.text;

                        return (
                            <TouchableOpacity
                                key={txn.id}
                                style={[styles.txnItem, !isLast && styles.borderBottom]}
                                onPress={() => onTransactionPress?.(txn.id)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.iconBox, { backgroundColor: visuals.bg }]}>
                                    <Ionicons name={visuals.icon} size={19} color={visuals.color} />
                                </View>

                                <View style={styles.txnDetails}>
                                    <Text style={styles.txnTitle} numberOfLines={1}>{txn.title}</Text>
                                    <Text style={styles.txnDate}>{txn.date}</Text>
                                </View>

                                <View style={styles.amountContainer}>
                                    <Text style={[styles.txnAmount, { color: amountColor }]}>
                                        {amountPrefix}₦{txn.amount}
                                    </Text>
                                    {txn.status !== 'success' && txn.status !== 'completed' && (
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: txn.status === 'failed' ? '#FFEBEA' : '#FEF9EC' }
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                { color: txn.status === 'failed' ? colors.danger : colors.warning }
                                            ]}>
                                                {txn.status}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.3,
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    listCard: {
        backgroundColor: colors.surface,
        borderRadius: 22,
        paddingHorizontal: 16,
        shadowColor: '#0D1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 4,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.lightBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textMed,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        color: colors.textLight,
        textAlign: 'center',
    },
    txnItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
    },
    txnDetails: {
        flex: 1,
    },
    txnTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    txnDate: {
        fontSize: 12,
        color: colors.textLight,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    txnAmount: {
        fontSize: 14,
        fontWeight: '800',
    },
    statusBadge: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
});
