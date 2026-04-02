import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import { useAuth } from '../../../context/AuthContext';

const { width, height } = Dimensions.get('window');

/**
 * OPay-style side menu / profile context menu that opens when tapping the avatar
 */
export default function ProfileMenuModal({ visible, onClose, navigation }) {
    const { user, clearAuth } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out of VPay?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: () => {
                        onClose();
                        clearAuth(); // Wipes user's tokens locally
                    }
                }
            ]
        );
    };

    const getTierInfo = (kycLevel) => {
        switch (kycLevel) {
            case 3: return { label: 'Tier 3', limit: '₦5,000,000' };
            case 2: return { label: 'Tier 2', limit: '₦200,000' };
            default: return { label: 'Tier 1', limit: '₦50,000' };
        }
    };

    const tier = getTierInfo(user?.kyc_level || 1);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={styles.drawerContainer}>
                    {/* Header / Profile Info */}
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={user?.avatar ? { uri: user?.avatar } : require('../../../../assets/icon.png')}
                                style={styles.avatar}
                                defaultSource={require('../../../../assets/icon.png')}
                            />
                            <View style={styles.kycBadge}>
                                <Text style={styles.kycText}>{tier.label}</Text>
                            </View>
                        </View>
                        <Text style={styles.userName}>{user?.firstName || 'User'} {user?.lastName || ''}</Text>
                        <Text style={styles.userPhone}>{user?.phone || ''}</Text>
                    </View>

                    {/* Account Limits & Info */}
                    <View style={styles.limitsBox}>
                        <View style={styles.limitItem}>
                            <Text style={styles.limitLabel}>Daily Limit</Text>
                            <Text style={styles.limitValue}>{tier.limit}</Text>
                        </View>
                        <View style={styles.limitConfig}>
                            <Text style={styles.upgradeText}>Upgrade Account</Text>
                            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View style={styles.menuList}>
                        <MenuRow
                            icon="person-outline"
                            title="Account Details"
                            onPress={() => { onClose(); navigation?.navigate('AccountDetails'); }}
                        />
                        <MenuRow
                            icon="shield-checkmark-outline"
                            title="Security & Privacy"
                            onPress={() => { onClose(); navigation?.navigate('Security'); }}
                        />
                        <MenuRow
                            icon="card-outline"
                            title="Bank Cards & Accounts"
                            onPress={() => { onClose(); navigation?.navigate('Cards'); }}
                        />
                        <MenuRow
                            icon="settings-outline"
                            title="Settings"
                            onPress={() => { onClose(); navigation?.navigate('Settings'); }}
                        />
                        <MenuRow
                            icon="help-buoy-outline"
                            title="Help Center"
                            onPress={() => { onClose(); navigation?.navigate('HelpCenter'); }}
                        />
                    </View>

                    {/* Bottom Actions */}
                    <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function MenuRow({ icon, title, onPress }) {
    return (
        <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.menuLeft}>
                <Ionicons name={icon} size={22} color={colors.text} style={styles.menuIcon} />
                <Text style={styles.menuTitle}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        flex: 1,
    },
    drawerContainer: {
        width: width * 0.8, // 80% of screen width
        height: '100%',
        backgroundColor: '#fff',
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
        position: 'absolute',
        left: 0,
    },
    header: {
        marginTop: 40,
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        width: 64,
        marginBottom: 12,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.lightBg,
    },
    kycBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    kycText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        color: colors.textLight,
    },
    limitsBox: {
        backgroundColor: colors.lightBg,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    limitItem: {},
    limitLabel: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 4,
    },
    limitValue: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
    },
    limitConfig: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    upgradeText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        marginRight: 4,
    },
    menuList: {
        flex: 1,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        marginRight: 16,
    },
    menuTitle: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 59, 48, 0.1)', // Light red
        borderRadius: 16,
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.danger,
        marginLeft: 8,
    },
});
