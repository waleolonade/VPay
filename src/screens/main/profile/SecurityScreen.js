import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../../styles/colors';
import Header from '../../../components/common/Header';
import { biometricService } from '../../../services/biometricService';

const HIDE_BALANCE_KEY = '@vpay_hide_balance';

export default function SecurityScreen({ navigation }) {
    const [useBiometrics, setUseBiometrics] = useState(false);
    const [hideBalance, setHideBalance] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(true);

    // ── Load persisted settings on mount ──────────────────────────────────
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [available, enabled, hideBal] = await Promise.all([
                    biometricService.isAvailable(),
                    biometricService.isEnabled(),
                    AsyncStorage.getItem(HIDE_BALANCE_KEY),
                ]);
                setBiometricAvailable(available);
                setUseBiometrics(available ? enabled : false);
                setHideBalance(hideBal === 'true');
            } catch { /* ignore */ } finally {
                setBiometricLoading(false);
            }
        };
        loadSettings();
    }, []);

    // ── Handle biometric toggle ───────────────────────────────────────────
    const handleBiometricToggle = async (newValue) => {
        if (!biometricAvailable) {
            Alert.alert(
                'Not Available',
                'Your device does not have biometric authentication set up. Please enrol a fingerprint or Face ID in your device settings.',
            );
            return;
        }

        if (newValue) {
            // Enabling: require a live biometric check before turning on
            try {
                setBiometricLoading(true);
                const result = await biometricService.authenticate(
                    'Scan to enable biometric login',
                );
                if (result.success) {
                    await biometricService.enable();
                    setUseBiometrics(true);
                    Alert.alert(
                        'Biometric Login Enabled',
                        'You can now sign in to VPay using your fingerprint or Face ID.',
                    );
                } else {
                    Alert.alert('Authentication Failed', 'Biometric check not completed. Please try again.');
                }
            } catch {
                Alert.alert('Error', 'Could not enable biometric login. Please try again.');
            } finally {
                setBiometricLoading(false);
            }
        } else {
            // Disabling: confirm first
            Alert.alert(
                'Disable Biometric Login',
                'Are you sure you want to disable biometric login? You will need to use your password to sign in.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await biometricService.disableAndClear();
                                setUseBiometrics(false);
                            } catch {
                                Alert.alert('Error', 'Could not disable biometric login.');
                            }
                        },
                    },
                ],
            );
        }
    };

    // ── Handle hide-balance toggle ────────────────────────────────────────
    const handleHideBalanceToggle = async (newValue) => {
        setHideBalance(newValue);
        await AsyncStorage.setItem(HIDE_BALANCE_KEY, String(newValue));
    };

    // ── SettingRow sub-component ──────────────────────────────────────────
    const SettingRow = ({ icon, title, subtitle, onPress, toggle, value, onToggle, disabled }) => (
        <TouchableOpacity
            style={[styles.row, disabled && styles.rowDisabled]}
            activeOpacity={toggle ? 1 : 0.7}
            onPress={toggle ? null : onPress}
            disabled={disabled}
        >
            <View style={styles.leftGroup}>
                <View style={styles.iconBox}>
                    <Ionicons name={icon} size={20} color={disabled ? colors.textLighter : colors.primary} />
                </View>
                <View style={styles.textGroup}>
                    <Text style={[styles.rowTitle, disabled && styles.rowTitleDisabled]}>{title}</Text>
                    {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {toggle ? (
                biometricLoading && icon === 'finger-print' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Switch
                        value={value}
                        onValueChange={onToggle}
                        trackColor={{ false: '#d1d5db', true: colors.primary }}
                        thumbColor="#fff"
                        disabled={disabled}
                    />
                )
            ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Security & Privacy" onBackPress={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionHeader}>LOGIN & SECURITY</Text>

                <View style={styles.card}>
                    <SettingRow
                        icon="lock-closed"
                        title="Change Login PIN"
                        subtitle="Update your 4-digit code"
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="finger-print"
                        title="Biometric Login"
                        subtitle={
                            !biometricAvailable
                                ? 'Not available on this device'
                                : useBiometrics
                                    ? 'Face ID / Touch ID is active'
                                    : 'Use Face ID / Touch ID to login'
                        }
                        toggle
                        value={useBiometrics}
                        onToggle={handleBiometricToggle}
                        disabled={!biometricAvailable}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="keypad"
                        title="Change Transaction PIN"
                        subtitle="Used to confirm payments"
                        onPress={() => navigation.navigate('TransactionPin')}
                    />
                </View>

                <Text style={styles.sectionHeader}>PRIVACY</Text>

                <View style={styles.card}>
                    <SettingRow
                        icon="eye-off"
                        title="Hide Balances on App Open"
                        subtitle="Automatically hide amount values"
                        toggle
                        value={hideBalance}
                        onToggle={handleHideBalanceToggle}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="shield-checkmark"
                        title="Privacy Policy"
                    />
                </View>

                <Text style={styles.sectionHeader}>DEVICES</Text>

                <View style={styles.card}>
                    <SettingRow
                        icon="phone-portrait"
                        title="Manage Devices"
                        subtitle="View logged in devices"
                    />
                </View>

                <TouchableOpacity style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>Deactivate Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 16 },
    sectionHeader: { fontSize: 13, fontWeight: '700', color: '#64748b', marginTop: 16, marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8 },
    rowDisabled: { opacity: 0.45 },
    rowTitleDisabled: { color: colors.textLight },
    leftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    textGroup: { flex: 1 },
    rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
    rowSubtitle: { fontSize: 13, color: colors.textLight },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#e2e8f0', marginLeft: 64 },
    deleteBtn: { marginTop: 24, alignSelf: 'center', padding: 16 },
    deleteText: { color: colors.danger, fontWeight: '700', fontSize: 16 }
});
