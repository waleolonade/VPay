import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { colors } from '../../styles/colors';

/**
 * ForgotPasswordScreen Component
 * Professional password reset with VFDTech API standards
 * 
 * Features:
 * - Email/Phone identification
 * - Structured API response handling
 * - OTP verification flow
 * - Professional error messaging
 * - Multi-step reset process
 */
export default function ForgotPasswordScreen({ navigation }) {
  // Step tracking: 'identify' -> 'verify' -> 'reset'
  const [step, setStep] = useState('identify');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Step 1: Validate identifier (email or phone)
   * Similar to customer validation in Bills Payment API
   */
  const validateIdentifier = () => {
    const newErrors = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) && !/^[0-9]{10,11}$/.test(identifier)) {
      newErrors.identifier = 'Enter valid email or phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Step 2: Validate OTP
   */
  const validateOTP = () => {
    const newErrors = {};

    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!/^[0-9]{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Step 3: Validate new password
   */
  const validatePassword = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain a number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle request reset (Step 1)
   * Uses VFDTech-style response: status "00" (success), "99" (error)
   */
  const handleRequestReset = async () => {
    if (!validateIdentifier()) return;

    setLoading(true);
    try {
      const response = await requestPasswordReset(identifier);

      if (response.status === '00') {
        setSuccessMessage(`OTP sent to ${identifier}`);
        setStep('verify');
      } else {
        Alert.alert('Error', response.message || 'Failed to send reset code');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle verify OTP (Step 2)
   */
  const handleVerifyOTP = async () => {
    if (!validateOTP()) return;

    setLoading(true);
    try {
      const response = await verifyResetOTP(identifier, otp);

      if (response.status === '00') {
        setSuccessMessage('OTP verified. Now set your new password.');
        setStep('reset');
        setOtp('');
      } else if (response.status === '99') {
        setErrors({ otp: 'Invalid or expired OTP' });
        Alert.alert('Verification Failed', response.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle reset password (Step 3)
   */
  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const response = await resetPassword(identifier, otp, newPassword);

      if (response.status === '00') {
        Alert.alert(
          'Success',
          'Your password has been reset. Please sign in with your new password.',
          [{ text: 'Back to Login', onPress: () => navigation.replace('Login') }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to reset password');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Mock API calls
  const requestPasswordReset = async (email) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: '00',
          message: 'OTP sent successfully',
          data: { requestId: 'req-' + Date.now() },
        });
      }, 1500);
    });
  };

  const verifyResetOTP = async (email, otpCode) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock: accept OTP "123456"
        if (otpCode === '123456') {
          resolve({
            status: '00',
            message: 'OTP verified',
            data: { token: 'reset-token-' + Date.now() },
          });
        } else {
          resolve({
            status: '99',
            message: 'Invalid OTP. Try "123456" for demo',
          });
        }
      }, 1500);
    });
  };

  const resetPassword = async (email, otpCode, pwd) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: '00',
          message: 'Password reset successful',
          data: { success: true },
        });
      }, 1500);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Recover access to your account</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, step !== 'identify' && styles.progressStepDone]} />
          <View style={[styles.progressStep, step === 'reset' && styles.progressStepDone]} />
          <View style={[styles.progressStep, step === 'reset' && styles.progressStepDone]} />
        </View>

        {/* Success Message */}
        {successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {successMessage}</Text>
          </View>
        )}

        {/* Step 1: Identify User */}
        {step === 'identify' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Enter your email or phone</Text>

            <View style={styles.inputGroup}>
              <Input
                label="Email or Phone"
                placeholder="your@email.com or 08012345678"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (errors.identifier) setErrors({});
                }}
                keyboardType="email-address"
                editable={!loading}
                error={errors.identifier}
                icon="📧"
              />
              {errors.identifier && (
                <Text style={styles.errorText}>{errors.identifier}</Text>
              )}
            </View>

            <Button
              title={loading ? 'Sending...' : 'Send Reset Code'}
              onPress={handleRequestReset}
              disabled={loading}
              style={styles.actionButton}
            />
          </View>
        )}

        {/* Step 2: Verify OTP */}
        {step === 'verify' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Enter the verification code</Text>
            <Text style={styles.stepSubtitle}>
              We sent a 6-digit code to {identifier}
            </Text>

            <View style={styles.inputGroup}>
              <Input
                label="Verification Code"
                placeholder="000000"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                  if (errors.otp) setErrors({});
                }}
                keyboardType="numeric"
                editable={!loading}
                error={errors.otp}
                icon="🔐"
                maxLength={6}
              />
              {errors.otp && (
                <Text style={styles.errorText}>{errors.otp}</Text>
              )}
            </View>

            <Button
              title={loading ? 'Verifying...' : 'Verify Code'}
              onPress={handleVerifyOTP}
              disabled={loading}
              style={styles.actionButton}
            />

            <TouchableOpacity
              onPress={handleRequestReset}
              disabled={loading}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>Didn't receive code? Resend</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create new password</Text>
            <Text style={styles.stepSubtitle}>
              Make it strong and secure
            </Text>

            <View style={styles.inputGroup}>
              <Input
                label="New Password"
                placeholder="Min 8 characters with uppercase & number"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
                error={errors.newPassword}
                icon="🔐"
              />
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                error={errors.confirmPassword}
                icon="✓"
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <Button
              title={loading ? 'Resetting...' : 'Reset Password'}
              onPress={handleResetPassword}
              disabled={loading}
              style={styles.actionButton}
            />
          </View>
        )}

        {/* Back to Login Link */}
        {step === 'identify' && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.replace('Login')} disabled={loading}>
              <Text style={styles.loginLink}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Loading Indicator */}
      <LoadingIndicator visible={loading} message="Processing..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressStepDone: {
    backgroundColor: colors.primary,
  },
  successBanner: {
    backgroundColor: colors.success + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 24,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  stepContent: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  actionButton: {
    height: 48,
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  loginLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
});
