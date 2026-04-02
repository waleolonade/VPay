import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../styles/colors';

const AISmartSuggestions = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finance Insights</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity key={suggestion.id || index} style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons 
                name={suggestion.icon || 'bulb-outline'} 
                size={22} 
                color={colors.primary} 
              />
            </View>
            <Text style={styles.suggestionText} numberOfLines={2}>
              {suggestion.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 20,
    marginBottom: 12,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  card: {
    width: 160,
    height: 100,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
});

export default AISmartSuggestions;