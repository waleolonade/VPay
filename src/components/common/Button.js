import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import LoadingIndicator from './LoadingIndicator';

export default function Button({
  onPress,
  title,
  type = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const buttonStyle = [
    styles.button,
    styles[`button_${type}`],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <LoadingIndicator />
      ) : (
        <Text style={[styles.text, styles[`text_${type}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.secondary,
  },
  button_outline: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  button_danger: {
    backgroundColor: colors.danger,
  },
  size_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  size_medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  size_large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  text_primary: {
    color: '#fff',
  },
  text_secondary: {
    color: '#fff',
  },
  text_outline: {
    color: colors.primary,
  },
  text_danger: {
    color: '#fff',
  },
});
