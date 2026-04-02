import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

/**
 * QuickActions Component
 * Primary action buttons for common tasks
 * Includes Bills Payment from VFDTech API integration
 */
export default function QuickActions({ onAction }) {
  // Primary quick actions based on user workflows
  // Bills Payment is included as key action with VFDTech integration
  const actions = [
    { 
      id: 1, 
      label: 'Send Money', 
      icon: '📤', 
      action: 'send',
      color: colors.primary 
    },
    { 
      id: 2, 
      label: 'Pay Bills', 
      icon: '📌', 
      action: 'bills',
      color: '#FFA500',
      highlight: true 
    },
    { 
      id: 3, 
      label: 'Request', 
      icon: '📥', 
      action: 'request',
      color: colors.success 
    },
    { 
      id: 4, 
      label: 'More', 
      icon: '⋯', 
      action: 'more',
      color: colors.textLight 
    },
  ];

  const renderAction = (action) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.action,
        action.highlight && styles.highlightAction
      ]}
      onPress={() => onAction(action.action)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconBox,
        action.highlight && styles.highlightIconBox
      ]}>
        <Text style={styles.iconText}>{action.icon}</Text>
      </View>
      <Text style={[
        styles.label,
        action.highlight && styles.highlightLabel
      ]}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {actions.map(action => renderAction(action))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    gap: 8,
  },
  action: {
    flex: 1,
    alignItems: 'center',
  },
  highlightAction: {
    // Pay Bills receives subtle highlight
  },
  iconText: {
    fontSize: 22,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.lightBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  highlightIconBox: {
    backgroundColor: '#FFE8CC',
    elevation: 2,
    shadowOpacity: 0.12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  highlightLabel: {
    fontWeight: '600',
    color: colors.primary,
  },
});
