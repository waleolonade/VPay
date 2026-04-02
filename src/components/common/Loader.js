import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { colors } from '../../styles/colors';
import LoadingIndicator from '../LoadingIndicator';

export default function Loader({ visible = false, message = 'Loading...' }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.loaderBox}>
          <LoadingIndicator />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});
