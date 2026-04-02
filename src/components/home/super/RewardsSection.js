import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';

const REWARDS = [
    {
        id: 'cashback',
        title: 'Cashback',
        value: '₦1,230',
        label: 'Earned this month',
        icon: 'gift-outline',
        color: '#FF6D00',
        bg: '#FFF1E6',
    },
    {
        id: 'referral',
        title: 'Referrals',
        value: 'Earn ₦1k',
        label: 'Per friend invited',
        icon: 'people-outline',
        color: '#00C48C',
        bg: '#E6FDF7',
    },
    {
        id: 'points',
        title: 'VPay Points',
        value: '3,400',
        label: 'Redeem for rewards',
        icon: 'star-outline',
        color: '#7C3AED',
        bg: '#F2EDFF',
    },
];

export default function RewardsSection() {
    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={styles.sectionTitle}>Rewards & Loyalty</Text>
                <Text style={styles.seeAll}>View all</Text>
            </View>

            <View style={styles.cardsRow}>
                {REWARDS.map((r) => (
                    <TouchableOpacity key={r.id} style={styles.rewardCard} activeOpacity={0.8}>
                        <View style={[styles.iconCircle, { backgroundColor: r.bg }]}>
                            <Ionicons name={r.icon} size={20} color={r.color} />
                        </View>
                        <Text style={styles.cardTitle}>{r.title}</Text>
                        <Text style={[styles.cardValue, { color: r.color }]}>{r.value}</Text>
                        <Text style={styles.cardLabel}>{r.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 28,
    },
    titleRow: {
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
    seeAll: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    rewardCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 14,
        shadowColor: '#0D1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 11,
        color: colors.textLight,
        fontWeight: '600',
        marginBottom: 3,
    },
    cardValue: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 2,
    },
    cardLabel: {
        fontSize: 10,
        color: colors.textLighter,
        fontWeight: '500',
        textAlign: 'center',
    },
});
