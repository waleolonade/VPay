import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import { useAuth } from '../../../context/AuthContext';
import { kycService } from '../../../services/kycService';

export default function BvnVerificationScreen({ navigation }) {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [bvn, setBvn] = useState('');
    const [dob, setDob] = useState('');

    const handleSubmit = async () => {
        if (bvn.length !== 11) {
            Alert.alert('Invalid', 'BVN must be exactly 11 digits.');
            return;
        }
        if (!dob) {
            Alert.alert('Invalid', 'Date of Birth is required.');
            return;
        }

        setLoading(true);
        try {
            const { message } = await kycService.submitBvn(bvn, dob);
            Alert.alert('Success', "BVN verified securely via vbaas.vfdtech.ng. You are now Tier 2.");

            // Upgrade local user state to reflect new Tier immediately
            setUser(prev => ({
                ...prev,
                bvnVerified: true,
                kycLevel: 2,
                dailyTransferLimit: 500000
            }));

            navigation.goBack();
        } catch (error) {
            Alert.alert('Verification Failed', error?.response?.data?.message || 'vbaas BVN verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>BVN Verification (Tier 2)</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoCard}>
                        <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
                        <Text style={styles.infoTitle}>Bank-Grade Security</Text>
                        <Text style={styles.infoDesc}>Your BVN allows us to securely verify your identity with VFD Tech. We do not store your BVN; it is passed securely to NIBSS for matching.</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Bank Verification Number (BVN)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 22233344455"
                            keyboardType="number-pad"
                            maxLength={11}
                            value={bvn}
                            onChangeText={setBvn}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 1990-05-24"
                            value={dob}
                            onChangeText={setDob}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, (bvn.length !== 11 || !dob) && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={loading || bvn.length !== 11 || !dob}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Verify Identity</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: 20 },
    infoCard: { backgroundColor: `${colors.primary}10`, padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 30 },
    infoTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 12, marginBottom: 6 },
    infoDesc: { textAlign: 'center', color: '#64748b', fontSize: 13, lineHeight: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, fontSize: 15, color: colors.text },
    submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    disabledBtn: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
