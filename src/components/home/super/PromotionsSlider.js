import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width - 48;

const PROMOS = [
    {
        id: '1',
        title: '5% Cashback 🎉',
        subtitle: 'On all airtime purchases this week',
        cta: 'Claim Now',
        gradient: ['#0A1F44', '#003A91'],
        icon: 'gift-outline',
        tag: 'HOT OFFER',
    },
    {
        id: '2',
        title: 'Refer & Earn',
        subtitle: 'Get ₦1,000 for every friend you invite',
        cta: 'Invite Friends',
        gradient: ['#7C3AED', '#4F46E5'],
        icon: 'people-outline',
        tag: 'REFERRAL',
    },
    {
        id: '3',
        title: '🎁 Data Bonus',
        subtitle: '2GB free when you buy 10GB data',
        cta: 'Buy Data',
        gradient: ['#0891B2', '#0E7490'],
        icon: 'wifi-outline',
        tag: 'LIMITED',
    },
];

export default function PromotionsSlider({ onPromoPress }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (event) => {
        const offset = event.nativeEvent.contentOffset.x;
        const index = Math.round(offset / (SLIDE_WIDTH + 16));
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={styles.sectionTitle}>Promotions</Text>
                <Text style={styles.seeAll}>View all</Text>
            </View>

            <ScrollView
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                snapToInterval={SLIDE_WIDTH + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
            >
                {PROMOS.map((promo) => (
                    <TouchableOpacity
                        key={promo.id}
                        style={[styles.slide, { backgroundColor: promo.gradient[0] }]}
                        activeOpacity={0.88}
                        onPress={() => onPromoPress?.(promo)}
                    >
                        {/* Background decoration */}
                        <View style={styles.circleDecor1} />
                        <View style={styles.circleDecor2} />

                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{promo.tag}</Text>
                        </View>

                        <Text style={styles.title}>{promo.title}</Text>
                        <Text style={styles.subtitle}>{promo.subtitle}</Text>

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.ctaBtn} onPress={() => onPromoPress?.(promo)}>
                                <Text style={[styles.ctaText, { color: promo.gradient[0] }]}>{promo.cta}</Text>
                                <Ionicons name="arrow-forward" size={12} color={promo.gradient[0]} />
                            </TouchableOpacity>
                            <View style={styles.iconCircle}>
                                <Ionicons name={promo.icon} size={28} color="rgba(255,255,255,0.85)" />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Dots */}
            <View style={styles.pagination}>
                {PROMOS.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            activeIndex === i && styles.activeDot,
                        ]}
                    />
                ))}
            </View>
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
        paddingHorizontal: 20,
    },
    slide: {
        width: SLIDE_WIDTH,
        height: 148,
        borderRadius: 22,
        padding: 20,
        marginRight: 16,
        overflow: 'hidden',
        justifyContent: 'space-between',
    },
    circleDecor1: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.07)',
        right: -30,
        top: -40,
    },
    circleDecor2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        right: 60,
        bottom: -20,
    },
    tag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 6,
    },
    tagText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    title: {
        color: '#fff',
        fontSize: 19,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
    },
    ctaText: {
        fontWeight: '800',
        fontSize: 12,
    },
    iconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 14,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.border,
    },
    activeDot: {
        width: 20,
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
});
