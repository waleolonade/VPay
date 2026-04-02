import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const PERSONAL_GRADIENT = ['#0A1F44', '#1A3A6B'];
const BUSINESS_GRADIENT = ['#1B1B2F', '#2D2D6E'];

export default function WalletCard({ wallets = [], onAddMoney, activeType = 'personal', onTypeChange }) {
    const [hidden, setHidden] = useState(false);
    const [copied, setCopied] = useState(false);

    const wallet = wallets.find(w => w.walletType === activeType) || wallets[0];

    const fmt = (n) => {
        const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.-]/g, '')) : Number(n);
        const safeNum = isNaN(num) ? 0 : num;
        return safeNum.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const balance = wallet ? fmt(wallet.balance) : '0.00';


    const accountNumber = wallet?.accountNumber || '—';
    const accountName = wallet?.accountName || '';
    const bankName = wallet?.bankName || 'VPay MFB';

    const copyAccount = async () => {
        await Clipboard.setStringAsync(accountNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isBusiness = activeType === 'business';
    const cardBg = isBusiness ? '#1B1B2F' : '#0A1F44';
    const accentColor = isBusiness ? '#A78BFA' : '#00E676';

    return (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
            {/* Account Type Tabs (OPay style) */}
            <View style={styles.tabs}>
                {['personal', 'business'].map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.tab, activeType === type && [styles.tabActive, { borderBottomColor: type === 'business' ? '#A78BFA' : '#00E676' }]]}
                        onPress={() => onTypeChange?.(type)}
                    >
                        <Ionicons
                            name={type === 'personal' ? 'person' : 'briefcase'}
                            size={12}
                            color={activeType === type ? '#fff' : 'rgba(255,255,255,0.4)'}
                            style={{ marginRight: 5 }}
                        />
                        <Text style={[styles.tabText, activeType === type && styles.tabTextActive]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
                <View style={{ flex: 1 }} />
                {/* Balance toggle */}
                <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.eyeBtn}>
                    <Ionicons name={hidden ? 'eye-off' : 'eye'} size={16} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
            </View>

            {/* Balance */}
            <View style={styles.balanceRow}>
                <View>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balance}>
                        {hidden ? '₦ ••••••' : `₦ ${balance}`}
                    </Text>
                </View>
                {/* Decorative circle */}
                <View style={[styles.circle, { borderColor: accentColor + '33' }]}>
                    <View style={[styles.circleInner, { backgroundColor: accentColor + '20' }]}>
                        <Ionicons name={isBusiness ? 'briefcase' : 'wallet'} size={20} color={accentColor} />
                    </View>
                </View>
            </View>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Account Info Row */}
            <View style={styles.bottomRow}>
                <View style={styles.accountBox}>
                    <Text style={styles.bankLabel}>{bankName}</Text>
                    <Text style={styles.accountName}>{accountName}</Text>
                    <TouchableOpacity style={styles.accountNumRow} onPress={copyAccount} activeOpacity={0.7}>
                        <Text style={styles.accountNumber}>{accountNumber}</Text>
                        <View style={[styles.copyBadge, copied && { backgroundColor: accentColor + '30' }]}>
                            <Ionicons
                                name={copied ? 'checkmark' : 'copy-outline'}
                                size={12}
                                color={copied ? accentColor : 'rgba(255,255,255,0.5)'}
                            />
                            <Text style={[styles.copyText, copied && { color: accentColor }]}>
                                {copied ? 'Copied!' : 'Copy'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.addBtn, { backgroundColor: accentColor + '22' }]} onPress={onAddMoney}>
                    <View style={[styles.addIcon, { backgroundColor: accentColor }]}>
                        <Ionicons name="add" size={16} color="#0A1F44" />
                    </View>
                    <Text style={[styles.addText, { color: accentColor }]}>Add Money</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 20,
        borderRadius: 22,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    tabs: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        paddingBottom: 10,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginRight: 4,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomWidth: 2,
    },
    tabText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#fff',
    },
    eyeBtn: {
        padding: 4,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '500',
    },
    balance: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    circle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleInner: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 14,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    accountBox: {
        flex: 1,
        marginRight: 12,
    },
    bankLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    accountName: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    accountNumRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    accountNumber: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    copyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    copyText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '600',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        gap: 6,
    },
    addIcon: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
