import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@vpay_biometric_enabled';
const SECURE_LOGIN_TOKEN_KEY = 'vpay_bio_login_token';
const SECURE_TXN_PIN_KEY     = 'vpay_bio_txn_pin';

export const biometricService = {
  // ─── Hardware / Enrollment ───────────────────────────────────────────────

  /** True when the device has biometric hardware AND enrolled credentials. */
  isAvailable: async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  /** Supported biometric types on this device. */
  getSupportedTypes: () => LocalAuthentication.supportedAuthenticationTypesAsync(),

  // ─── Authenticate ────────────────────────────────────────────────────────

  /**
   * Show the system biometric prompt.
   * @param {string} [promptMessage]
   * @returns {{ success: boolean, error?: string }}
   */
  authenticate: async (promptMessage = 'Confirm your identity') => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use PIN instead',
    });
    return { success: result.success, error: result.error };
  },

  /** Biometric prompt specifically for transaction authorisation. */
  authenticateForTransaction: async (amount) => {
    const msg = amount
      ? `Authorise payment of ₦${Number(amount).toLocaleString('en-NG')}`
      : 'Authorise transaction';
    return biometricService.authenticate(msg);
  },

  // ─── App-level enable / disable (stored in AsyncStorage) ─────────────────

  isEnabled: async () => {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  },

  enable:  () => AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true'),
  disable: () => AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false'),

  // ─── Login token (stored in SecureStore) ─────────────────────────────────

  /**
   * Persist the access token so biometric login can restore the session
   * without re-entering a password.
   */
  saveLoginToken: (token) =>
    SecureStore.setItemAsync(SECURE_LOGIN_TOKEN_KEY, token),

  getLoginToken: () =>
    SecureStore.getItemAsync(SECURE_LOGIN_TOKEN_KEY),

  clearLoginToken: () =>
    SecureStore.deleteItemAsync(SECURE_LOGIN_TOKEN_KEY),

  // ─── Transaction PIN (stored in SecureStore) ──────────────────────────────

  /** Persist the 4-digit transaction PIN for biometric-authorised payments. */
  saveTransactionPin: (pin) =>
    SecureStore.setItemAsync(SECURE_TXN_PIN_KEY, pin),

  getTransactionPin: () =>
    SecureStore.getItemAsync(SECURE_TXN_PIN_KEY),

  clearTransactionPin: () =>
    SecureStore.deleteItemAsync(SECURE_TXN_PIN_KEY),

  hasSavedTransactionPin: async () => {
    const pin = await SecureStore.getItemAsync(SECURE_TXN_PIN_KEY);
    return !!pin;
  },

  // ─── Full reset (called on disable / logout) ──────────────────────────────

  disableAndClear: async () => {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
    await SecureStore.deleteItemAsync(SECURE_LOGIN_TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(SECURE_TXN_PIN_KEY).catch(() => {});
  },
};
