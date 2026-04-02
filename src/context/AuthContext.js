import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { setApiToken, setApiRefreshToken, onTokenExpired, onTokenRefreshed } from '../services/api';

const TOKEN_STORAGE_KEY         = '@vpay_access_token';
const REFRESH_TOKEN_STORAGE_KEY = '@vpay_refresh_token';
const MODE_STORAGE_KEY          = '@vpay_account_mode';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(null);
  const [isLoading, setIsLoading]             = useState(false);
  const [accessToken, setAccessToken]         = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountMode, setAccountMode]         = useState('personal');

  const syncUser = useCallback(async () => {
    try {
      const profileRes = await authService.getProfile();
      if (profileRes.success) {
        let userData = profileRes.data.data;
        try {
          const { walletService } = require('../services/walletService');
          const walletRes = await walletService.getWalletDetails();
          if (walletRes.data?.success) {
            const biz = walletRes.data.data.accounts.find(a => a.type === 'business');
            userData.businessActive = !!biz?.accountName;
            userData.businessName   = biz?.accountName || 'Business User';
          }
        } catch (e) {
          if (!e.silent) console.warn('[AuthContext] Wallet check failed during sync', e);
        }
        setUser(userData);
      }
    } catch (err) {
      if (!err.silent) console.warn('[AuthContext] Profile sync failed', err);
    }
  }, []);

  // ── Token setters ────────────────────────────────────────────────────────────

  /** Called on login, restore, or silent refresh. Persists both tokens. */
  const handleSetAccessToken = useCallback(async (token, refreshTkn) => {
    console.log('handleSetAccessToken called with:', token, refreshTkn);
    setAccessToken(token);
    setIsAuthenticated(!!token);
    setApiToken(token);

    if (token) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    if (refreshTkn !== undefined) {
      setApiRefreshToken(refreshTkn);
      if (refreshTkn) {
        await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshTkn);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    }
  }, []);

  const toggleAccountMode = useCallback(async () => {
    const newMode = accountMode === 'personal' ? 'business' : 'personal';
    setAccountMode(newMode);
    await AsyncStorage.setItem(MODE_STORAGE_KEY, newMode);
  }, [accountMode]);

  const handleClearAuth = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
    setApiToken(null);
    setApiRefreshToken(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY),
    ]);
  }, []);

  // ── Register API callbacks ───────────────────────────────────────────────────

  useEffect(() => {
    // Called when refresh token also fails → hard logout
    onTokenExpired(handleClearAuth);
    // Called when api.js silently refreshes → persist the new tokens
    onTokenRefreshed((newAccess, newRefresh) => {
      handleSetAccessToken(newAccess, newRefresh);
    });
    return () => {
      onTokenExpired(null);
      onTokenRefreshed(null);
    };
  }, [handleClearAuth, handleSetAccessToken]);

  // ── Restore session from AsyncStorage ───────────────────────────────────────

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [savedToken, savedRefresh, savedMode] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(MODE_STORAGE_KEY),
        ]);

        if (savedToken) {
          setAccessToken(savedToken);
          setIsAuthenticated(true);
          setApiToken(savedToken);
        }

        if (savedRefresh) {
          setApiRefreshToken(savedRefresh);
        }

        if (savedMode) setAccountMode(savedMode);
      } catch (e) {
        console.warn('Could not restore session:', e);
      }
    };
    restoreSession();
  }, []);

  // ── Background timeout logout ────────────────────────────────────────────────

  useEffect(() => {
    let backgroundTimerId = null;
    const subscription = AppState.addEventListener('change', nextAppState => {
      if ((nextAppState === 'background' || nextAppState === 'inactive') && isAuthenticated) {
        backgroundTimerId = setTimeout(() => {
          handleClearAuth();
        }, 5 * 60 * 1000); // 5 minutes
      } else if (nextAppState === 'active' && backgroundTimerId) {
        clearTimeout(backgroundTimerId);
        backgroundTimerId = null;
      }
    });
    return () => {
      subscription.remove();
      if (backgroundTimerId) clearTimeout(backgroundTimerId);
    };
  }, [isAuthenticated, handleClearAuth]);

  const value = {
    user,
    setUser,
    syncUser,
    isLoading,
    setIsLoading,
    accessToken,
    setAccessToken: handleSetAccessToken,
    isAuthenticated,
    clearAuth: handleClearAuth,
    accountMode,
    toggleAccountMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
