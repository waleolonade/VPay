import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import Header from '../../../components/common/Header';
import { profileService } from '../../../services/profileService';
import { useAuth } from '../../../context/AuthContext';

export default function TransactionPinScreen({ navigation }) {
    const { user, setUser } = useAuth();
    const [pin, setPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [step, setStep] = useState(1); // 1: Enter New PIN, 2: Confirm PIN
    const [isLoading, setIsLoading] = useState(false);

    const pinRefs = useRef([]);
    const confirmRefs = useRef([]);

    const handlePinChange = (value, index, type) => {
        if (type === 'pin') {
            const newPin = [...pin];
            newPin[index] = value;
            setPin(newPin);
            if (value && index < 3) {
                pinRefs.current[index + 1].focus();
            }
        } else {
            const newConfirmPin = [...confirmPin];
            newConfirmPin[index] = value;
            setConfirmPin(newConfirmPin);
            if (value && index < 3) {
                confirmRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyPress = (e, index, type) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (type === 'pin' && !pin[index] && index > 0) {
                pinRefs.current[index - 1].focus();
            } else if (type === 'confirm' && !confirmPin[index] && index > 0) {
                confirmRefs.current[index - 1].focus();
            }
        }
    };

    const handleContinue = () => {
        if (pin.some(digit => digit === '')) {
            return Alert.alert('Error', 'Please enter a 4-digit PIN');
        }
        setStep(2);
        setTimeout(() => confirmRefs.current[0].focus(), 100);
    };

    const handleSubmit = async () => {
        const pinString = pin.join('');
        const confirmPinString = confirmPin.join('');

        if (pinString !== confirmPinString) {
            Alert.alert('Error', 'PINs do not match');
            setConfirmPin(['', '', '', '']);
            setStep(1);
            setTimeout(() => pinRefs.current[0].focus(), 100);
            return;
        }

        setIsLoading(true);
        try {
            await profileService.setPin(pinString);
            setUser({ ...user, hasPIN: true });
            Alert.alert('Success', 'Transaction PIN set successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to set PIN');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title={user?.hasPIN ? "Change Payment PIN" : "Set Payment PIN"}
                onBackPress={() => navigation.goBack()}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.mainContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={40} color={colors.primary} />
                    </View>

                    <Text style={styles.title}>
                        {step === 1 ? "Create your payment PIN" : "Confirm your payment PIN"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 1
                            ? "This PIN will be used to authorize all your transactions."
                            : "Please re-enter your PIN to confirm."}
                    </Text>

                    <View style={styles.pinContainer}>
                        {(step === 1 ? pin : confirmPin).map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={el => (step === 1 ? pinRefs : confirmRefs).current[index] = el}
                                style={styles.pinInput}
                                keyboardType="number-pad"
                                maxLength={1}
                                secureTextEntry
                                value={digit}
                                onChangeText={val => handlePinChange(val, index, step === 1 ? 'pin' : 'confirm')}
                                onKeyPress={e => handleKeyPress(e, index, step === 1 ? 'pin' : 'confirm')}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={step === 1 ? handleContinue : handleSubmit}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? "Processing..." : (step === 1 ? "Continue" : "Set PIN")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 40,
    },
    pinInput: {
        width: 60,
        height: 60,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: colors.text,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: colors.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
});
