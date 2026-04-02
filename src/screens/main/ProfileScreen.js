import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  Platform,
  ActivityIndicator,
  Share,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { useAuth } from '../../context/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService } from '../../services/profileService';
import { walletService } from '../../services/walletService';
import { notificationService } from '../../services/notificationService';
import api from '../../services/api';
import { endpoints } from '../../constants/apiEndpoints';

export default function ProfileScreen({ navigation }) {
  const { user, clearAuth, setUser } = useAuth();

  // â”€â”€ Toggle states (seeded from AuthContext) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [biometricEnabled, setBiometricEnabled]   = useState(user?.isBiometricEnabled || false);
  const [pushEnabled, setPushEnabled]             = useState(user?.pushEnabled ?? true);
  const [smsEnabled, setSmsEnabled]               = useState(user?.smsEnabled ?? false);
  const [promoEnabled, setPromoEnabled]           = useState(user?.promoEnabled ?? true);
  const [accountFrozen, setAccountFrozen]         = useState(user?.accountFrozen || false);

  // â”€â”€ Live data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [wallet, setWallet]           = useState(null);
  const [bankCount, setBankCount]     = useState(0);
  const [cardCount, setCardCount]     = useState(0);
  const [rewards, setRewards]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  // â”€â”€ Per-action saving flags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [toggling, setToggling] = useState({});

  // Notification extras
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [inAppSounds, setInAppSounds]                 = useState(true);

  // â”€â”€ Seed toggles whenever AuthContext user changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (user) {
      setBiometricEnabled(!!user.isBiometricEnabled);
      setPushEnabled(!!user.pushEnabled);
      setSmsEnabled(!!user.smsEnabled);
      setPromoEnabled(!!user.promoEnabled);
      setAccountFrozen(!!user.accountFrozen);
    }
  }, [user]);

  // Load in-app sounds preference
  useEffect(() => {
    AsyncStorage.getItem('inAppSounds').then((val) => {
      if (val !== null) setInAppSounds(val === 'true');
    });
  }, []);

  const toggleInAppSounds = useCallback((val) => {
    setInAppSounds(val);
    AsyncStorage.setItem('inAppSounds', String(val));
  }, []);

  // â”€â”€ Load supplementary data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadData = useCallback(async () => {
    try {
      const [walletRes, banksRes, rewardsRes] = await Promise.all([
        walletService.getWallets(),
        profileService.getBanksAndCards(),
        api.get(endpoints.REWARDS),
      ]);

      if (walletRes.success && walletRes.data) {
        const w = Array.isArray(walletRes.data) ? walletRes.data[0] : walletRes.data;
        setWallet(w);
      }
      if (banksRes.success && banksRes.data) {
        setBankCount(banksRes.data.banks?.length ?? 0);
        setCardCount(banksRes.data.cards?.length ?? 0);
      }
      if (rewardsRes.success && rewardsRes.data) {
        setRewards(rewardsRes.data);
      }

      // Unread notification count
      try {
        const notifRes = await notificationService.getNotifications({ limit: 50 });
        if (notifRes?.success) {
          const list = notifRes.data?.notifications || notifRes.data || [];
          const unread = notifRes.data?.unreadCount ?? list.filter((n) => !n.isRead).length;
          setUnreadNotifications(unread);
        }
      } catch { /* silently ignore */ }
    } catch { /* silently ignore supplementary failures */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getTierInfo = (kycLevel) => {
    switch (kycLevel) {
      case 3: return { label: 'Tier 3 Verified', color: '#10b981', limit: 'Unlimited' };
      case 2: return { label: 'Tier 2 Verified', color: '#3b82f6', limit: 'â‚¦500k/Day' };
      default: return { label: 'Tier 1 Limit', color: '#f59e0b', limit: 'â‚¦50k/Day' };
    }
  };
  const tier = getTierInfo(user?.kycLevel || 1);

  const copyToClipboard = async (text, label) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  // â”€â”€ Generic backend toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const syncToggle = useCallback(async (key, value, setter) => {
    setter(value);
    setUser((prev) => ({ ...prev, [key]: value }));
    setToggling((t) => ({ ...t, [key]: true }));
    try {
      const res = await profileService.updateProfile({ [key]: value });
      if (res.success && res.data) setUser(res.data);
    } catch {
      setter(!value);
      setUser((prev) => ({ ...prev, [key]: !value }));
      Alert.alert('Sync Error', 'Failed to save preference. Check your connection.');
    } finally {
      setToggling((t) => ({ ...t, [key]: false }));
    }
  }, [setUser]);

  // â”€â”€ Biometric toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleBiometric = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      Alert.alert('Not Available', 'Biometrics are not enrolled on this device. Please set them up in your device settings.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: biometricEnabled ? 'Authenticate to disable biometrics' : 'Authenticate to enable biometrics',
    });
    if (result.success) {
      await syncToggle('isBiometricEnabled', !biometricEnabled, setBiometricEnabled);
    }
  }, [biometricEnabled, syncToggle]);

  // â”€â”€ Freeze / unfreeze account â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleFreezeToggle = useCallback(() => {
    const next = !accountFrozen;
    Alert.alert(
      next ? 'Freeze Account' : 'Unfreeze Account',
      next
        ? 'This will temporarily block all outgoing transactions. You can unfreeze at any time.'
        : 'This will restore full account access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Freeze' : 'Unfreeze',
          style: next ? 'destructive' : 'default',
          onPress: () => syncToggle('accountFrozen', next, setAccountFrozen),
        },
      ],
    );
  }, [accountFrozen, syncToggle]);

  // â”€â”€ Referral share â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleShareReferral = useCallback(async () => {
    const code = rewards?.referralCode || user?.referralCode || '';
    if (!code) return;
    await Share.share({
      message: `Join VPay and enjoy seamless payments! Use my referral code ${code} and earn â‚¦${rewards?.referralBonusAmount?.toLocaleString() || '1,000'} when you sign up. Download: https://vpay.app`,
      title: 'Refer & Earn on VPay',
    });
  }, [rewards, user]);

  // â”€â”€ Logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to securely log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => clearAuth() },
      ],
    );
  }, [clearAuth]);

  // â”€â”€ Delete account â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => navigation.navigate('HelpCenter'),
        },
      ],
    );
  }, [navigation]);

  // â”€â”€ Account number â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const accountNumber = wallet?.accountNumber || (user?.phone ? user.phone.slice(1) : 'â€”');

  // â”€â”€ Referral code / cashback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const referralCode    = rewards?.referralCode    || user?.referralCode    || 'â€”';
  const cashbackBalance = rewards?.cashbackBalance != null
    ? `â‚¦${Number(rewards.cashbackBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : 'â€”';
  const referredCount   = rewards?.referredUsersCount ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Me</Text>
        <TouchableOpacity style={styles.headerNavBtn} onPress={() => navigation.navigate('HelpCenter')}>
          <Ionicons name="headset-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* â”€â”€ 1. PROFILE HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileTopRow}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={() => navigation.navigate('AccountDetails')}>
              <Image
                source={user?.avatar ? { uri: user.avatar } : require('../../../assets/icon.png')}
                style={styles.avatar}
              />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.firstName || 'User'} {user?.lastName || ''}</Text>
              <Text style={styles.userUsername}>@{user?.email?.split('@')[0] || 'username'}</Text>
              <View style={[styles.kycBadge, { backgroundColor: `${tier.color}15` }]}>
                <MaterialCommunityIcons name="shield-check" size={14} color={tier.color} />
                <Text style={[styles.kycBadgeText, { color: tier.color }]}>{tier.label}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate('RequestMoney')}>
              <Ionicons name="qr-code" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.accountNumberCard}
            onPress={() => copyToClipboard(accountNumber, 'Account Number')}
            activeOpacity={0.75}
          >
            <View>
              <Text style={styles.accountNumberLabel}>Wallet Account Number</Text>
              {loading
                ? <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
                : <Text style={styles.accountNumberValue}>{accountNumber}</Text>}
            </View>
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* â”€â”€ 2. FINANCIAL IDENTITY (KYC) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MenuGroup title="Financial Identity">
          <MenuRow icon="person-outline" title="Account Details" subtitle="Name, email, phone, address"
            onPress={() => navigation.navigate('AccountDetails')} />
          <MenuRow icon="finger-print-outline" title="BVN Verification (Tier 2)"
            subtitle={user?.bvnVerified ? 'Verified' : 'Tap to link your BVN'}
            status={user?.bvnVerified ? 'success' : 'warning'}
            onPress={() => user?.bvnVerified
              ? Alert.alert('Already Verified', 'Your BVN is already linked.')
              : navigation.navigate('BvnVerification')} />
          <MenuRow icon="card-outline" title="NIN & Identity (Tier 3)"
            subtitle={user?.ninVerified ? 'Verified' : 'Tap to verify your NIN'}
            status={user?.ninVerified ? 'success' : 'pending'}
            onPress={() => user?.ninVerified
              ? Alert.alert('Already Verified', 'Your identity is already verified.')
              : navigation.navigate('NinVerification')} />
        </MenuGroup>

        {/* â”€â”€ 3. SECURITY CENTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MenuGroup title="Security Center">
          <MenuRow icon="lock-closed-outline" title="Change Transaction PIN"
            onPress={() => navigation.navigate('TransactionPin')} />
          <MenuRow icon="key-outline" title="Change Login Password"
            onPress={() => navigation.navigate('Security')} />
          <ToggleRow icon="scan-outline" title="Biometric Login" subtitle="Face ID / Fingerprint"
            value={biometricEnabled} loading={!!toggling['isBiometricEnabled']}
            onValueChange={toggleBiometric} />
          <MenuRow icon="settings-outline" title="Advanced Security Settings"
            subtitle="Session locks, device management"
            onPress={() => navigation.navigate('Security')} />
        </MenuGroup>

        {/* â”€â”€ 4. BUSINESS ACCOUNT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MenuGroup title="Business Account">
          <MenuRow 
            icon="business-outline" 
            iconColor="#1a237e"
            title={user?.businessActive ? "Business Dashboard" : "Upgrade to Business"} 
            subtitle={user?.businessActive ? "Manage your business finances" : "Get a business account & QR scanner"}
            onPress={() => user?.businessActive ? navigation.navigate('BusinessDashboard') : navigation.navigate('BusinessRequest')} 
          />
        </MenuGroup>

        {/* â”€â”€ 5. PAYMENT METHODS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MenuGroup title="Payment Methods">
          <MenuRow icon="business-outline" title="Linked Bank Accounts"
            subtitle={loading ? 'Loadingâ€¦' : `${bankCount} account${bankCount !== 1 ? 's' : ''} linked`}
            onPress={() => navigation.navigate('Cards')} />
          <MenuRow icon="card-outline" title="Debit & Credit Cards"
            subtitle={loading ? 'Loadingâ€¦' : `${cardCount} card${cardCount !== 1 ? 's' : ''} linked`}
            onPress={() => navigation.navigate('Cards')} />
        </MenuGroup>

        {/* â”€â”€ 5. TRANSACTION CONTROLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MenuGroup title="Transaction Controls">
          <MenuRow icon="options-outline" title="Daily Transfer Limit"
            subtitle={`Current: ${tier.limit}`}
            onPress={() => navigation.navigate('Settings')} />
          <MenuRow icon="cash-outline" title="Daily Withdrawal Limit"
            subtitle={user?.dailyWithdrawalLimit
              ? `â‚¦${Number(user.dailyWithdrawalLimit).toLocaleString()}/day`
              : 'Not set'}
            onPress={() => navigation.navigate('Settings')} />
          <ToggleRow
            icon="snow-outline" iconColor={colors.danger}
            title="Freeze Account"
            subtitle={accountFrozen ? 'Account is currently frozen' : 'Block all outgoing transactions'}
            value={accountFrozen} loading={!!toggling['accountFrozen']}
            onValueChange={handleFreezeToggle}
          />
        </MenuGroup>

        {/* â”€â”€ 6. NOTIFICATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MenuGroup title="Notifications">
          {/* Notification Center row - live unread badge */}
          <TouchableOpacity
            style={[styles.menuRow, { paddingRight: 16 }]}
            activeOpacity={0.7}
            onPress={() => {
              setUnreadNotifications(0);
              navigation.navigate('Notifications');
            }}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: `${colors.primary}12` }]}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Notification Center</Text>
              <Text style={styles.menuSubtitle}>
                {unreadNotifications > 0
                  ? `${unreadNotifications} unread message${unreadNotifications !== 1 ? 's' : ''}`
                  : 'All caught up  no unread alerts'}
              </Text>
            </View>
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeTxt}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </TouchableOpacity>

          <ToggleRow icon="notifications-outline" title="App Push Notifications"
            subtitle="Transaction updates and security alerts"
            value={pushEnabled} loading={!!toggling['pushEnabled']}
            onValueChange={(v) => syncToggle('pushEnabled', v, setPushEnabled)} />
          <ToggleRow icon="chatbubble-ellipses-outline" title="SMS Transaction Alerts"
            subtitle="Get texts for every debit and credit"
            value={smsEnabled} loading={!!toggling['smsEnabled']}
            onValueChange={(v) => syncToggle('smsEnabled', v, setSmsEnabled)} />
          <ToggleRow icon="gift-outline" title="Promotions & Offers"
            subtitle="Deals, cashback news and rewards"
            value={promoEnabled} loading={!!toggling['promoEnabled']}
            onValueChange={(v) => syncToggle('promoEnabled', v, setPromoEnabled)} />
          <ToggleRow icon="volume-high-outline" title="In-App Sounds"
            subtitle="Play sounds for alerts and actions"
            value={inAppSounds}
            onValueChange={toggleInAppSounds} />
          <MenuRow icon="settings-outline" title="Notification Preferences"
            subtitle="Fine-tune all alert channels"
            onPress={() => navigation.navigate('Settings')} />
        </MenuGroup>

        {/* â”€â”€ 7. REWARDS & REFERRAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MenuGroup title="Rewards & Referrals">
          <TouchableOpacity style={styles.referralBanner} onPress={handleShareReferral} activeOpacity={0.8}>
            <View style={styles.referralLeft}>
              <Ionicons name="people" size={22} color="#10b981" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.referralTitle}>
                  Refer & Earn â‚¦{rewards?.referralBonusAmount?.toLocaleString() || '1,000'}
                </Text>
                <Text style={styles.referralSub}>
                  Code: <Text style={styles.referralCode}>{referralCode}</Text>
                  {'  Â·  '}{referredCount} friend{referredCount !== 1 ? 's' : ''} invited
                </Text>
              </View>
            </View>
            <View style={styles.referralActions}>
              <TouchableOpacity
                style={styles.copyCodeBtn}
                onPress={() => copyToClipboard(referralCode, 'Referral code')}
              >
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
              <Ionicons name="share-social-outline" size={20} color="#10b981" />
            </View>
          </TouchableOpacity>

          <MenuRow icon="wallet-outline" title="Cashback Wallet"
            subtitle={loading ? 'Loadingâ€¦' : `Balance: ${cashbackBalance}`}
            iconColor="#f59e0b"
            onPress={() => Alert.alert('Cashback Wallet', `Your current cashback balance is ${cashbackBalance}.\n\nCashback is earned on qualifying transactions and can be redeemed on your next payment.`)} />
        </MenuGroup>

        {/* â”€â”€ 8. SUPPORT & LEGAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MenuGroup title="Support & Legal">
          <MenuRow icon="chatbox-ellipses-outline" title="Customer Service / Live Chat"
            onPress={() => navigation.navigate('HelpCenter')} />
          <MenuRow icon="document-text-outline" title="Terms & Privacy Policy"
            onPress={() => Alert.alert('Terms & Privacy', 'Full policy available at https://vpay.app/legal')} />
          <MenuRow icon="information-circle-outline" title="About VPay v1.0.0"
            onPress={() => Alert.alert('About VPay', 'Version 1.0.0 (Build 42)\n\nVPay is a secure digital wallet and payment platform built for Nigeria.\n\nÂ© 2026 VPay Technologies Ltd.')} />
        </MenuGroup>

        {/* â”€â”€ 9. LOGOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={styles.logoutText}>Secure Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

// â”€â”€ Helper Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MenuGroup({ title, children }) {
  return (
    <View style={styles.menuGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupContent}>{children}</View>
    </View>
  );
}

function MenuRow({ icon, title, subtitle, status, iconColor = colors.text, onPress }) {
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: `${iconColor}12` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {status === 'success' && <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.statusIcon} />}
      {status === 'warning' && <Ionicons name="alert-circle"    size={20} color="#f59e0b" style={styles.statusIcon} />}
      {status === 'pending' && <Ionicons name="time"            size={20} color="#3b82f6" style={styles.statusIcon} />}
      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, title, subtitle, iconColor = colors.text, value, onValueChange, loading }) {
  return (
    <View style={styles.menuRow}>
      <View style={[styles.menuIconContainer, { backgroundColor: `${iconColor}12` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {loading
        ? <ActivityIndicator size="small" color={colors.primary} />
        : (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#e2e8f0', true: colors.primary }}
            thumbColor={Platform.OS === 'ios' ? '#fff' : (value ? '#fff' : '#f8fafc')}
          />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#fff' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  headerNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },

  // Profile Header
  profileHeaderCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f1f5f9' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  profileInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 2 },
  userUsername: { fontSize: 13, color: colors.textLight, marginBottom: 8 },
  kycBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  kycBadgeText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  qrButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: `${colors.primary}10`, justifyContent: 'center', alignItems: 'center' },
  accountNumberCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16 },
  accountNumberLabel: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  accountNumberValue: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 1 },

  // Groups
  menuGroup: { marginBottom: 25 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 8 },
  groupContent: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },

  // Rows
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: colors.textLight },
  statusIcon: { marginRight: 8 },

  // Referral banner
  referralBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#f0fdf4' },
  referralLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  referralTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  referralSub: { fontSize: 12, color: colors.textLight },
  referralCode: { fontWeight: '700', color: colors.primary },
  referralActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copyCodeBtn: { padding: 4 },

  // Notification badge
  notifBadge:    { backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, marginRight: 8 },
  notifBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Footer
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 20, marginTop: 10, borderColor: `${colors.danger}30`, borderWidth: 1, shadowColor: colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: '700', marginLeft: 10 },
  deleteAccountText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 25 },
  footerSpacing: { height: 40 },
});

