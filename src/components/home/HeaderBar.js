import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { useAuth } from '../../context/AuthContext';

const HeaderBar = ({ user, unreadCount, onNotificationPress, onProfilePress }) => {
  const { accountMode, toggleAccountMode } = useAuth();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onProfilePress} style={styles.profileContainer}>
        <Image
          source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.greeting}>Hi, {user?.firstName || 'User'} 👋</Text>
          <TouchableOpacity onPress={toggleAccountMode} style={[styles.modeBadge, accountMode === 'business' && styles.businessBadge]}>
            <Text style={[styles.modeText, accountMode === 'business' && styles.businessText]}>{accountMode === 'business' ? 'Business Mode' : 'Personal Account'}</Text>
            <Ionicons name="swap-horizontal" size={12} color={accountMode === 'business' ? '#fff' : colors.primary} style={{marginLeft: 4}} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNotificationPress} style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  businessBadge: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  modeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  businessText: {
    color: '#fff',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  notificationBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: colors.danger || '#ff4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '900',
  },
});

export default HeaderBar;