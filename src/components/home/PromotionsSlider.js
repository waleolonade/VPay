import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../styles/colors';

const { width: screenWidth } = Dimensions.get('window');

// Default promotions if none are provided
const defaultPromotions = [
  { 
    id: '1', 
    title: 'Get 5% Cashback',
    subtitle: 'On all bill payments this month',
    image: 'https://via.placeholder.com/600x300.png/FFC107/000000?text=Cashback',
    action: 'cashback',
    gradient: ['#FFD700', '#FFA500'],
    icon: 'gift-outline'
  },
  { 
    id: '2', 
    title: 'Refer & Earn ₦500',
    subtitle: 'For every friend you invite',
    image: 'https://via.placeholder.com/600x300.png/4CAF50/FFFFFF?text=Referral',
    action: 'referral',
    gradient: ['#4CAF50', '#2E7D32'],
    icon: 'people-outline'
  },
  { 
    id: '3', 
    title: 'Smart Savings',
    subtitle: 'Earn up to 15% interest per annum',
    image: 'https://via.placeholder.com/600x300.png/2196F3/FFFFFF?text=Savings',
    action: 'savings',
    gradient: ['#2196F3', '#1565C0'],
    icon: 'wallet-outline'
  },
  { 
    id: '4', 
    title: 'Quick Loans',
    subtitle: 'Get instant loans up to ₦500,000',
    image: 'https://via.placeholder.com/600x300.png/9C27B0/FFFFFF?text=Loans',
    action: 'loan',
    gradient: ['#9C27B0', '#6A1B9A'],
    icon: 'cash-outline'
  },
];

const PromotionsSlider = ({ promotions = defaultPromotions, onPromoPress }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.slide, { width: screenWidth - 40 }]}
      onPress={() => onPromoPress?.(item)}
      activeOpacity={0.9}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={item.gradient || ['#667eea', '#764ba2']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      <View style={styles.overlay}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon || 'star-outline'} size={32} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={promotions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        snapToAlignment="center"
        decelerationRate="fast"
        snapToInterval={screenWidth - 28}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
  },
  flatListContent: {
    paddingHorizontal: 20,
  },
  slide: {
    backgroundColor: colors.white,
    borderRadius: 20,
    height: 160,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PromotionsSlider;