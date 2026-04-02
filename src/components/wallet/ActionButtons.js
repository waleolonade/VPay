import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

const actions = [
  { id: 'add_money', title: 'Fund', icon: 'add-outline', color: '#4caf50' },
  { id: 'transfer', title: 'Send', icon: 'paper-plane-outline', color: '#2196f3' },
  { id: 'request_money', title: 'Request', icon: 'download-outline', color: '#ff9800' },
  { id: 'statement', title: 'E-Receipt', icon: 'document-text-outline', color: '#9c27b0' },
];

const ActionButtons = ({ onActionPress }) => (
  <View style={styles.container}>
    {actions.map((action) => (
      <TouchableOpacity 
        key={action.id} 
        style={styles.buttonWrapper} 
        onPress={() => onActionPress(action.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
          <Ionicons name={action.icon} size={24} color={action.color} />
        </View>
        <Text style={styles.text}>{action.title}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  buttonWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});

export default ActionButtons;