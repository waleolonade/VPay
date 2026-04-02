import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../styles/colors';

const actions = [
  { id: 'send', title: 'Send', icon: 'arrow-up-outline' },
  { id: 'receive', title: 'Receive', icon: 'arrow-down-outline' },
  { id: 'airtime', title: 'Airtime', icon: 'phone-portrait-outline' },
  { id: 'data', title: 'Data', icon: 'cellular-outline' },
  { id: 'bills', title: 'Pay Bills', icon: 'receipt-outline' },
  { id: 'betting', title: 'Betting', icon: 'game-controller-outline' },
  { id: 'tv', title: 'TV', icon: 'tv-outline' },
  { id: 'electricity', title: 'Electricity', icon: 'bulb-outline' },
];

const QuickActionsGrid = ({ onActionPress }) => (
  <View style={styles.grid}>
    {actions.map((action) => (
      <TouchableOpacity key={action.id} style={styles.actionItem} onPress={() => onActionPress(action.id)}>
        <View style={styles.iconContainer}>
          <Ionicons name={action.icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.actionText}>{action.title}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },
  actionItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default QuickActionsGrid;