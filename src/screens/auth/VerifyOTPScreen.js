import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { colors } from '../../styles/colors';

export default function VerifyOTPScreen({ route, navigation }) {
    const { identifier, type, userId } = route.params || {};
    const { setAccessToken, setUser } = useAuth();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    const handleOtpChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus logic
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyPress = ({ nativeEvent }, index) => {
        if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length < 6) {
            Alert.alert('Incomplete OTP', 'Please enter a 6-digit OTP code.');
            return;
        }

        setLoading(true);

        try {
            // Mock OTP verification API Call
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (otpString === '123456') { // Mock success code
                setAccessToken('mock-token-from-otp-' + Date.now());
                // Crucial: Set user state to trigger AppNavigator stack switch
                setUser({ id: userId || 'mock-id', phone: identifier, firstName: 'User' });
                // navigation.replace('Main'); // No longer needed, handled by AuthContext state change
            } else {
                Alert.alert('Verification Failed', 'Invalid OTP code entered. (Hint: use 123456)');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred during verification.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        Alert.alert('OTP Sent', 'A new OTP has been sent to ' + (identifier || 'your device'));
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
                        <Text style={styles.title}>Verification</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to {identifier ? `\n${identifier}` : 'your registered contact'}
                        </Text>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formCard}>
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={`otp_${index}`}
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    style={[styles.otpInput, digit && styles.otpInputFilled]}
                                    maxLength={1}
                                    keyboardType="number-pad"
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    editable={!loading}
                                />
                            ))}
                        </View>

                        <Button
                            title="Verify & Proceed"
                            onPress={handleVerify}
                            disabled={loading || otp.join('').length < 6}
                            style={styles.verifyButton}
                        />

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive the code? </Text>
                            <TouchableOpacity onPress={handleResend} disabled={loading}>
                                <Text style={styles.resendLink}>Resend OTP</Text>
                            </TouchableOpacity>
                        </View>
                    </Animatable.View>
                </View>
            </KeyboardAvoidingView>

            <LoadingIndicator visible={loading} message="Verifying Code..." />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FA',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textLight,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 22,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    otpInput: {
        width: 45,
        height: 56,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.inputBg,
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: colors.primary,
        backgroundColor: '#fff',
    },
    verifyButton: {
        height: 56,
        borderRadius: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        marginBottom: 24,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: colors.textLight,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
});
