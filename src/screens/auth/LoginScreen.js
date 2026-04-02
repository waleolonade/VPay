import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
  Linking,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { biometricService } from '../../services/biometricService';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorPopup from '../../components/common/ErrorPopup';
import { colors } from '../../styles/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STORAGE_KEYS = {
  BIOMETRIC_ENABLED: '@vpay_biometric_enabled',
  SAVED_PHONE: '@vpay_saved_phone',
  HAS_LOGGED_IN: '@vpay_has_logged_in',
  LOGIN_ATTEMPTS: '@vpay_login_attempts',
  LOCK_UNTIL: '@vpay_lock_until',
  KYC_COMPLETED: '@vpay_kyc_completed',
};

// ─────────────────────────────────────────────
// OPay-Style 2-Step Login
// Step 1 → Enter Phone
// Step 2 → Enter Password (or OTP)
// ─────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const { setAccessToken, setUser } = useAuth();

  // ── Step state ──
  // 'phone'  → enter phone number
  // 'password' → enter password
  // 'otp'    → enter otp
  const [step, setStep] = useState('phone');

  // ── Form values ──
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // ── User recognition (from backend, optional) ──
  const [userProfile, setUserProfile] = useState(null);

  // ── Status flags ──
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const [isOnline, setIsOnline] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('fingerprint');

  // ── UI state ──
  const [errors, setErrors] = useState({});
  const [popupConfig, setPopupConfig] = useState({ visible: false, title: '', message: '', type: 'error' });

  // ── Refs ──
  const otpRefs = useRef([]);
  const passwordRef = useRef(null);

  // ── Animations ──
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  // ─────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    // Network
    try {
      const unsubscribe = NetInfo.addEventListener(state => setIsOnline(state.isConnected ?? true));
    } catch { }

    // Biometrics
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('face');
        }
        const bioEnabled = await biometricService.isEnabled();
        setBiometricEnabled(bioEnabled);
      }
    } catch { }

    // Restore saved phone + profile picture
    try {
      const savedPhone = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PHONE);
      const kycCompleted = await AsyncStorage.getItem(STORAGE_KEYS.KYC_COMPLETED);

      if (savedPhone) {
        setPhone(savedPhone);

        // Silently try to fetch profile pic
        try {
          const formatted = savedPhone.startsWith('0')
            ? '+234' + savedPhone.slice(1)
            : savedPhone;
          const res = await authService.getPublicProfile(formatted);
          if (res?.success && res?.data) {
            setUserProfile(res.data);
          }
        } catch { }

        // If user is fully verified/registered, skip the phone step and go to password
        if (kycCompleted === 'true') {
          setStep('password');
        }
      }
    } catch { }

    // Account lock
    checkAccountLock();
  };

  // ─────────────────────────────────────────────
  // Account Lock
  // ─────────────────────────────────────────────
  const checkAccountLock = async () => {
    try {
      const lockUntil = await AsyncStorage.getItem(STORAGE_KEYS.LOCK_UNTIL);
      if (lockUntil) {
        const lockTime = parseInt(lockUntil, 10);
        if (Date.now() < lockTime) {
          setIsLocked(true);
          setLockTimeRemaining(Math.ceil((lockTime - Date.now()) / 1000));
        } else {
          await AsyncStorage.multiRemove([STORAGE_KEYS.LOCK_UNTIL, STORAGE_KEYS.LOGIN_ATTEMPTS]);
        }
      }
    } catch { }
  };

  useEffect(() => {
    if (!isLocked || lockTimeRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockTimeRemaining(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          AsyncStorage.multiRemove([STORAGE_KEYS.LOCK_UNTIL, STORAGE_KEYS.LOGIN_ATTEMPTS]);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked, lockTimeRemaining]);

  const recordFailedAttempt = async () => {
    const attemptsStr = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, String(attempts));
    if (attempts >= 5) {
      const lockUntil = Date.now() + 30 * 60 * 1000;
      await AsyncStorage.setItem(STORAGE_KEYS.LOCK_UNTIL, String(lockUntil));
      setIsLocked(true);
      setLockTimeRemaining(30 * 60);
      return true;
    }
    return false;
  };

  const formatLockTime = s => `${Math.floor(s / 60)}m ${s % 60}s`;

  // ─────────────────────────────────────────────
  // OTP countdown
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => setOtpCountdown(p => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const showPopup = (title, message, type = 'error') =>
    setPopupConfig({ visible: true, title, message, type });

  const animateStepTransition = () => {
    stepAnim.setValue(SCREEN_WIDTH * 0.3);
    Animated.timing(stepAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
  };

  const getFormattedPhone = () => {
    if (phone.startsWith('0') && phone.length === 11) return '+234' + phone.slice(1);
    if (phone.startsWith('234')) return '+' + phone;
    return phone;
  };

  // ─────────────────────────────────────────────
  // STEP 1 — Phone validation + Continue
  // ─────────────────────────────────────────────
  const handleContinue = async () => {
    const clean = phone.replace(/\D/g, '');
    if (!clean) {
      setErrors({ phone: 'Please enter your phone number' });
      return;
    }
    if (!/^(0[789][01]\d{8}|[789][01]\d{8})$/.test(clean)) {
      setErrors({ phone: 'Enter a valid Nigerian phone number (e.g. 0801 234 5678)' });
      return;
    }

    setErrors({});
    setLoading(true);
    setLoadingText('Verifying...');

    // Try to fetch user profile for personalization (optional)
    try {
      const res = await authService.getPublicProfile(getFormattedPhone());
      if (res?.success && res?.data) {
        setUserProfile(res.data);
      }
    } catch { }

    setLoading(false);

    // Transition to password step
    animateStepTransition();
    setStep('password');
    setTimeout(() => passwordRef.current?.focus(), 400);
  };

  // ─────────────────────────────────────────────
  // STEP 2 — Password Login
  // ─────────────────────────────────────────────
  const handlePasswordLogin = async () => {
    if (!isOnline) { showPopup('No Internet', 'Check your connection and try again.'); return; }
    if (isLocked) { showPopup('Account Locked', `Try again in ${formatLockTime(lockTimeRemaining)}`, 'warning'); return; }
    if (!password) { setErrors({ password: 'Please enter your password' }); return; }
    if (password.length < 6) { setErrors({ password: 'Password must be at least 6 characters' }); return; }
    setErrors({});

    setLoading(true);
    setLoadingText('Signing in...');
    try {
      const response = await authService.login(phone, password);
      console.log('Login response:', response);

      // Handle mandatory OTP for admins
      if (response.success && response.requireOTP) {
        setLoginType('admin');
        setUserProfile(prev => ({ ...prev, email: response.data?.email }));
        
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setOtpCountdown(600); // 10 minutes for admin OTP
        animateStepTransition();
        
        showPopup('Verification Required', response.message || 'Please check your email for the verification code.', 'success');
        setTimeout(() => otpRefs.current[0]?.focus(), 400);
        return;
      }

      if (response.success && response.data?.accessToken) {
        const token = response.data.accessToken;
        console.log('Setting access token:', token, response.data.refreshToken);
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PHONE, phone);
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_LOGGED_IN, 'true');
        await AsyncStorage.multiRemove([STORAGE_KEYS.LOGIN_ATTEMPTS, STORAGE_KEYS.LOCK_UNTIL]);

        if (response.data.user?.kycLevel >= 1) {
          await AsyncStorage.setItem(STORAGE_KEYS.KYC_COMPLETED, 'true');
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.KYC_COMPLETED);
        }

        // Persist token for future biometric logins (only if biometric is enabled or available)
        try {
          const bioAvailable = await biometricService.isAvailable();
          const bioEnabled   = await biometricService.isEnabled();
          if (bioAvailable) {  // Always save if available (enable flag checked in service)
            try {
              await biometricService.saveLoginToken(token);
            } catch {}
          }
        } catch { /* biometric storage is best-effort */ }

        setAccessToken(token, response.data.refreshToken);
        setUser(response.data.user || { phone });
      } else {
        const locked = await recordFailedAttempt();
        showPopup(locked ? 'Account Locked' : 'Login Failed',
          locked ? 'Too many failed attempts. Locked for 30 minutes.' : (response.message || 'Invalid password. Please try again.'),
          locked ? 'warning' : 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Network error (no response from server)
      if (!err.response) {
        const isNetworkError = err.message?.includes('Network') || 
                               err.message?.includes('ECONNREFUSED') || 
                               err.message?.includes('ETIMEDOUT') ||
                               err.code === 'ECONNREFUSED' ||
                               err.code === 'ETIMEDOUT' ||
                               err.code === 'ERR_NETWORK';
        
        if (isNetworkError) {
          showPopup(
            'Network Error',
            'Cannot connect to server. Make sure your internet is working and the backend is running.',
            'error'
          );
        } else {
          showPopup('Connection Error', err.message || 'Failed to connect. Please try again.', 'error');
        }
      } else if (err.response?.status === 401) {
        const locked = await recordFailedAttempt();
        showPopup(locked ? 'Account Locked' : 'Incorrect Password',
          locked ? 'Too many failed attempts. Locked for 30 minutes.' : 'Incorrect password. Please try again.',
          locked ? 'warning' : 'error');
      } else if (err.response?.status === 500) {
        showPopup('Server Error', 'The server encountered an error. Please try again later.', 'error');
      } else {
        showPopup('Error', err.message || 'Something went wrong. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // OTP Flow
  // ─────────────────────────────────────────────
  const handleSwitchToOTP = async () => {
    setLoading(true);
    setLoadingText('Sending OTP...');
    try {
      const res = await authService.requestOTP(getFormattedPhone());
      if (res.success) {
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setOtpCountdown(60);
        animateStepTransition();
        setTimeout(() => otpRefs.current[0]?.focus(), 400);
      } else {
        showPopup('Failed', res.message || 'Failed to send OTP. Try again.');
      }
    } catch (err) {
      console.error('OTP request error:', err);
      
      // Network error handling
      if (!err.response) {
        showPopup(
          'Network Error',
          'Cannot connect to server. Make sure your internet is working and the backend is running.',
          'error'
        );
      } else {
        showPopup(
          err.response?.status === 500 ? 'Server Error' : 'Failed to Send OTP',
          err.message || 'Failed to send OTP. Please try again.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 6) return;

    setLoading(true);
    setLoadingText('Verifying...');
    try {
      const res = loginType === 'admin' 
        ? await authService.verifyAdminOtp(userProfile?.email || phone, code)
        : await authService.verifyOTP(getFormattedPhone(), code);

      if (res.success && res.data?.accessToken) {
        const token = res.data.accessToken;
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PHONE, phone);
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_LOGGED_IN, 'true');

        if (res.data.user?.kycLevel >= 1) {
          await AsyncStorage.setItem(STORAGE_KEYS.KYC_COMPLETED, 'true');
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.KYC_COMPLETED);
        }

        // Persist token for biometric if available (enable happens via button)
        try {
          const bioAvailable = await biometricService.isAvailable();
          if (bioAvailable) {
            await biometricService.saveLoginToken(token);
          }
        } catch { /* best-effort */ }

        setAccessToken(token, res.data.refreshToken);
        setUser(res.data.user || { phone });
      } else {
        showPopup('Invalid Code', res.message || 'The code is invalid or has expired.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      
      // Network error handling
      if (!err.response) {
        showPopup(
          'Network Error',
          'Cannot connect to server. Make sure your internet is working and the backend is running.',
          'error'
        );
      } else {
        showPopup(
          err.response?.status === 500 ? 'Server Error' : 'Verification Failed',
          err.message || 'Verification failed. Please try again.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, index) => {
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
    if (val && index === 5) {
      const full = newOtp.join('');
      if (full.length === 6) setTimeout(handleVerifyOTP, 200);
    }
  };

  const handleOtpKey = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ─────────────────────────────────────────────
  // Biometric — Enable or Login
  // ─────────────────────────────────────────────
  const handleBiometric = async () => {
    if (!biometricAvailable) return;

    setLoading(true);
    setLoadingText(biometricEnabled ? 'Verifying identity…' : 'Setting up biometrics…');

    try {
      // Show biometric prompt
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricEnabled ? 'Sign in to VPay' : 'Enable fingerprint login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: biometricEnabled ? 'Use PIN instead' : 'Not now',
      });

      if (!result.success) {
        setLoading(false);
        if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
          showPopup(
            'Authentication Failed', 
            'Biometric check was not completed. Please try again or use password.',
            'error'
          );
        }
        return;
      }

      if (!biometricEnabled) {
        // ENABLE flow: set flag + save current session token (will get from context after)
        await biometricService.enable();
        // Since we just logged in or will log in, token will be saved in password/OTP flows
        setBiometricEnabled(true);
        showPopup(
          'Biometrics Enabled!', 
          'Fingerprint login activated. Use it next time!',
          'success'
        );
      } else {
        // LOGIN flow: retrieve saved token
        const storedToken = await biometricService.getLoginToken();
        if (!storedToken) {
          setLoading(false);
          showPopup(
            'No Session', 
            'Sign in with password first to enable biometric login.',
            'warning'
          );
          return;
        }

        // Restore phone
        const savedPhone = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PHONE);
        if (savedPhone) setPhone(savedPhone);

        setAccessToken(storedToken, null);
        setUser({ phone: savedPhone || '' });
      }
    } catch (err) {
      console.error('Biometric error:', err);
      showPopup('Error', 'Biometric setup/login failed. Use password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Logo Area ── */}
          <Animated.View style={[styles.logoArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={userProfile?.avatar ? styles.avatarBadge : styles.logoBadge}>
              {userProfile?.avatar ? (
                // Show profile picture if user has one from a previous login
                <Image
                  source={{ uri: userProfile.avatar }}
                  style={styles.avatarBadgeImg}
                  resizeMode="cover"
                />
              ) : (
                // Default: app logo for new / unrecognized users
                <Image
                  source={require('../../../assets/velpay-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}
            </View>
            <Text style={styles.appName}>
              {userProfile?.firstName ? `Hi, ${userProfile.firstName} 👋` : 'VPay'}
            </Text>
            {userProfile?.firstName && (
              <Text style={styles.returningSubtitle}>Welcome back! Let's get you signed in.</Text>
            )}
          </Animated.View>

          {/* ── Offline Banner ── */}
          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineDot}>●</Text>
              <Text style={styles.offlineText}>No internet connection</Text>
            </View>
          )}

          {/* ── Lock Banner ── */}
          {isLocked && (
            <View style={styles.lockBanner}>
              <Text style={styles.lockIcon}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lockTitle}>Account Temporarily Locked</Text>
                <Text style={styles.lockText}>Try again in {formatLockTime(lockTimeRemaining)}</Text>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* UNIFIED LOGIN LAYER                    */}
          {/* ═══════════════════════════════════════ */}
          {(step === 'phone' || step === 'password') && (
            <Animated.View style={[styles.stepCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

              {/* Profile Card for recognized users OR Phone Input for new users */}
              {step === 'password' && (userProfile || phone) ? (
                <View style={styles.userCard}>
                  <View style={styles.userAvatar}>
                    {userProfile?.avatar ? (
                      <Image source={{ uri: userProfile.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarInitial}>
                        {userProfile?.firstName?.[0]?.toUpperCase() || '👤'}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>
                      {userProfile?.firstName ? `Hi, ${userProfile.firstName}` : 'Welcome Back'}
                    </Text>
                    <Text style={styles.userPhone}>{phone}</Text>
                  </View>
                  {/* Switch Account */}
                  <TouchableOpacity
                    onPress={async () => {
                      setStep('phone');
                      setPassword('');
                      setErrors({});
                      await AsyncStorage.removeItem(STORAGE_KEYS.KYC_COMPLETED);
                      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PHONE);
                      setPhone('');
                      setUserProfile(null);
                    }}
                    style={styles.switchBtn}
                  >
                    <Text style={styles.switchText}>Switch</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.stepTitle}>Sign In</Text>
                  <Text style={styles.stepSubtitle}>Enter your phone number to login</Text>
                  <View style={[styles.phoneRow, errors.phone && styles.inputBorderError]}>
                    <View style={styles.countryBadge}>
                      <Text style={styles.flagText}>🇳🇬</Text>
                      <Text style={styles.dialCode}>+234</Text>
                    </View>
                    <View style={styles.phoneDivider} />
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="080 1234 5678"
                      placeholderTextColor={colors.textLighter}
                      value={phone}
                      onChangeText={t => {
                        setPhone(t.replace(/\D/g, ''));
                        if (errors.phone) setErrors({});
                      }}
                      keyboardType="phone-pad"
                      maxLength={11}
                      autoFocus={step === 'phone'}
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                    />
                  </View>
                  {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                </View>
              )}

              {step === 'password' && <View style={styles.loginDivider} />}

              {/* Password Input (Revealed after phone or recognized) */}
              {step === 'password' && (
                <Animatable.View animation="fadeInUp" duration={400} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.passRow, errors.password && styles.inputBorderError]}>
                    <Text style={styles.passIcon}>🔐</Text>
                    <TextInput
                      ref={passwordRef}
                      style={styles.passInput}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textLighter}
                      value={password}
                      onChangeText={t => {
                        setPassword(t.replace(/\s/g, ''));
                        if (errors.password) setErrors({});
                      }}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handlePasswordLogin}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(p => !p)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                  <TouchableOpacity
                    style={styles.forgotBtn}
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </Animatable.View>
              )}

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, (loading || (step === 'phone' && !phone) || (step === 'password' && !password)) && styles.primaryBtnDisabled]}
                onPress={step === 'phone' ? handleContinue : handlePasswordLogin}
                disabled={loading || (step === 'phone' && !phone) || (step === 'password' && !password)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Processing...' : (step === 'phone' ? 'Continue' : 'Sign In')}
                </Text>
              </TouchableOpacity>

              {/* Biometric Integration */}
              {biometricAvailable && (
                <TouchableOpacity
                  style={[styles.biometricBtn, biometricEnabled && styles.biometricBtnActive]}
                  onPress={handleBiometric}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <View style={styles.biometricIconWrap}>
                    <MaterialCommunityIcons
                      name={biometricType === 'face' ? 'face-recognition' : 'fingerprint'}
                      size={32}
                      color={biometricEnabled ? colors.primary : colors.textLight}
                    />
                  </View>
                  <Text style={[styles.biometricBtnLabel, biometricEnabled && styles.biometricBtnLabelActive]}>
                    {biometricEnabled ? (biometricType === 'face' ? 'Use Face ID' : 'Use Fingerprint') : `Enable ${biometricType}`}
                  </Text>
                  {!biometricEnabled && (
                    <Text style={styles.biometricBtnSub}>Quick setup - takes 3 seconds</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Alternative Flows */}
              <View style={styles.altFlows}>
                {step === 'password' ? (
                  <TouchableOpacity style={styles.otpSwitchBtn} onPress={handleSwitchToOTP} disabled={loading}>
                    <Text style={styles.otpSwitchText}>Sign in with OTP instead</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.createRow}>
                    <Text style={styles.createText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                      <Text style={styles.createLink}> Create Account</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* STEP 3 — OTP Input                      */}
          {/* ═══════════════════════════════════════ */}
          {step === 'otp' && (
            <Animated.View style={[styles.stepCard, { transform: [{ translateX: stepAnim }] }]}>
              {/* Back */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setStep('password'); setErrors({}); }}
              >
                <Text style={styles.backIcon}>←</Text>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              {/* Mini profile card on OTP step */}
              {userProfile && (
                <View style={styles.otpProfileRow}>
                  <View style={styles.otpAvatar}>
                    {userProfile.avatar ? (
                      <Image source={{ uri: userProfile.avatar }} style={styles.otpAvatarImg} />
                    ) : (
                      <Text style={styles.otpAvatarInitial}>
                        {userProfile.firstName?.[0]?.toUpperCase() || '👤'}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.otpProfileName}>{userProfile.firstName || phone}</Text>
                    <Text style={styles.otpProfilePhone}>{phone}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.stepTitle}>Verification Code</Text>
              <Text style={styles.stepSubtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={styles.phoneHighlight}>{phone}</Text>
              </Text>

              {/* OTP Boxes */}
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => (otpRefs.current[i] = ref)}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={v => handleOtpChange(v, i)}
                    onKeyPress={e => handleOtpKey(e, i)}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Resend */}
              <View style={styles.resendRow}>
                {otpCountdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Resend code in <Text style={styles.countdownNum}>{otpCountdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSwitchToOTP} disabled={loading}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, (loading || otp.join('').length < 6) && styles.primaryBtnDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Verifying...' : 'Verify & Sign In'}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Legal Footer ── */}
          <View style={styles.legalFooter}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text style={styles.legalLink} onPress={() => Linking.openURL('https://vpay.ng/terms')}>
                Terms
              </Text>
              {' '}and{' '}
              <Text style={styles.legalLink} onPress={() => Linking.openURL('https://vpay.ng/privacy')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingIndicator visible={loading} message={loadingText} />

      <ErrorPopup
        visible={popupConfig.visible}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        onClose={() => setPopupConfig(p => ({ ...p, visible: false }))}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Logo area ──
  logoArea: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 36,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  logo: { width: 56, height: 56 },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  returningSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  // Profile picture badge (shown when user has a stored avatar)
  avatarBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarBadgeImg: {
    width: '100%',
    height: '100%',
  },

  // ── Banners ──
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  offlineDot: { color: '#DC2626', fontSize: 10 },
  offlineText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 12,
  },
  lockIcon: { fontSize: 24 },
  lockTitle: { fontSize: 14, fontWeight: '700', color: '#9A3412' },
  lockText: { fontSize: 12, color: '#C2410C', marginTop: 2 },

  // ── Step Card ──
  stepCard: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: 32,
    lineHeight: 22,
  },

  // ── Input group ──
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // ── Phone input row ──
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    overflow: 'hidden',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 6,
    backgroundColor: colors.inputBg,
  },
  flagText: { fontSize: 20 },
  dialCode: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  phoneDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.5,
  },

  // ── Password input row ──
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 16,
  },
  passIcon: { fontSize: 18, marginRight: 10 },
  passInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },

  inputBorderError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 2,
  },

  // ── Forgot password ──
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },

  // ── Primary button ──
  primaryBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── OTP Switch button ──
  otpSwitchBtn: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 4,
  },
  otpSwitchText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },

  // ── Biometric button (card style) ──
  biometricBtn: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  biometricBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  biometricIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 82, 204, 0.1)',
  },
  biometricBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
  },


  // ── OTP step profile row ──
  otpProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  otpAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  otpAvatarImg: { width: 44, height: 44 },
  otpAvatarInitial: { fontSize: 20 },
  otpProfileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  otpProfilePhone: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },

  // ── Create account row ──
  createRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  createText: { fontSize: 14, color: colors.textLight },
  createLink: { fontSize: 14, color: colors.primary, fontWeight: '800' },

  // ── User recognition card ──
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  userAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarInitial: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  userPhone: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  switchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loginDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },

  // ── Back button ──
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  backIcon: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '700' },

  // ── OTP ──
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 28,
  },
  otpBox: {
    width: 50,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  phoneHighlight: {
    color: colors.text,
    fontWeight: '700',
  },

  resendRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownText: { fontSize: 13, color: colors.textLight },
  countdownNum: { color: colors.primary, fontWeight: '700' },
  resendLink: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  altFlows: {
    marginTop: 24,
    width: '100%',
  },
  otpSwitchBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  otpSwitchText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // ── Legal ──
  legalFooter: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  legalText: {
    fontSize: 12,
    color: colors.textLighter,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
