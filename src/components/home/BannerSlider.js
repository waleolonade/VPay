import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors } from '../../styles/colors';

/**
 * BannerSlider Component
 * Displays promotional banners including bills payment offerings
 * Based on VFDTech Bills Payment API categories and features
 */
export default function BannerSlider({ 
  banners = null, 
  onBannerPress,
  showDefaultBanners = true 
}) {
  // Default promotional banners for bills payment
  const defaultBanners = showDefaultBanners ? [
    {
      id: 'bills-airtime',
      type: 'gradient-blue',
      title: 'Instant Airtime',
      subtitle: 'Get airtime to any network instantly',
      icon: '📱',
      action: 'bills-airtime',
    },
    {
      id: 'bills-utility',
      type: 'gradient-yellow',
      title: 'Pay Utilities',
      subtitle: 'Electricity, Water & Internet bills',
      icon: '⚡',
      action: 'bills-utility',
    },
    {
      id: 'bills-cable',
      type: 'gradient-purple',
      title: 'Cable TV',
      subtitle: 'DSTV, GoTV & Startimes subscriptions',
      icon: '📺',
      action: 'bills-cable',
    },
    {
      id: 'bills-rewards',
      type: 'gradient-green',
      title: 'Earn Rewards',
      subtitle: 'Get cashback on every bill payment',
      icon: '🎁',
      action: 'bills-rewards',
    },
  ] : [];

  const displayBanners = banners && banners.length > 0 ? banners : defaultBanners;
  const screenWidth = Dimensions.get('window').width;
  const bannerWidth = screenWidth - 32; // 16px padding on each side

  const renderBanner = (banner) => {
    // If custom banner with image
    if (banner.image) {
      return (
        <TouchableOpacity
          key={banner.id}
          style={[styles.banner, { width: bannerWidth }]}
          onPress={() => onBannerPress(banner)}
          activeOpacity={0.8}
        >
          <Image source={banner.image} style={styles.image} />
        </TouchableOpacity>
      );
    }

    // Default promotional banner
    return (
      <TouchableOpacity
        key={banner.id}
        style={[
          styles.banner,
          styles.defaultBanner,
          { width: bannerWidth },
          banner.type === 'gradient-blue' && styles.bannerBlue,
          banner.type === 'gradient-yellow' && styles.bannerYellow,
          banner.type === 'gradient-purple' && styles.bannerPurple,
          banner.type === 'gradient-green' && styles.bannerGreen,
        ]}
        onPress={() => onBannerPress(banner)}
        activeOpacity={0.85}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerIcon}>{banner.icon}</Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
          </View>
          <Text style={styles.bannerArrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!displayBanners || displayBanners.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      style={styles.slider}
      contentContainerStyle={styles.sliderContent}
    >
      {displayBanners.map(banner => renderBanner(banner))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  slider: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sliderContent: {
    paddingRight: 16,
  },
  banner: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  defaultBanner: {
    height: 140,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerLeft: {
    marginRight: 12,
  },
  bannerIcon: {
    fontSize: 36,
  },
  bannerRight: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  bannerArrow: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  // Color gradients for bill categories
  bannerBlue: {
    backgroundColor: colors.primary,
  },
  bannerYellow: {
    backgroundColor: '#FFA500',
  },
  bannerPurple: {
    backgroundColor: '#9C27B0',
  },
  bannerGreen: {
    backgroundColor: colors.success,
  },
});
