import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { colors } from '../../styles/colors';
import VelPayLogo from '../../components/VelPayLogo';

const STRENGTH_LEVELS = [
  { label: 'Weak', color: colors.danger, segments: 1 },
  { label: 'Fair', color: colors.warning, segments: 2 },
  { label: 'Good', color: colors.info, segments: 3 },
  { label: 'Strong', color: colors.success, segments: 4 },
];

export default function RegisterScreen({ navigation }) {
  const { setAccessToken } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  React.useEffect(() => {
    // Clear any stale KYC flags when starting a new registration
    AsyncStorage.removeItem('@vpay_kyc_completed');
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid phone number (10-11 digits)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Must contain an uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Must contain a number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        firstName: formData.fullName.split(' ')[0],
        lastName: formData.fullName.split(' ').slice(1).join(' '),
        email: formData.email,
        phone: formData.phoneNumber,
        password: formData.password,
      };

      const response = await authService.register(userData);

      if (response.success && response.data?.user?.id) {
        Alert.alert(
          'Account Created! 🎉',
          'Please verify your phone number to complete registration.',
          [{
            text: 'Continue',
            onPress: () => navigation.replace('VerifyOTP', {
              identifier: formData.phoneNumber,
              type: 'phone',
              userId: response.data.user.id,
            })
          }]
        );
      } else {
        Alert.alert('Registration Failed', response.message || 'Unable to create account. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.status === 409) {
        Alert.alert('Registration Failed', 'Email or phone already registered. Please login instead.');
      } else {
        Alert.alert('Error', error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const idx = Math.min(Math.floor(score / 1.3), 3);
    return STRENGTH_LEVELS[idx];
  };

  const passwordStrength = getPasswordStrength();

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View style={[styles.stepDot, currentStep >= step && styles.stepDotActive]}>
            <Text style={[styles.stepNum, currentStep >= step && styles.stepNumActive]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderPasswordStrengthBar = () => {
    if (!formData.password) return null;
    return (
      <View style={styles.strengthContainer}>
        <View style={styles.strengthBars}>
          {[1, 2, 3, 4].map((seg) => (
            <View
              key={seg}
              style={[
                styles.strengthSegment,
                passwordStrength && seg <= passwordStrength.segments
                  ? { backgroundColor: passwordStrength.color }
                  : { backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>
        {passwordStrength && (
          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
            {passwordStrength.label}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Header */}
          <View style={styles.heroSection}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonTop}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <VelPayLogo />
            </View>
            <Text style={styles.heroTitle}>Create Your Account</Text>
            <Text style={styles.heroSubtitle}>
              Join millions managing money the smart way
            </Text>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form Card */}
          <View style={styles.card}>

            {/* Section: Personal Info */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <Input
              label="Full Name"
              placeholder="e.g. John Adewale"
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
              editable={!loading}
              error={errors.fullName}
              icon="👤"
            />

            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text.toLowerCase())}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              error={errors.email}
              icon="✉️"
            />

            <Input
              label="Phone Number"
              placeholder="08012345678"
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              keyboardType="phone-pad"
              editable={!loading}
              error={errors.phoneNumber}
              icon="📱"
            />

            {/* Divider */}
            <View style={styles.divider} />

            {/* Section: Security */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Secure Your Account</Text>
            </View>

            <View>
              <Input
                label="Password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                editable={!loading}
                error={errors.password}
                icon="🔒"
              />
              <TouchableOpacity
                style={styles.showPasswordBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? 'Hide' : 'Show'} Password
                </Text>
              </TouchableOpacity>
              {renderPasswordStrengthBar()}
            </View>

            <View style={styles.passwordHints}>
              {[
                { rule: formData.password.length >= 8, label: 'At least 8 characters' },
                { rule: /[A-Z]/.test(formData.password), label: 'Uppercase letter' },
                { rule: /[0-9]/.test(formData.password), label: 'Contains a number' },
              ].map((hint) => (
                <View key={hint.label} style={styles.hintRow}>
                  <Text style={[styles.hintDot, hint.rule && styles.hintDotMet]}>
                    {hint.rule ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.hintText, hint.rule && styles.hintTextMet]}>
                    {hint.label}
                  </Text>
                </View>
              ))}
            </View>

            <View>
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                error={errors.confirmPassword}
                icon="🔐"
              />
              <TouchableOpacity
                style={styles.showPasswordBtn}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={[styles.termsRow, errors.agreeTerms && styles.termsRowError]}
              onPress={() => handleInputChange('agreeTerms', !formData.agreeTerms)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, formData.agreeTerms && styles.checkboxActive]}>
                {formData.agreeTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.termsTextWrap}>
                <Text style={styles.termsLabel}>
                  I agree to VelPay's{' '}
                  <Text style={styles.termsLink}>Terms & Conditions</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </TouchableOpacity>
            {errors.agreeTerms && (
              <Text style={styles.errorText}>{errors.agreeTerms}</Text>
            )}
          </View>

          {/* CTA Button */}
          <Button
            title="Create My Account"
            onPress={handleRegister}
            disabled={loading}
            loading={loading}
            style={styles.ctaButton}
          />

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
              style={styles.signInBtn}
            >
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingIndicator visible={loading} message="Creating your account..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  backButtonTop: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 30,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Step Indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  stepNumActive: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  sectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },

  // Password
  showPasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  showPasswordText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  // Strength bar
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'right',
  },

  // Password hints
  passwordHints: {
    backgroundColor: '#F8FAFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintDot: {
    fontSize: 13,
    color: colors.textLighter,
    width: 16,
    textAlign: 'center',
  },
  hintDotMet: {
    color: colors.success,
  },
  hintText: {
    fontSize: 12,
    color: colors.textLight,
  },
  hintTextMet: {
    color: colors.success,
    fontWeight: '600',
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  termsRowError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  termsTextWrap: {
    flex: 1,
  },
  termsLabel: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
    fontWeight: '500',
  },

  // CTA Button
  ctaButton: {
    height: 54,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textLight,
  },
  signInBtn: {
    paddingLeft: 6,
  },
  signInLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
  },
});
