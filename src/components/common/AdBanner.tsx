// src/components/common/AdBanner.tsx - REDUCED CONSOLE SPAM
import React, { useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Text,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { AdBanner as AdBannerType } from '../../types/appConfig';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { isDateRangeActive } from '../../utils/dateUtils';

interface AdBannerProps {
  position: 'home' | 'flyers' | 'search' | 'store' | 'tabs_persistent' | 'tabs_bottom';
  maxAds?: number;
  horizontal?: boolean;
}

// 🔥 Track what we've already logged to prevent spam
const loggedOnce = {
  masterToggles: false,
  disabledReasons: new Set<string>(),
  positions: new Set<string>(),
};

export const AdBanner: React.FC<AdBannerProps> = ({
  position,
  maxAds,
  horizontal = false
}) => {
  const { i18n } = useTranslation();
  const config = useAppSelector((state) => state.appConfig.config);
  const hasLoggedForPosition = useRef(false);

  // 🔥 Only log once per position per session
  if (__DEV__ && !hasLoggedForPosition.current) {
    if (!loggedOnce.positions.has(position)) {
      console.log(`🎯 [AdBanner] Checking ads for position: ${position}`);
      loggedOnce.positions.add(position);
    }
    hasLoggedForPosition.current = true;
  }

  // 🔥 Log master toggles only ONCE per app session
  if (__DEV__ && !loggedOnce.masterToggles) {
    console.log('📊 [AdBanner] Master toggles:', {
      enableAds: config.features.enableAds,
      adsEnabled: config.advertisements.enabled,
      bannerAdsEnabled: config.advertisements.bannerAds.enabled,
    });
    loggedOnce.masterToggles = true;
  }

  // Check master toggles
  if (!config.features.enableAds) {
    // 🔥 Only log once per reason
    if (__DEV__ && !loggedOnce.disabledReasons.has('features.enableAds')) {
      console.log('❌ [AdBanner] Master ads disabled (features.enableAds)');
      loggedOnce.disabledReasons.add('features.enableAds');
    }
    return null;
  }

  if (!config.advertisements.enabled) {
    if (__DEV__ && !loggedOnce.disabledReasons.has('advertisements.enabled')) {
      console.log('❌ [AdBanner] Advertisements disabled');
      loggedOnce.disabledReasons.add('advertisements.enabled');
    }
    return null;
  }

  if (!config.advertisements.bannerAds.enabled) {
    if (__DEV__ && !loggedOnce.disabledReasons.has('bannerAds.enabled')) {
      console.log('❌ [AdBanner] Banner ads disabled');
      loggedOnce.disabledReasons.add('bannerAds.enabled');
    }
    return null;
  }

  // Filter ads for this position
  const filteredAds = config.advertisements.bannerAds.ads.filter(ad => {
    // Check if ad is active
    if (!ad.isActive) return false;

    // Check if ad has positions for this screen
    if (!ad.positions || !ad.positions.includes(position)) return false;

    // If both dates are missing/empty, ad is ALWAYS active
    if (!ad.startDate && !ad.endDate) return true;

    // Check date range if dates are provided
    return isDateRangeActive(ad.startDate, ad.endDate);
  });

  // 🔥 Only log results once per position
  if (__DEV__ && !hasLoggedForPosition.current && filteredAds.length > 0) {
    console.log(`✅ [AdBanner] Found ${filteredAds.length} ad(s) for "${position}"`);
  }

  if (filteredAds.length === 0) {
    return null;
  }

  // Sort by priority (highest first)
  const sortedAds = filteredAds.sort((a, b) => b.priority - a.priority);

  // Limit ads if maxAds is specified
  const adsToShow = maxAds ? sortedAds.slice(0, maxAds) : sortedAds;

  const handlePress = async (ad: AdBannerType) => {
    if (__DEV__) {
      console.log('🔗 [AdBanner] Opening:', ad.targetUrl);
    }

    try {
      let url = ad.targetUrl;

      // Add https:// if missing protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('❌ [AdBanner] Cannot open URL:', url);
      }
    } catch (error) {
      console.error('❌ [AdBanner] Error opening URL:', error);
    }
  };

  const renderAd = (ad: AdBannerType, index: number) => {
    const title = i18n.language === 'ar' ? ad.titleAr : ad.titleEn;

    return (
      <TouchableOpacity
        key={ad.id}
        style={[
          styles.container,
          horizontal && index < adsToShow.length - 1 && styles.horizontalMargin
        ]}
        onPress={() => handlePress(ad)}
        activeOpacity={0.8}
      >
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>
            {i18n.language === 'ar' ? 'إعلان' : 'Ad'}
          </Text>
        </View>
        <Image
          source={{ uri: ad.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {title && (
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // If horizontal and multiple ads, use ScrollView
  if (horizontal && adsToShow.length > 1) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContainer}
        style={styles.scrollView}
      >
        {adsToShow.map((ad, index) => renderAd(ad, index))}
      </ScrollView>
    );
  }

  // Otherwise, stack vertically
  return (
    <View style={styles.verticalContainer}>
      {adsToShow.map((ad, index) => renderAd(ad, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  verticalContainer: {
    width: '100%',
  },
  horizontalContainer: {
    paddingHorizontal: spacing.md,
  },
  scrollView: {
    marginVertical: spacing.md,
  },
  container: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginVertical: spacing.md,
    backgroundColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horizontalMargin: {
    marginRight: spacing.md,
    width: 300,
  },
  adBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  adBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 120,
  },
  titleContainer: {
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});