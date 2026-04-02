import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConnection } from '../../context/ConnectionContext';

const BANNER_HEIGHT = 36;

/**
 * OfflineBanner
 *
 * Slides in from the top when offline, shows "Back online ✓" for 2 s on
 * reconnect, then slides back out.
 *
 * Rendered above <Stack.Navigator> inside AppNavigator so the navigator
 * content is pushed down rather than overlaid.
 *
 * States: 'hidden' | 'offline' | 'back-online'
 */
export default function OfflineBanner() {
  const { isOffline } = useConnection();
  const [bannerState, setBannerState] = useState('hidden');
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const hideTimerRef = useRef(null);
  const prevOfflineRef = useRef(null); // null = initial mount, not yet known

  const slideIn = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = (onDone) => {
    Animated.timing(translateY, {
      toValue: -BANNER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(onDone);
  };

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const wasOffline = prevOfflineRef.current;
    prevOfflineRef.current = isOffline;

    if (isOffline) {
      // Went offline (or offline on mount)
      setBannerState('offline');
      slideIn();
    } else if (wasOffline === true) {
      // Transitioned offline → online
      setBannerState('back-online');
      slideIn();

      hideTimerRef.current = setTimeout(() => {
        slideOut(() => setBannerState('hidden'));
      }, 2000);
    }
    // wasOffline === null: initial mount while online — stay hidden

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isOffline]);

  if (bannerState === 'hidden') {
    return null;
  }

  const isBackOnline = bannerState === 'back-online';
  const backgroundColor = isBackOnline ? '#16A34A' : '#DC2626';
  const message = isBackOnline ? 'Back online ✓' : 'No internet connection';

  return (
    // Wrapper reserves BANNER_HEIGHT so the navigator below is pushed down
    <View style={{ height: BANNER_HEIGHT, overflow: 'hidden' }}>
      <Animated.View
        style={[
          styles.banner,
          { backgroundColor, transform: [{ translateY }] },
        ]}
      >
        {!isBackOnline && (
          <Ionicons name="wifi-outline" size={16} color="#fff" style={styles.icon} />
        )}
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: BANNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
