import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Switch,
    ScrollView, Alert, ActivityIndicator, Modal,
    TextInput, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../../styles/colors';
import Header from '../../../components/common/Header';
import { useAuth } from '../../../context/AuthContext';
import { profileService } from '../../../services/profileService';

const SOUND_KEY = '@vpay_in_app_sound';

// ── Inline toast ─────────────────────────────────────────────────────────────
function Toast({ message, type }) {
    const opacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(1800),
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    }, [message]);
    if (!message) return null;
    return (
        <Animated.View style={[styles.toast, { opacity, backgroundColor: type === 'error' ? colors.danger : colors.success }]}>
            <Ionicons name={type === 'error' ? 'close-circle' : 'checkmark-circle'} size={16} color="#fff" />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
}

// ── Limit edit modal ──────────────────────────────────────────────────────────
function LimitModal({ visible, title, currentValue, onSave, onClose, saving }) {
    const [value, setValue] = useState(String(currentValue || ''));
    useEffect(() => { setValue(String(currentValue || '')); }, [currentValue, visible]);
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={value}
                        onChangeText={setValue}
                        keyboardType="numeric"
                        placeholder="Enter amount (₦)"
                        placeholderTextColor={colors.textLighter}
                    />
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                            onPress={() => onSave(value)}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.modalSaveText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export default function SettingsScreen({ navigation }) {
    const { user, setUser } = useAuth();

    // ── Notification toggles (seeded from AuthContext user) ───────────────
    const [pushEnabled, setPushEnabled]   = useState(false);
    const [smsEnabled, setSmsEnabled]     = useState(false);
    const [promoEnabled, setPromoEnabled] = useState(false);
    // ── Preferences (local) ───────────────────────────────────────────────
    const [soundEnabled, setSoundEnabled] = useState(true);
    // ── Limits ────────────────────────────────────────────────────────────
    const [transferLimit, setTransferLimit]     = useState(0);
    const [withdrawalLimit, setWithdrawalLimit] = useState(0);
    // ── Modal state ───────────────────────────────────────────────────────
    const [limitModal, setLimitModal] = useState({ open: false, field: '', title: '', value: 0 });
    const [limitSaving, setLimitSaving] = useState(false);
    // ── Per-toggle saving indicators ──────────────────────────────────────
    const [saving, setSaving] = useState({});
    // ── Toast ─────────────────────────────────────────────────────────────
    const [toast, setToast] = useState({ message: '', type: 'success' });

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: 'success' }), 2400);
    }, []);

    // Seed UI from latest AuthContext user
    useEffect(() => {
        if (user) {
            setPushEnabled(!!user.pushEnabled);
            setSmsEnabled(!!user.smsEnabled);
            setPromoEnabled(!!user.promoEnabled);
            setTransferLimit(user.dailyTransferLimit || 0);
            setWithdrawalLimit(user.dailyWithdrawalLimit || 0);
        }
    }, [user]);

    // Load local AsyncStorage prefs
    useEffect(() => {
        AsyncStorage.getItem(SOUND_KEY).then((v) => {
            if (v !== null) setSoundEnabled(v === 'true');
        });
    }, []);

    // ── Generic backend toggle handler ────────────────────────────────────
    const handleBackendToggle = useCallback(async (field, newValue, localSetter) => {
        localSetter(newValue); // optimistic
        setSaving((s) => ({ ...s, [field]: true }));
        try {
            const res = await profileService.updateProfile({ [field]: newValue });
            if (res.success && res.data) setUser(res.data);
            showToast('Preference saved');
        } catch {
            localSetter(!newValue); // revert
            showToast('Failed to save. Try again.', 'error');
        } finally {
            setSaving((s) => ({ ...s, [field]: false }));
        }
    }, [setUser, showToast]);

    // ── Sound toggle (local only) ─────────────────────────────────────────
    const handleSoundToggle = useCallback(async (v) => {
        setSoundEnabled(v);
        await AsyncStorage.setItem(SOUND_KEY, String(v));
        showToast('Preference saved');
    }, [showToast]);

    // ── Limit save ────────────────────────────────────────────────────────
    const handleLimitSave = useCallback(async (rawValue) => {
        const amount = parseFloat(rawValue);
        if (isNaN(amount) || amount < 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
            return;
        }
        setLimitSaving(true);
        try {
            const payload = { [limitModal.field]: amount };
            const res = await profileService.updateProfile(payload);
            if (res.success && res.data) {
                setUser(res.data);
                if (limitModal.field === 'dailyTransferLimit') setTransferLimit(amount);
                else setWithdrawalLimit(amount);
                showToast('Limit updated');
            }
            setLimitModal((m) => ({ ...m, open: false }));
        } catch {
            showToast('Failed to update limit.', 'error');
        } finally {
            setLimitSaving(false);
        }
    }, [limitModal, setUser, showToast]);

    // ── Reusable row components ───────────────────────────────────────────
    const ToggleRow = ({ icon, iconColor, iconBg, title, subtitle, field, value, setter }) => (
        <View style={styles.row}>
            <View style={styles.leftGroup}>
                <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon} size={20} color={iconColor} />
                </View>
                <View style={styles.textGroup}>
                    <Text style={styles.rowTitle}>{title}</Text>
                    {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {saving[field]
                ? <ActivityIndicator size="small" color={colors.primary} />
                : (
                    <Switch
                        value={value}
                        onValueChange={(v) =>
                            field === '_local'
                                ? setter(v)
                                : handleBackendToggle(field, v, setter)
                        }
                        trackColor={{ false: '#d1d5db', true: colors.primary }}
                        thumbColor="#fff"
                    />
                )}
        </View>
    );

    const NavRow = ({ icon, iconColor, iconBg, title, subtitle, onPress, valueLabel, disabled }) => (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={disabled ? 1 : 0.7} disabled={disabled}>
            <View style={styles.leftGroup}>
                <View style={[styles.iconBox, { backgroundColor: iconBg || 'rgba(100,116,139,0.1)' }]}>
                    <Ionicons name={icon} size={20} color={iconColor || '#64748b'} />
                </View>
                <View style={styles.textGroup}>
                    <Text style={[styles.rowTitle, disabled && { color: colors.textLight }]}>{title}</Text>
                    {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.rowRight}>
                {valueLabel ? <Text style={styles.valueLabel}>{valueLabel}</Text> : null}
                <Ionicons name={disabled ? 'lock-closed-outline' : 'chevron-forward'} size={18} color={colors.textLight} />
            </View>
        </TouchableOpacity>
    );

    const formatCurrency = (n) =>
        n ? `₦${Number(n).toLocaleString()}` : 'Not set';

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Settings" onBackPress={() => navigation.goBack()} />
            <Toast message={toast.message} type={toast.type} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ── NOTIFICATIONS ──────────────────────────────────────── */}
                <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
                <View style={styles.card}>
                    <ToggleRow
                        icon="notifications" iconColor={colors.primary} iconBg="rgba(0,82,204,0.1)"
                        title="Push Notifications" subtitle="Receive real-time alerts on your device"
                        field="pushEnabled" value={pushEnabled} setter={setPushEnabled}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon="chatbubble-ellipses" iconColor={colors.success} iconBg="rgba(0,196,140,0.1)"
                        title="SMS Alerts" subtitle="Get transaction updates via SMS"
                        field="smsEnabled" value={smsEnabled} setter={setSmsEnabled}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon="pricetag" iconColor={colors.secondary} iconBg="rgba(99,91,235,0.1)"
                        title="Promotions & Offers" subtitle="Receive deals and rewards news"
                        field="promoEnabled" value={promoEnabled} setter={setPromoEnabled}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon="volume-high" iconColor={colors.warning} iconBg="rgba(245,166,35,0.1)"
                        title="In-App Sounds" subtitle="Play sounds on transactions"
                        field="_local" value={soundEnabled} setter={handleSoundToggle}
                    />
                </View>

                {/* ── SECURITY ───────────────────────────────────────────── */}
                <Text style={styles.sectionHeader}>SECURITY</Text>
                <View style={styles.card}>
                    <NavRow
                        icon="finger-print" iconColor={colors.primary} iconBg="rgba(0,82,204,0.1)"
                        title="Biometric Login" subtitle="Face ID / Fingerprint"
                        onPress={() => navigation.navigate('Security')}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="key" iconColor={colors.danger} iconBg="rgba(242,61,79,0.1)"
                        title="Change Password" subtitle="Update your account password"
                        onPress={() => navigation.navigate('Security')}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="keypad" iconColor={colors.accent} iconBg="rgba(0,212,170,0.1)"
                        title="Transaction PIN" subtitle="Set or change your 4-digit PIN"
                        onPress={() => navigation.navigate('TransactionPin')}
                    />
                </View>

                {/* ── TRANSACTION LIMITS ─────────────────────────────────── */}
                <Text style={styles.sectionHeader}>TRANSACTION LIMITS</Text>
                <View style={styles.card}>
                    <NavRow
                        icon="swap-horizontal" iconColor={colors.primary} iconBg="rgba(0,82,204,0.1)"
                        title="Daily Transfer Limit"
                        subtitle="Maximum you can transfer per day"
                        valueLabel={formatCurrency(transferLimit)}
                        onPress={() => setLimitModal({
                            open: true,
                            field: 'dailyTransferLimit',
                            title: 'Daily Transfer Limit',
                            value: transferLimit,
                        })}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="cash" iconColor={colors.success} iconBg="rgba(0,196,140,0.1)"
                        title="Daily Withdrawal Limit"
                        subtitle="Maximum you can withdraw per day"
                        valueLabel={formatCurrency(withdrawalLimit)}
                        onPress={() => setLimitModal({
                            open: true,
                            field: 'dailyWithdrawalLimit',
                            title: 'Daily Withdrawal Limit',
                            value: withdrawalLimit,
                        })}
                    />
                </View>

                {/* ── ACCOUNT ────────────────────────────────────────────── */}
                <Text style={styles.sectionHeader}>ACCOUNT</Text>
                <View style={styles.card}>
                    <NavRow
                        icon="person" iconColor={colors.primary} iconBg="rgba(0,82,204,0.1)"
                        title="Account Details" subtitle="View and edit your profile"
                        onPress={() => navigation.navigate('AccountDetails')}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="shield-checkmark" iconColor={colors.success} iconBg="rgba(0,196,140,0.1)"
                        title="KYC Verification" subtitle={user?.kycStatus === 'approved' ? 'Verified ✓' : 'Complete identity verification'}
                        onPress={() => navigation.navigate('BvnVerification')}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="card" iconColor={colors.secondary} iconBg="rgba(99,91,235,0.1)"
                        title="Cards & Bank Accounts" subtitle="Manage linked cards and accounts"
                        onPress={() => navigation.navigate('Cards')}
                    />
                </View>

                {/* ── PREFERENCES ────────────────────────────────────────── */}
                <Text style={styles.sectionHeader}>PREFERENCES</Text>
                <View style={styles.card}>
                    <NavRow
                        icon="moon" iconColor="#64748b" iconBg="rgba(100,116,139,0.1)"
                        title="Dark Mode" subtitle="Coming soon in v2.0"
                        disabled
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="language" iconColor="#64748b" iconBg="rgba(100,116,139,0.1)"
                        title="Language" valueLabel="English (UK)"
                        onPress={() => Alert.alert('Language', 'More languages coming soon.')}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="help-circle" iconColor={colors.info} iconBg="rgba(59,130,246,0.1)"
                        title="Help & Support" subtitle="FAQs, tickets and contact"
                        onPress={() => navigation.navigate('HelpCenter')}
                    />
                </View>

                <Text style={styles.versionText}>VPay v1.0.0 (Build 42)</Text>
            </ScrollView>

            {/* ── Limit edit modal ─────────────────────────────────────── */}
            <LimitModal
                visible={limitModal.open}
                title={`Edit ${limitModal.title}`}
                currentValue={limitModal.value}
                onSave={handleLimitSave}
                onClose={() => setLimitModal((m) => ({ ...m, open: false }))}
                saving={limitSaving}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 16, paddingBottom: 40 },
    sectionHeader: {
        fontSize: 12, fontWeight: '700', color: '#64748b',
        marginTop: 20, marginBottom: 8, marginLeft: 4, letterSpacing: 0.8,
    },
    card: {
        backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 4,
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 8,
    },
    leftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    textGroup: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 1 },
    rowSubtitle: { fontSize: 12, color: colors.textLight },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    valueLabel: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#e2e8f0', marginLeft: 62 },
    versionText: { textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    // Toast
    toast: {
        position: 'absolute', top: 12, alignSelf: 'center',
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, zIndex: 999,
    },
    toastText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalCard: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
    modalInput: {
        borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
        padding: 14, fontSize: 16, color: colors.text, backgroundColor: colors.inputBg,
        marginBottom: 20,
    },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: {
        flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5,
        borderColor: colors.border, alignItems: 'center',
    },
    modalCancelText: { fontSize: 15, fontWeight: '600', color: colors.textMed },
    modalSaveBtn: {
        flex: 1, padding: 14, borderRadius: 12,
        backgroundColor: colors.primary, alignItems: 'center',
    },
    modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
