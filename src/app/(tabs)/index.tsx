import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  I18nManager,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../../constants/theme';
import { SearchBar } from '../../components/common';
import { CategoryGrid, FeaturedOffers } from '../../components/home';
import { StoreCard } from '../../components/stores';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useAppInitialization, usePersistBasket, usePersistFavorites } from '../../hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { getMainCategories } from '../../data/categories';
import { getFeaturedOffers } from '../../data/offers';
import type { Offer, Category } from '../../types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize app and persist data
  const isReady = useAppInitialization();
  usePersistBasket();
  usePersistFavorites();
  
  const stores = useAppSelector(state => state.stores.stores);
  const featuredOffers = getFeaturedOffers();
  const categories = getMainCategories();

  const handleOfferPress = (offer: Offer) => {
    router.push(`/offer/${offer.id}`);
  };

  const handleAddToBasket = (offer: Offer) => {
    const store = stores.find(s => s.id === offer.storeId);
    dispatch(addToBasket({
      offer,
      storeName: store?.nameAr || '',
    }));
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/flyers',
      params: { categoryId: category.id },
    });
  };

  const handleStorePress = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('home.searchPlaceholder')}
        />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
        </View>
        <CategoryGrid categories={categories} onCategoryPress={handleCategoryPress} />
      </View>

      {/* Featured Offers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.featuredOffers')}</Text>
          <TouchableOpacity onPress={() => router.push('/flyers')}>
            <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        <FeaturedOffers
          offers={featuredOffers}
          onOfferPress={handleOfferPress}
          onAddToBasket={handleAddToBasket}
        />
      </View>

      {/* Nearby Stores */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.nearbyStores')}</Text>
          <TouchableOpacity onPress={() => router.push('/stores')}>
            <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.storesList}>
          {stores.slice(0, 2).map(store => (
            <StoreCard
              key={store.id}
              store={store}
              onPress={() => handleStorePress(store.id)}
            />
          ))}
        </View>
      </View>

      {/* Trending Deals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.trendingDeals')}</Text>
        </View>
        <FeaturedOffers
          offers={featuredOffers.slice(0, 4)}
          onOfferPress={handleOfferPress}
          onAddToBasket={handleAddToBasket}
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  searchContainer: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  viewAll: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  storesList: {
    paddingHorizontal: spacing.md,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
