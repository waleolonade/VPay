import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';

export default function FinanceServices({ onServicePress, isBusiness = false, loans = [], savings = [] }) {
    const totalSavings = savings.reduce((acc, curr) => acc + (parseFloat(curr.currentBalance) || 0), 0);
    const activeLoan = loans.find(l => l.status === 'active' || l.status === 'disbursed');

    const personalServices = [
        { 
            id: 'loan', 
            name: activeLoan ? 'Active Loan' : 'Quick Loan', 
            desc: activeLoan ? `Bal: ₦${activeLoan.outstandingBalance.toLocaleString()}` : 'Borrow up to ₦500k', 
            icon: 'cash', 
            color: '#2962FF', 
            bg: '#EBF0FF' 
        },
        { 
            id: 'savings', 
            name: totalSavings > 0 ? 'My Savings' : 'Smart Savings', 
            desc: totalSavings > 0 ? `₦${totalSavings.toLocaleString()}` : 'Earn 15% ROI', 
            icon: 'wallet', 
            color: '#00C48C', 
            bg: '#E6FDF7' 
        },
        { id: 'insurance', name: 'Insurance', desc: 'Protect assets', icon: 'shield-checkmark', color: '#F59E0B', bg: '#FEF9EC' },
        { id: 'invest', name: 'Invest', desc: 'Grow your wealth', icon: 'trending-up', color: '#7C3AED', bg: '#F2EDFF' },
    ];

    const businessServices = [
        { id: 'business_loan', name: 'Biz Loans', desc: 'Borrow up to ₦5M', icon: 'briefcase', color: '#2962FF', bg: '#EBF0FF' },
        { id: 'overdraft', name: 'Overdraft', desc: 'Working capital', icon: 'card', color: '#00C48C', bg: '#E6FDF7' },
        { id: 'pos', name: 'Request POS', desc: 'Free terminal', icon: 'calculator', color: '#F59E0B', bg: '#FEF9EC' },
        { id: 'fleet', name: 'Fleet Mgt', desc: 'Manage vehicles', icon: 'car', color: '#7C3AED', bg: '#F2EDFF' },
    ];

    const activeServices = isBusiness ? businessServices : personalServices;

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={styles.sectionTitle}>{isBusiness ? 'Business Services' : 'Financial Services'}</Text>
                <Text style={styles.seeAll}>See all</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {activeServices.map((service) => (
                    <TouchableOpacity
                        key={service.id}
                        style={styles.card}
                        onPress={() => onServicePress?.(service.id)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: service.bg }]}>
                            <Ionicons name={service.icon} size={22} color={service.color} />
                        </View>
                        <Text style={styles.cardTitle}>{service.name}</Text>
                        <Text style={styles.cardDesc}>{service.desc}</Text>
                        <View style={[styles.pill, { backgroundColor: service.bg }]}>
                            <Text style={[styles.pillText, { color: service.color }]}>Learn more</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 22,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.3,
    },
    seeAll: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    card: {
        backgroundColor: colors.surface,
        width: 142,
        padding: 16,
        borderRadius: 20,
        marginRight: 12,
        shadowColor: '#0D1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 11,
        color: colors.textLight,
        lineHeight: 16,
        marginBottom: 12,
    },
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '700',
    },
});
