import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function VelPayLogo({ size = 120, containerStyle }) {
  // We use the requested image logo but keep it dynamically scalable
  // so it looks great whether it's on the Splash Screen or Login Form.
  // The original aspect ratio of the logo is ~ 2.5 : 1
  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={require('../../assets/velpay-logo.png')}
        style={[styles.logo, { width: size, height: size * 0.4 }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  logo: {
    // Dimensions are passed dynamically via style props
  },
});
