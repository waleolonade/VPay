import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';

const personalActions = [
    { id: 'transfer', name: 'Transfer', icon: 'swap-horizontal', color: '#00C853', bg: '#E6FFF0' },
    { id: 'airtime', name: 'Airtime', icon: 'phone-portrait', color: '#2962FF', bg: '#EBF0FF' },
    { id: 'data', name: 'Data', icon: 'wifi', color: '#FF6D00', bg: '#FFF1E6' },
    { id: 'bills', name: 'Pay Bills', icon: 'receipt', color: '#7C3AED', bg: '#F2EDFF' },
    { id: 'tv', name: 'Cable TV', icon: 'tv', color: '#00897B', bg: '#E6F7F5' },
    { id: 'electricity', name: 'Electricity', icon: 'flash', color: '#F59E0B', bg: '#FEF9EC' },
    { id: 'betting', name: 'Betting', icon: 'football', color: '#E53935', bg: '#FFEBEA' },
    { id: 'internet', name: 'Internet', icon: 'globe', color: '#0284C7', bg: '#E9F4FB' },
];

const businessActions = [
    { id: 'transfer', name: 'Transfer', icon: 'swap-horizontal', color: '#00C853', bg: '#E6FFF0' },
    { id: 'receive', name: 'Receive', icon: 'qr-code', color: '#7C3AED', bg: '#F2EDFF' },
    { id: 'invoice', name: 'Invoice', icon: 'document-text', color: '#FF6D00', bg: '#FFF1E6' },
    { id: 'payroll', name: 'Payroll', icon: 'people', color: '#2962FF', bg: '#EBF0FF' },
    { id: 'expenses', name: 'Expenses', icon: 'pie-chart', color: '#00897B', bg: '#E6F7F5' },
    { id: 'pay_link', name: 'Pay Link', icon: 'link', color: '#0284C7', bg: '#E9F4FB' },
    { id: 'reports', name: 'Reports', icon: 'bar-chart', color: '#D97706', bg: '#FEF9EC' },
    { id: 'more_biz', name: 'More', icon: 'grid', color: '#4B5563', bg: '#F3F4F6' },
];

export default function QuickActionsGrid({ onActionPress, isBusiness = false }) {
    const curActions = isBusiness ? businessActions : personalActions;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.grid}>
                {curActions.map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        style={styles.actionBtn}
                        onPress={() => onActionPress(action.id)}
                        activeOpacity={0.72}
                    >
                        <View style={[styles.iconBox, { backgroundColor: action.bg }]}>
                            <Ionicons name={action.icon} size={22} color={action.color} />
                        </View>
                        <Text style={styles.actionText}>{action.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        borderRadius: 22,
        padding: 20,
        marginBottom: 18,
        shadowColor: '#0D1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 18,
        letterSpacing: -0.2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionBtn: {
        width: '23%',
        alignItems: 'center',
        marginBottom: 18,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 11,
        color: colors.textMed,
        fontWeight: '700',
        textAlign: 'center',
    },
});
