import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import LoadingIndicator from '../LoadingIndicator';

export default function BillerList({ billers, loading, onSelectBiller }) {
  const renderBiller = ({ item }) => (
    <TouchableOpacity
      style={styles.billerCard}
      onPress={() => onSelectBiller(item)}
      activeOpacity={0.8}
    >
      <View style={styles.billerContent}>
        <View style={styles.iconCircle}>
          <Ionicons name="business" size={24} color={colors.primary} />
        </View>
        <View style={styles.billerInfo}>
          <Text style={styles.billerName}>{item.name}</Text>
          <Text style={styles.billerCategory}>{item.category}</Text>
        </View>

        <View style={styles.rightSection}>
          {item.convenienceFee && (
            <View style={styles.feeBadge}>
              <Text style={styles.feeText}>+{item.convenienceFee} Fee</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} style={styles.chevron} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator text="Loading available billers..." />
      </View>
    );
  }

  if (!billers || billers.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="documents-outline" size={48} color={colors.textLighter} />
        </View>
        <Text style={styles.emptyTitle}>No Billers Available</Text>
        <Text style={styles.emptySubtitle}>
          We couldn't find any billers for this category at the moment.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={billers}
        renderItem={renderBiller}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  billerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  billerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  billerInfo: {
    flex: 1,
    marginRight: 8,
  },
  billerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  billerCategory: {
    fontSize: 13,
    color: colors.textLight,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeBadge: {
    backgroundColor: '#FEF3C7', // Soft warning bg
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  feeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  chevron: {
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8F9FA',
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});
