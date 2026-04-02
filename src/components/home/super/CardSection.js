import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';

export default function CardSection({ cards = [], onManageCards }) {
    const virtualCards = cards.filter(c => c.cardType === 'virtual');
    const physicalCards = cards.filter(c => c.cardType === 'physical');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Your Cards</Text>
                <TouchableOpacity onPress={onManageCards}>
                    <Text style={styles.manageText}>Manage</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.cardsWrapper}>
                {/* Virtual Cards */}
                {virtualCards.length > 0 ? (
                    virtualCards.map((card) => (
                        <TouchableOpacity key={card.id || card._id} style={styles.virtualCard} activeOpacity={0.9} onPress={onManageCards}>
                            <View style={styles.cardLeft}>
                                <View style={styles.cardIconBox}>
                                    <Ionicons name="card" size={20} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.cardName}>{card.cardType === 'virtual' ? 'Virtual Card' : 'Debit Card'}</Text>
                                    <Text style={styles.cardDesc}>•••• {card.last4} | {card.expiryMonth}/{card.expiryYear}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                        </TouchableOpacity>
                    ))
                ) : (
                    <TouchableOpacity style={styles.virtualCard} activeOpacity={0.9} onPress={onManageCards}>
                        <View style={styles.cardLeft}>
                            <View style={styles.cardIconBox}>
                                <Ionicons name="card" size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.cardName}>Virtual Card</Text>
                                <Text style={styles.cardDesc}>Ready for online payments</Text>
                            </View>
                        </View>
                        <Ionicons name="add-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                )}

                {/* Physical Card Prompt */}
                {physicalCards.length === 0 && (
                    <TouchableOpacity style={styles.physicalCard} activeOpacity={0.7} onPress={onManageCards}>
                        <View style={styles.cardLeft}>
                            <View style={[styles.cardIconBox, { backgroundColor: `${colors.primary}20` }]}>
                                <Ionicons name="card-outline" size={20} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.cardName, { color: colors.text }]}>Physical Card</Text>
                                <Text style={[styles.cardDesc, { color: colors.textLight }]}>Request a VPay debit card</Text>
                            </View>
                        </View>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
                
                {physicalCards.map((card) => (
                    <TouchableOpacity key={card.id || card._id} style={[styles.physicalCard, { borderStyle: 'solid' }]} activeOpacity={0.8} onPress={onManageCards}>
                             <View style={styles.cardLeft}>
                                <View style={[styles.cardIconBox, { backgroundColor: `${colors.primary}20` }]}>
                                    <Ionicons name="card" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.cardName, { color: colors.text }]}>Physical Card</Text>
                                    <Text style={[styles.cardDesc, { color: colors.textLight }]}>•••• {card.last4} | Active</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    manageText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    cardsWrapper: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    virtualCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0A1F44', // VPay theme dark card
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    physicalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.lightBg,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        borderStyle: 'dashed',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    cardDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
});
