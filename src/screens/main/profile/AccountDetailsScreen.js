import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../styles/colors';
import { useAuth } from '../../../context/AuthContext';
import { profileService } from '../../../services/profileService';
import { validateName, validateBVN, validateNIN, validateDateOfBirth } from '../../../utils/validators';

const { height, width } = Dimensions.get('window');

// --- Custom Picker Modals ---

const DatePickerModal = ({ visible, onClose, onSelect, title, initialDate }) => {
    const years = Array.from({ length: 80 }, (_, i) => (new Date().getFullYear() - 15 - i).toString());
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const [selYear, setSelYear] = useState(initialDate ? initialDate.getFullYear().toString() : '1995');
    const [selMonth, setSelMonth] = useState(initialDate ? (initialDate.getMonth() + 1).toString().padStart(2, '0') : '01');
    const [selDay, setSelDay] = useState(initialDate ? initialDate.getDate().toString().padStart(2, '0') : '01');

    const handleConfirm = () => {
        const date = new Date(`${selYear}-${selMonth}-${selDay}`);
        onSelect(date);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
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
                    <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirm}>
                        <Text style={styles.modalConfirmText}>Confirm Date</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const GenderPickerModal = ({ visible, onClose, onSelect }) => (
    <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={styles.dropdownContent}>
                <Text style={styles.dropdownTitle}>Select Gender</Text>
                {['Male', 'Female', 'Other'].map(g => (
                    <TouchableOpacity 
                        key={g} 
                        style={styles.dropdownItem} 
                        onPress={() => { onSelect(g.toLowerCase()); onClose(); }}
                    >
                        <Text style={styles.dropdownText}>{g}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
    </Modal>
);

export default function AccountDetailsScreen({ navigation }) {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);

    const [form, setForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
        gender: user?.gender || '',
        addressStreet: user?.addressStreet || user?.address || '',
        addressCity: user?.addressCity || '',
        addressState: user?.addressState || '',
        addressCountry: user?.addressCountry || 'Nigeria',
        bvn: user?.bvn || '',
        nin: user?.nin || '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success && res.data?.user) {
                const ud = res.data.user;
                setForm(prev => ({
                    ...prev,
                    firstName: ud.firstName || '',
                    lastName: ud.lastName || '',
                    email: ud.email || '',
                    phone: ud.phone || '',
                    dateOfBirth: ud.dateOfBirth ? new Date(ud.dateOfBirth) : null,
                    gender: ud.gender || '',
                    addressStreet: ud.addressStreet || ud.address || '',
                    addressCity: ud.addressCity || '',
                    addressState: ud.addressState || '',
                    addressCountry: ud.addressCountry || 'Nigeria',
                    bvn: ud.bvn || '',
                    nin: ud.nin || '',
                }));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to update your avatar.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            handleAvatarUpload(result.assets[0].uri);
        }
    };

    const handleAvatarUpload = async (uri) => {
        setLoading(true);
        try {
            const res = await profileService.uploadAvatar(uri);
            const avatarUrl = res?.data?.avatar || uri;
            setUser(prev => ({ ...prev, avatar: avatarUrl }));
            Alert.alert('Success', 'Profile picture updated successfully');
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to upload avatar.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validate form fields
        const firstNameError = validateName(form.firstName, 'First name');
        if (firstNameError) {
            Alert.alert('Validation Error', firstNameError);
            return;
        }

        const lastNameError = validateName(form.lastName, 'Last name');
        if (lastNameError) {
            Alert.alert('Validation Error', lastNameError);
            return;
        }

        const dobError = validateDateOfBirth(form.dateOfBirth);
        if (dobError) {
            Alert.alert('Validation Error', dobError);
            return;
        }

        const bvnError = validateBVN(form.bvn);
        if (bvnError) {
            Alert.alert('Validation Error', bvnError);
            return;
        }

        const ninError = validateNIN(form.nin);
        if (ninError) return Alert.alert('Invalid Input', ninError);

        setSaving(true);
        try {
            const updates = {
                firstName: form.firstName,
                lastName: form.lastName,
                dateOfBirth: form.dateOfBirth ? form.dateOfBirth.toISOString().split('T')[0] : null,
                gender: form.gender,
                addressStreet: form.addressStreet,
                addressCity: form.addressCity,
                addressState: form.addressState,
                addressCountry: form.addressCountry,
                bvn: form.bvn,
                nin: form.nin,
            };

            const res = await profileService.updateProfile(updates);
            if (res.success) {
                setUser(prev => ({ 
                    ...prev, 
                    ...updates,
                }));
                Alert.alert('Success', 'Account details updated successfully.');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to update account details.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Select Date';
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={pickImage} disabled={loading}>
                            <View style={styles.avatarWrapper}>
                                <Image 
                                    source={user?.avatar ? { uri: user.avatar } : require('../../../../assets/icon.png')} 
                                    style={styles.avatar} 
                                />
                                {loading ? (
                                    <View style={styles.avatarOverlay}><ActivityIndicator color="#fff" /></View>
                                ) : (
                                    <View style={styles.cameraIcon}><Ionicons name="camera" size={14} color="#fff" /></View>
                                )}
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Tap to change profile picture</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>First Name</Text>
                            <TextInput style={styles.input} value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput style={styles.input} value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address (Read Only)</Text>
                        <TextInput style={[styles.input, styles.readOnly]} value={form.email} editable={false} />
                    </View>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Gender</Text>
                            <TouchableOpacity style={styles.selector} onPress={() => setShowGenderPicker(true)}>
                                <Text style={[styles.selectorText, !form.gender && styles.placeholder]}>
                                    {form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : 'Select'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color={colors.textLight} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.formGroup, { flex: 1.5 }]}>
                            <Text style={styles.label}>Date of Birth</Text>
                            <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
                                <Text style={[styles.selectorText, !form.dateOfBirth && styles.placeholder]}>
                                    {formatDate(form.dateOfBirth)}
                                </Text>
                                <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Address Information</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Street Address</Text>
                        <TextInput 
                            style={[styles.input, { height: 70, textAlignVertical: 'top' }]} 
                            multiline 
                            value={form.addressStreet} 
                            onChangeText={(v) => setForm({ ...form, addressStreet: v })} 
                            placeholder="e.g. 123 VPay Way" 
                        />
                    </View>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>City</Text>
                            <TextInput style={styles.input} value={form.addressCity} onChangeText={(v) => setForm({ ...form, addressCity: v })} />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>State</Text>
                            <TextInput style={styles.input} value={form.addressState} onChangeText={(v) => setForm({ ...form, addressState: v })} />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>KYC Information</Text>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>BVN (11 Digits)</Text>
                        <TextInput 
                            style={[styles.input, form.bvn && styles.readOnly]} 
                            value={form.bvn} 
                            onChangeText={(v) => setForm({ ...form, bvn: v })} 
                            keyboardType="numeric"
                            maxLength={11}
                            editable={!form.bvn}
                        />
                        {form.bvn && <Text style={styles.verifiedHint}><Ionicons name="checkmark-circle" size={12} /> Verified & Locked</Text>}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>NIN (11 Digits)</Text>
                        <TextInput 
                            style={[styles.input, form.nin && styles.readOnly]} 
                            value={form.nin} 
                            onChangeText={(v) => setForm({ ...form, nin: v })} 
                            keyboardType="numeric"
                            maxLength={11}
                            editable={!form.nin}
                        />
                        {form.nin && <Text style={styles.verifiedHint}><Ionicons name="checkmark-circle" size={12} /> Verified & Locked</Text>}
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Account Details</Text>}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <DatePickerModal 
                visible={showDatePicker} 
                onClose={() => setShowDatePicker(false)} 
                onSelect={(d) => setForm({ ...form, dateOfBirth: d })} 
                title="Select Date of Birth"
                initialDate={form.dateOfBirth}
            />
            <GenderPickerModal 
                visible={showGenderPicker} 
                onClose={() => setShowGenderPicker(false)} 
                onSelect={(g) => setForm({ ...form, gender: g })} 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { padding: 20 },
    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0', borderWidth: 3, borderColor: '#fff' },
    avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    cameraIcon: { position: 'absolute', bottom: 2, right: 2, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
    avatarHint: { marginTop: 10, color: colors.textLight, fontSize: 13, fontWeight: '500' },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
    formRow: { flexDirection: 'row', marginBottom: 0 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 15, fontSize: 15, color: colors.text },
    readOnly: { backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' },
    selector: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectorText: { fontSize: 15, color: colors.text },
    placeholder: { color: '#94a3b8' },
    verifiedHint: { fontSize: 11, color: '#10b981', fontWeight: '700', marginTop: 6, marginLeft: 4 },
    saveBtn: { backgroundColor: colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: height * 0.75 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
    pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    pickerCol: { flex: 1, alignItems: 'center', height: 280 },
    colLabel: { fontSize: 11, fontWeight: '800', color: colors.textLight, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    colItem: { paddingVertical: 12, width: '85%', alignItems: 'center', marginVertical: 2 },
    colItemActive: { backgroundColor: `${colors.primary}15`, borderRadius: 12 },
    colItemText: { fontSize: 17, color: colors.textMed, fontWeight: '500' },
    colItemTextActive: { color: colors.primary, fontWeight: '800' },
    modalConfirmBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 16, alignItems: 'center' },
    modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    
    dropdownContent: { backgroundColor: '#fff', marginHorizontal: 25, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 15, alignSelf: 'center', width: width - 50, position: 'absolute', top: height * 0.35 },
    dropdownTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 20, textAlign: 'center' },
    dropdownItem: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
    dropdownText: { fontSize: 16, color: colors.textMed, fontWeight: '600' }
});
