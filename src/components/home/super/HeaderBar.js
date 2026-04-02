import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';

export default function HeaderBar({ username = 'User', avatarUrl, onProfilePress, onNotificationPress, unreadCount = 0 }) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5) return 'Good night 🌙';
        if (hour < 12) return 'Good morning ☀️';
        if (hour < 17) return 'Good afternoon 🌤️';
        if (hour < 21) return 'Good evening 🌅';
        return 'Good night 🌙';
    };

    const initials = username ? username.slice(0, 1).toUpperCase() : 'U';

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity onPress={onProfilePress} activeOpacity={0.85} style={styles.avatarWrap}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    )}
                    <View style={styles.onlineDot} />
                </TouchableOpacity>

                <View style={styles.greetingBox}>
                    <Text style={styles.greeting}>{getGreeting()}</Text>
                    <Text style={styles.username}>{username}</Text>
                </View>
            </View>

            <View style={styles.right}>
                <TouchableOpacity
                    style={styles.iconBtn}
                    activeOpacity={0.75}
                    onPress={onNotificationPress}
                >
                    <Ionicons name="notifications-outline" size={22} color={colors.textMed} />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.iconBtn, { marginLeft: 10 }]} activeOpacity={0.75}>
                    <Ionicons name="headset-outline" size={22} color={colors.textMed} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarWrap: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.lightBg,
    },
    avatarFallback: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: colors.success,
        borderWidth: 2,
        borderColor: colors.surface,
    },
    greetingBox: {
        justifyContent: 'center',
        flex: 1,
    },
    greeting: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '500',
        marginBottom: 1,
    },
    username: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.3,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        backgroundColor: colors.lightBg,
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.danger,
        borderWidth: 1.5,
        borderColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
        lineHeight: 12,
    },
});
