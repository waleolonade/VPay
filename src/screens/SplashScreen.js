import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Image } from 'react-native';


export default function SplashScreen({ onAnimationComplete }) {
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(-80)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animation sequence
    Animated.sequence([
      // Small logo bounce
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Text slides in with fade
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateX, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Call the completion callback after animation
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 1500);
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/velpay-logo.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textWrapper,
            {
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }],
            },
          ]}
        >
          <Text style={[styles.brandText, styles.velText]}>Vel</Text>
          <Text style={[styles.brandText, styles.payText]}>Pay</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoWrap: {
    width: Dimensions.get('window').width * 0.30,
    height: Dimensions.get('window').width * 0.30,
  },
  textWrapper: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 52,
  },
  velText: {
    color: '#0052CC',
  },
  payText: {
    color: '#22C55E',
  },
});
