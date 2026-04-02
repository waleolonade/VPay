import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { savingsService } from '../../services/savingsService';

export default function AutoSaveScreen({ navigation }) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [rule, setRule] = useState('round_up'); // round_up, percentage, daily_fixed
    const [ruleValue, setRuleValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSaveSettings = async () => {
        if (isEnabled && rule !== 'round_up' && !ruleValue) {
            Alert.alert('Error', 'Please provide a value for your save rule.');
            return;
        }

        setLoading(true);
        try {
            await savingsService.createSavings({
                planName: 'Smart Auto-Save',
                targetAmount: 0,
                frequency: 'daily',
                isAutoSave: isEnabled,
                autoSaveRule: rule,
                ruleValue: ruleValue || 0
            });
            Alert.alert('Success', 'Auto-savings preferences updated successfully!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update auto-save settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="flash" size={32} color={colors.primary} />
                </View>
                <Text style={styles.title}>Smart Auto-Savings</Text>
                <Text style={styles.subtitle}>Let AI grow your wealth passively by siphoning small amounts from your daily spending.</Text>
            </View>

            <View style={styles.toggleCard}>
                <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>Enable Auto-Save</Text>
                    <Text style={styles.toggleDesc}>Triggered on every transaction</Text>
                </View>
                <Switch
                    value={isEnabled}
                    onValueChange={setIsEnabled}
                    trackColor={{ false: '#ddd', true: colors.primary }}
                    thumbColor="#fff"
                />
            </View>

            {isEnabled && (
                <View style={styles.rulesSection}>
                    <Text style={styles.sectionTitle}>Select Savings Rule</Text>

                    <TouchableOpacity
                        style={[styles.ruleCard, rule === 'round_up' && styles.ruleCardActive]}
                        onPress={() => setRule('round_up')}
                    >
                        <Ionicons name="pie-chart" size={24} color={rule === 'round_up' ? colors.primary : colors.text} />
                        <View style={styles.ruleInfo}>
                            <Text style={styles.ruleName}>Round-up Spare Change</Text>
                            <Text style={styles.ruleDesc}>Spend ₦900, we'll save ₦100 for you.</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.ruleCard, rule === 'percentage' && styles.ruleCardActive]}
                        onPress={() => setRule('percentage')}
                    >
                        <Ionicons name="analytics" size={24} color={rule === 'percentage' ? colors.primary : colors.text} />
                        <View style={styles.ruleInfo}>
                            <Text style={styles.ruleName}>Percentage of Spend</Text>
                            <Text style={styles.ruleDesc}>Save a fixed % of every transaction.</Text>
                        </View>
                    </TouchableOpacity>

                    {rule === 'percentage' && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Percentage (%)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="e.g. 5"
                                value={ruleValue}
                                onChangeText={setRuleValue}
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.ruleCard, rule === 'daily_fixed' && styles.ruleCardActive]}
                        onPress={() => setRule('daily_fixed')}
                    >
                        <Ionicons name="calendar" size={24} color={rule === 'daily_fixed' ? colors.primary : colors.text} />
                        <View style={styles.ruleInfo}>
                            <Text style={styles.ruleName}>Daily Fixed Amount</Text>
                            <Text style={styles.ruleDesc}>Save exactly X amount every day.</Text>
                        </View>
                    </TouchableOpacity>

                    {rule === 'daily_fixed' && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Daily Amount (₦)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="e.g. 1000"
                                value={ruleValue}
                                onChangeText={setRuleValue}
                            />
                        </View>
                    )}
                </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={loading}>
                <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Preferences'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
    iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 10 },
    subtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
    toggleCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    toggleInfo: { flex: 1 },
    toggleTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
    toggleDesc: { fontSize: 13, color: colors.textLight },
    rulesSection: { marginBottom: 30 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 15, marginLeft: 5 },
    ruleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
    ruleCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
    ruleInfo: { marginLeft: 15, flex: 1 },
    ruleName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
    ruleDesc: { fontSize: 12, color: colors.textLight },
    inputContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
    inputLabel: { fontSize: 13, color: colors.textLight, marginBottom: 8 },
    input: { fontSize: 16, color: colors.text, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
    saveBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
