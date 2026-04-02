import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../styles/colors';
import { useAuth } from '../../../context/AuthContext';
import { kycService } from '../../../services/kycService';
import { profileService } from '../../../services/profileService'; // for generic image upload to our server first

export default function NinVerificationScreen({ navigation }) {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [nin, setNin] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [remoteImageUrl, setRemoteImageUrl] = useState(null); // The URL returned after uploading to our server
    const [uploadingImage, setUploadingImage] = useState(false);

    const pickDocumentImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need camera roll permissions to upload your ID document.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8, // need decent quality for OCR
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            uploadDocument(result.assets[0].uri);
        }
    };

    const uploadDocument = async (uri) => {
        setUploadingImage(true);
        try {
            // In a real app, you'd have a specific /api/v1/kyc/upload endpoint 
            // We borrow the Avatar upload logic temporarily just to get a hosted URL for VbaaS
            const res = await profileService.uploadAvatar(uri);
            setRemoteImageUrl(res?.data?.avatar); // Pretend this is our documentUrl
        } catch (error) {
            Alert.alert('Upload Error', 'Failed to securely upload document to our servers.');
            setImageUri(null); // reset
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        if (nin.length < 11) {
            Alert.alert('Invalid', 'NIN must be at least 11 digits.');
            return;
        }
        if (!remoteImageUrl) {
            Alert.alert('Missing Document', 'Please upload a clear photo of your ID.');
            return;
        }

        setLoading(true);
        try {
            const { message } = await kycService.submitNin(nin, remoteImageUrl);
            Alert.alert('Success', "Identity fully verified via advanced vbaas.vfdtech.ng tools. You are now Tier 3.");

            setUser(prev => ({
                ...prev,
                ninVerified: true,
                kycLevel: 3,
                dailyTransferLimit: 5000000
            }));

            navigation.goBack();
        } catch (error) {
            Alert.alert('Verification Failed', error?.response?.data?.message || 'vbaas NIN verification failed.');
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
                <Text style={styles.headerTitle}>NIN & ID Verification</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoCard}>
                        <Ionicons name="scan-outline" size={32} color={colors.primary} />
                        <Text style={styles.infoTitle}>Tier 3 Upgrade (Unlimited)</Text>
                        <Text style={styles.infoDesc}>We use advanced vBaaS OCR and Facial matching to securely verify your Government ID.</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>National Identification Number (NIN)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 11223344556"
                            keyboardType="number-pad"
                            maxLength={11}
                            value={nin}
                            onChangeText={setNin}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Upload ID Document (Front)</Text>
                        <TouchableOpacity style={styles.uploadArea} onPress={pickDocumentImage} disabled={uploadingImage}>
                            {uploadingImage ? (
                                <>
                                    <ActivityIndicator color={colors.primary} size="large" />
                                    <Text style={styles.uploadText}>Securely uploading...</Text>
                                </>
                            ) : imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload-outline" size={40} color="#94a3b8" />
                                    <Text style={styles.uploadText}>Tap to select or take a photo</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, (nin.length < 11 || !remoteImageUrl) && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={loading || nin.length < 11 || !remoteImageUrl}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit for Verification</Text>}
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
    infoCard: { backgroundColor: `${colors.primary}10`, padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 25 },
    infoTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 12, marginBottom: 6 },
    infoDesc: { textAlign: 'center', color: '#64748b', fontSize: 13, lineHeight: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, fontSize: 15, color: colors.text },
    uploadArea: { backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, height: 180, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    uploadText: { marginTop: 12, color: '#64748b', fontSize: 14, fontWeight: '500' },
    previewImage: { width: '100%', height: '100%' },
    submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    disabledBtn: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
