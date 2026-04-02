import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../styles/colors';

let toastRef = null;

export function showToast(message, type = 'success', duration = 3000) {
  if (toastRef) {
    toastRef.show(message, type, duration);
  }
}

export default function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    toastRef = {
      show: (msg, toastType, duration) => {
        setMessage(msg);
        setType(toastType);
        setVisible(true);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setVisible(false));
        }, duration);
      },
    };
  }, [opacity]);

  if (!visible) return null;

  const backgroundColor =
    type === 'success'
      ? colors.success
      : type === 'error'
      ? colors.danger
      : type === 'warning'
      ? colors.warning
      : colors.info;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[styles.toast, { backgroundColor }]}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
