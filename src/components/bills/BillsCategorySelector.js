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
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import LoadingIndicator from '../LoadingIndicator';

const CATEGORY_META = {
  'Airtime': { emoji: '📱', color: '#2962FF', bg: '#EBF0FF' },
  'Data': { emoji: '🌐', color: '#0284C7', bg: '#E9F4FB' },
  'Cable TV': { emoji: '📺', color: '#7C3AED', bg: '#F2EDFF' },
  'Utility': { emoji: '⚡', color: '#F59E0B', bg: '#FEF9EC' },
  'Internet Subscription': { emoji: '🛰️', color: '#00897B', bg: '#E6F7F5' },
  'Education': { emoji: '🎓', color: '#0052CC', bg: '#EBF2FF' },
  'BETTING, LOTTERY AND GAMING': { emoji: '🎲', color: '#E53935', bg: '#FFEBEA' },
  'BETTTING, LOTTERY AND GAMING': { emoji: '🎲', color: '#E53935', bg: '#FFEBEA' },
};

const getCategory = (name) =>
  CATEGORY_META[name] || { emoji: '💳', color: colors.primary, bg: colors.primaryLight };

const formatCategoryName = (name) => {
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lower.includes('betting') || lower.includes('lottery') || lower.includes('gaming')) return 'Betting & Gaming';
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function BillsCategorySelector({ categories, loading, onSelectCategory, onBack }) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation.canGoBack()) navigation.goBack();
  };

  const renderCategory = ({ item }) => {
    const meta = getCategory(item.category);
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => onSelectCategory(item.category)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
        </View>
        <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={2}>
          {formatCategoryName(item.category)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator text="Loading categories..." />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Pay Bills</Text>
          <Text style={styles.subtitle}>Select a category to continue</Text>
        </View>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.category}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    width: '48%',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0D1F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: { fontSize: 30 },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
  },
});
