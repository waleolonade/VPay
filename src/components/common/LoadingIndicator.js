import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { colors } from '../../styles/colors';

const { width } = Dimensions.get('window');

/**
 * LoadingIndicator Component
 * Displays animated loading indicator with optional message
 */
export default function LoadingIndicator({ message = 'Loading...', visible = true, useImageSpinner = false }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  // Spin animation
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

  // Entrance/Exit animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible && opacityValue._value === 0) {
    return null;
  }

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.popupCard, {
          opacity: opacityValue,
          transform: [{ scale: scaleValue }],
        }]}>

          <View style={styles.spinnerContainer}>
            {useImageSpinner ? (
              <Animated.Image
                source={require('../../../assets/loading.png')}
                style={[styles.loadingImage, { transform: [{ rotate: spin }] }]}
              />
            ) : (
              <ActivityIndicator size="large" color={colors.primary} />
            )}
          </View>

          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Matching ErrorPopup background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width - 80,
    maxWidth: 280,   // Slightly narrower than ErrorPopup
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  spinnerContainer: {
    marginBottom: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  message: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
