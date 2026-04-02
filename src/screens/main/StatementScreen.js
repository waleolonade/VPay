import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from '../../styles/colors';
import { walletService } from '../../services/walletService';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

const DatePickerModal = ({ visible, onClose, onSelect, title, initialValue }) => {
    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const [selYear, setSelYear] = useState(years[0]);
    const [selMonth, setSelMonth] = useState('01');
    const [selDay, setSelDay] = useState('01');

    const handleConfirm = () => {
        const date = `${selYear}-${selMonth}-${selDay}`;
        onSelect(date);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerCol}>
                            <Text style={styles.colLabel}>Year</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {years.map(y => (
                                    <TouchableOpacity key={y} style={[styles.colItem, selYear === y && styles.colItemActive]} onPress={() => setSelYear(y)}>
                                        <Text style={[styles.colItemText, selYear === y && styles.colItemTextActive]}>{y}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <View style={styles.pickerCol}>
                            <Text style={styles.colLabel}>Month</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {months.map((m, i) => {
                                    const val = (i + 1).toString().padStart(2, '0');
                                    return (
                                        <TouchableOpacity key={m} style={[styles.colItem, selMonth === val && styles.colItemActive]} onPress={() => setSelMonth(val)}>
                                            <Text style={[styles.colItemText, selMonth === val && styles.colItemTextActive]}>{m}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                        <View style={styles.pickerCol}>
                            <Text style={styles.colLabel}>Day</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {days.map(d => (
                                    <TouchableOpacity key={d} style={[styles.colItem, selDay === d && styles.colItemActive]} onPress={() => setSelDay(d)}>
                                        <Text style={[styles.colItemText, selDay === d && styles.colItemTextActive]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <Button title="Confirm Date" onPress={handleConfirm} style={styles.confirmBtn} />
                </View>
            </View>
        </Modal>
    );
};

export default function StatementScreen({ navigation }) {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            Alert.alert('Missing Dates', 'Please select both Start Date and End Date.');
            return;
        }

        setLoading(true);
        try {
            const res = await walletService.getStatement(startDate, endDate);
            if (res.data.success) {
                const transactions = res.data.data.content || [];
                await generatePDF(transactions);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to fetch statement.');
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async (transactions) => {
        let rows = '';
        let totalCredit = 0;
        let totalDebit = 0;

        transactions.forEach(tx => {
            const isCredit = tx.amount > 0;
            if (isCredit) totalCredit += tx.amount;
            else totalDebit += Math.abs(tx.amount);

             rows += `
                <tr>
                    <td>${tx.date || new Date().toLocaleString()}</td>
                    <td>${tx.remarks || tx.description || 'N/A'}</td>
                    <td>${tx.reference || 'N/A'}</td>
                    <td style="color: ${isCredit ? 'green' : 'red'}">₦${Math.abs(tx.amount).toLocaleString()}</td>
                </tr>
            `;
        });

        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo { font-size: 36px; font-weight: bold; color: ${colors.primary}; }
                        .title { font-size: 20px; color: #555; margin-top: 5px; }
                        .info-box { background: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
                        .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
                        .bold { font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                        th { background: ${colors.primary}; color: white; padding: 12px; text-align: left; }
                        td { padding: 12px; border-bottom: 1px solid #ddd; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
                        .summary { margin-top: 30px; padding: 20px; border: 2px solid #eee; border-radius: 10px; display: flex; justify-content: space-around; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">VPay Dashboard</div>
                        <div class="title">Official Account Statement</div>
                    </div>

                    <div class="info-box">
                        <div class="info-row"><span>Account Name:</span> <span class="bold">${user?.firstName} ${user?.lastName}</span></div>
                        <div class="info-row"><span>Email:</span> <span class="bold">${user?.email}</span></div>
                        <div class="info-row"><span>Statement Period:</span> <span class="bold">${startDate} to ${endDate}</span></div>
                        <div class="info-row" style="border: none;"><span>Generated On:</span> <span class="bold">${new Date().toLocaleString()}</span></div>
                    </div>

                    <div class="summary">
                        <div>
                            <div style="color: #666; font-size: 14px;">Total Inflow</div>
                            <div style="color: green; font-size: 24px; font-weight: bold;">₦${totalCredit.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: red; font-size: 14px;">Total Outflow</div>
                            <div style="color: red; font-size: 24px; font-weight: bold;">₦${totalDebit.toLocaleString()}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description / Narration</th>
                                <th>Reference</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows || '<tr><td colspan="4" style="text-align: center;">No transactions found for this period.</td></tr>'}
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>This statement is computer generated and requires no physical signature.</p>
                        <p>Powered by VFD BaaS & VPay Technologies Ltd.</p>
                    </div>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('PDF Error:', error);
            Alert.alert('Error', 'Failed to generate PDF.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Statement</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Ionicons name="document-text-outline" size={30} color={colors.primary} />
                    <Text style={styles.infoText}>
                        Request an official stamped ledger statement reflecting your VFD Pool Account transactions.
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Start Date</Text>
                    <TouchableOpacity style={styles.dateSelector} onPress={() => setShowStartPicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <Text style={[styles.dateText, !startDate && styles.placeholder]}>
                            {startDate || "Select Start Date"}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>End Date</Text>
                    <TouchableOpacity style={styles.dateSelector} onPress={() => setShowEndPicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <Text style={[styles.dateText, !endDate && styles.placeholder]}>
                            {endDate || "Select End Date"}
                        </Text>
                    </TouchableOpacity>

                    <Button 
                        title={loading ? "Fetching Ledger..." : "Generate PDF Statement"} 
                        onPress={handleGenerate}
                        disabled={loading}
                        style={styles.submitButton}
                        icon={<Ionicons name="download-outline" size={20} color="#fff" style={{marginRight: 8}}/>}
                    />
                </View>
            </ScrollView>

            <DatePickerModal 
                visible={showStartPicker} 
                onClose={() => setShowStartPicker(false)} 
                onSelect={setStartDate} 
                title="Select Start Date" 
            />
            <DatePickerModal 
                visible={showEndPicker} 
                onClose={() => setShowEndPicker(false)} 
                onSelect={setEndDate} 
                title="Select End Date" 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.lightBg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: 20 },
    infoBox: {
        backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 24,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8
    },
    infoText: { textAlign: 'center', color: colors.textMed, fontSize: 14, lineHeight: 22, marginTop: 15, paddingHorizontal: 10 },
    formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    submitButton: { width: '100%', marginTop: 24, flexDirection: 'row', justifyContent: 'center' },
    dateSelector: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee',
        borderRadius: 12, padding: 16, marginBottom: 20,
    },
    dateText: { marginLeft: 12, fontSize: 16, color: colors.text, fontWeight: '500' },
    placeholder: { color: colors.textLight },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: height * 0.7 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    pickerCol: { flex: 1, alignItems: 'center', maxHeight: 250 },
    colLabel: { fontSize: 12, fontWeight: '700', color: colors.textLight, marginBottom: 10, textTransform: 'uppercase' },
    colItem: { paddingVertical: 10, width: '100%', alignItems: 'center' },
    colItemActive: { backgroundColor: `${colors.primary}10`, borderRadius: 8 },
    colItemText: { fontSize: 16, color: colors.textMed },
    colItemTextActive: { color: colors.primary, fontWeight: '700' },
    confirmBtn: { width: '100%', marginTop: 10 },
});
