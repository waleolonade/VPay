import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../styles/colors';

import { useAuth } from '../../context/AuthContext';

const SERVICES = [
  { id: 'send', title: 'Transfer', icon: 'send-outline', color: '#4F46E5' },
  { id: 'airtime', title: 'Airtime', icon: 'phone-portrait-outline', color: '#10B981' },
  { id: 'data', title: 'Data', icon: 'globe-outline', color: '#3B82F6' },
  { id: 'bills', title: 'Bills', icon: 'receipt-outline', color: '#F59E0B' },
  { id: 'loans', title: 'Loans', icon: 'cash-outline', color: '#8B5CF6' },
  { id: 'savings', title: 'Savings', icon: 'shield-checkmark-outline', color: '#EC4899' },
  { id: 'invest', title: 'Invest', icon: 'trending-up-outline', color: '#06B6D4' },
  { id: 'more', title: 'More', icon: 'grid-outline', color: '#6B7280' },
];

const ServiceGrid = ({ onActionPress }) => {
  const { accountMode } = useAuth();
  const isBusiness = accountMode === 'business';

  // Filter services for business mode
  const filteredServices = SERVICES.filter(s => {
    if (isBusiness) {
      // Remove airtime, data, invest in business mode per user request
      return !['airtime', 'data', 'invest'].includes(s.id);
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {filteredServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.item}
            onPress={() => onActionPress(service.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${service.color}15` }]}>
              <Ionicons name={service.icon} size={26} color={service.color} />
            </View>
            <Text style={styles.title}>{service.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  item: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

export default ServiceGrid;
