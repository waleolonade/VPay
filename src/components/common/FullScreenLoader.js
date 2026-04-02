import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { colors } from '../../styles/colors';

/**
 * FullScreenLoader Component
 * Full-screen loading overlay with animated spinner
 * Overlay blocks user interaction while loading
 */
export default function FullScreenLoader({ visible = false, message = 'Processing...', useImageSpinner = true }) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      spinValue.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [visible, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Animated.Image
        source={require('../../../assets/loading.png')}
        style={[
          styles.spinner,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spinner: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '600',
    textAlign: 'center',
  },
});
