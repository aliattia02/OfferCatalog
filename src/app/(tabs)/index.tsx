// src/app/(tabs)/index.tsx - UPDATED with subcategory favorites
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  I18nManager,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { SearchBar } from '../../components/common';
import { FeaturedOffers } from '../../components/home';
import { StoreCard } from '../../components/stores';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useAppInitialization, usePersistBasket, usePersistFavorites, useSafeTabBarHeight } from '../../hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteStore, toggleFavoriteSubcategory } from '../../store/slices/favoritesSlice';
import { loadCatalogues } from '../../store/slices/offersSlice';
import { getMainCategories } from '../../data/categories';
import { getActiveOffers } from '../../services/offerService';
import { formatDateRange } from '../../utils/catalogueUtils';
import type { Category, Catalogue } from '../../types';
import type { OfferWithCatalogue } from '../../services/offerService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (spacing.md * 4)) / 3; // 3 columns

type CatalogueStatus = 'active' | 'upcoming' | 'expired';

interface CatalogueWithStatus extends Catalogue {
  status: CatalogueStatus;
}

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  catalogues: CatalogueWithStatus[];
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { paddingBottom } = useSafeTabBarHeight();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredOffers, setFeaturedOffers] = useState<OfferWithCatalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize app and persist data
  const isReady = useAppInitialization();
  usePersistBasket();
  usePersistFavorites();

  const stores = useAppSelector(state => state.stores.stores);
  const catalogues = useAppSelector(state => state.offers.catalogues);
  const cataloguesLoading = useAppSelector(state => state.offers.loading);
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);
  const favoriteSubcategoryIds = useAppSelector(state => state.favorites.subcategoryIds); // NEW
  const mainCategories = getMainCategories();

  // Load catalogues and offers
  useEffect(() => {
    loadOffers();
    if (catalogues.length === 0 && !cataloguesLoading) {
      dispatch(loadCatalogues());
    }
  }, []);

  const loadOffers = async () => {
    try {
      console.log('📄 [Home] Loading active offers from Firestore...');
      setLoading(true);

      const offers = await getActiveOffers();
      console.log(`✅ [Home] Service returned ${offers.length} active offers`);

      offers.forEach(offer => {
        console.log(`  📝 [Home] ${offer.nameAr}: ${offer.catalogueStartDate} to ${offer.catalogueEndDate}`);
      });

      const featured = offers.slice(0, 6);
      setFeaturedOffers(featured);

      console.log(`✅ [Home] Set ${featured.length} featured offers`);
    } catch (error) {
      console.error('❌ [Home] Error loading offers:', error);
      setFeaturedOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 [Home] Refreshing data...');
    setRefreshing(true);
    try {
      await loadOffers();
      await dispatch(loadCatalogues()).unwrap();
      console.log('✅ [Home] Refresh complete');
    } catch (error) {
      console.error('❌ [Home] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getCatalogueStatus = (startDate: string, endDate: string): CatalogueStatus => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  };

  const categoryGroups: CategoryGroup[] = useMemo(() => {
    const cataloguesWithStatus: CatalogueWithStatus[] = catalogues.map(cat => ({
      ...cat,
      status: getCatalogueStatus(cat.startDate, cat.endDate),
    }));

    const activeCatalogues = cataloguesWithStatus.filter(cat => cat.status === 'active');
    const groups: { [categoryId: string]: CategoryGroup } = {};

    activeCatalogues.forEach(catalogue => {
      const categoryId = catalogue.categoryId || 'general';
      const category = mainCategories.find(c => c.id === categoryId);

      if (!groups[categoryId]) {
        groups[categoryId] = {
          categoryId,
          categoryName: category?.nameAr || 'عام',
          categoryIcon: category?.icon || 'apps',
          categoryColor: category?.color || colors.primary,
          catalogues: [],
        };
      }

      groups[categoryId].catalogues.push(catalogue);
    });

    Object.values(groups).forEach(group => {
      group.catalogues.sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    });

    const groupArray = Object.values(groups);
    groupArray.sort((a, b) => {
      const orderA = mainCategories.findIndex(c => c.id === a.categoryId);
      const orderB = mainCategories.findIndex(c => c.id === b.categoryId);
      return orderA - orderB;
    });

    return groupArray;
  }, [catalogues, mainCategories]);

  const handleOfferPress = (offer: OfferWithCatalogue) => {
    router.push(`/offer/${offer.id}`);
  };

  const handleAddToBasket = (offer: OfferWithCatalogue) => {
    dispatch(addToBasket({
      offer: {
        ...offer,
        storeId: offer.storeId,
        catalogueId: offer.catalogueId,
      },
      storeName: offer.storeName,
    }));
  };

  // NEW: Handle toggle favorite subcategory
  const handleToggleFavoriteSubcategory = (subcategoryId: string) => {
    dispatch(toggleFavoriteSubcategory(subcategoryId));
  };

  const handleCategoryPress = (category: Category) => {
    console.log(`🖱️ [Home] Category clicked: ${category.id}`);
    router.push({
      pathname: '/(tabs)/flyers',
      params: { mainCategoryId: category.id },
    });
  };

  const handleStorePress = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  const handleCataloguePress = (catalogueId: string) => {
    router.push(`/flyer/${catalogueId}`);
  };

  const handleToggleFavoriteStore = (storeId: string) => {
    dispatch(toggleFavoriteStore(storeId));
  };

  const getStatusBadgeStyle = (status: CatalogueStatus) => {
    switch (status) {
      case 'active': return { backgroundColor: colors.success };
      case 'upcoming': return { backgroundColor: colors.warning };
      case 'expired': return { backgroundColor: colors.gray[400] };
    }
  };

  const getStoreName = (catalogue: CatalogueWithStatus): string => {
    const store = stores.find(s => s.id === catalogue.storeId);
    return store?.nameAr || catalogue.titleAr.replace('عروض ', '');
  };

  const renderHorizontalCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesScroll}
      contentContainerStyle={styles.categoriesContainer}
    >
      {mainCategories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={styles.categoryButton}
          onPress={() => handleCategoryPress(category)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.categoryIcon,
            { backgroundColor: category.color }
          ]}>
            <Ionicons
              name={category.icon as any}
              size={24}
              color={colors.white}
            />
          </View>
          <Text style={styles.categoryLabel} numberOfLines={1}>
            {category.nameAr}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCatalogueCard = (catalogue: CatalogueWithStatus) => {
    const storeName = getStoreName(catalogue);
    const isFavorite = favoriteStoreIds.includes(catalogue.storeId);

    return (
      <View key={catalogue.id} style={styles.catalogueThumbnailWrapper}>
        <TouchableOpacity
          style={styles.catalogueThumbnail}
          onPress={() => handleCataloguePress(catalogue.id)}
          activeOpacity={0.7}
        >
          <View style={styles.thumbnailImageContainer}>
            <Image
              source={{ uri: catalogue.coverImage }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
            <View style={[styles.statusBadgeThumbnail, getStatusBadgeStyle(catalogue.status)]}>
              <View style={styles.statusDot} />
            </View>

            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleToggleFavoriteStore(catalogue.storeId)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavorite ? colors.primary : colors.white}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.thumbnailStoreName} numberOfLines={1}>
            {storeName}
          </Text>

          <Text style={styles.thumbnailDate} numberOfLines={1}>
            {formatDateRange(catalogue.startDate, catalogue.endDate)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCategoryGroup = (group: CategoryGroup) => (
    <View key={group.categoryId} style={styles.categoryGroup}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryHeaderIcon, { backgroundColor: group.categoryColor }]}>
          <Ionicons name={group.categoryIcon as any} size={20} color={colors.white} />
        </View>
        <Text style={styles.categoryGroupName}>{group.categoryName}</Text>
        <Text style={styles.catalogueCount}>
          {group.catalogues.length} {group.catalogues.length === 1 ? 'كتالوج' : 'كتالوجات'}
        </Text>
      </View>
      <View style={styles.cataloguesGrid}>
        {group.catalogues.map(renderCatalogueCard)}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          title="جاري التحديث..."
          titleColor={colors.textSecondary}
        />
      }
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('home.searchPlaceholder')}
        />
      </View>

      {/* Horizontal Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الفئات الرئيسية</Text>
        {renderHorizontalCategories()}
      </View>

      {/* Featured Offers - NOW WITH FAVORITES */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.featuredOffers')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/flyers')}>
            <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>جاري تحميل العروض...</Text>
          </View>
        ) : featuredOffers.length > 0 ? (
          <FeaturedOffers
            offers={featuredOffers}
            onOfferPress={handleOfferPress}
            onAddToBasket={handleAddToBasket}
            favoriteSubcategoryIds={favoriteSubcategoryIds}
            onToggleFavorite={handleToggleFavoriteSubcategory}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>لا توجد عروض نشطة حالياً</Text>
          </View>
        )}
      </View>

      {/* Active Catalogues by Category */}
      {categoryGroups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الكتالوجات النشطة</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/flyers')}>
              <Text style={styles.viewAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          {cataloguesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>جاري تحميل الكتالوجات...</Text>
            </View>
          ) : (
            <View style={styles.cataloguesSection}>
              {categoryGroups.map(renderCategoryGroup)}
            </View>
          )}
        </View>
      )}

      {/* Nearby Stores */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.nearbyStores')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/stores')}>
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

      {/* Trending Deals - NOW WITH FAVORITES */}
      {!loading && featuredOffers.length > 4 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.trendingDeals')}</Text>
          </View>
          <FeaturedOffers
            offers={featuredOffers.slice(3, 7)}
            onOfferPress={handleOfferPress}
            onAddToBasket={handleAddToBasket}
            favoriteSubcategoryIds={favoriteSubcategoryIds}
            onToggleFavorite={handleToggleFavoriteSubcategory}
          />
        </View>
      )}
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
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  viewAll: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  categoriesScroll: {
    maxHeight: 100,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryButton: {
    alignItems: 'center',
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
    width: 70,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  storesList: {
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  cataloguesSection: {
    paddingHorizontal: spacing.md,
  },
  categoryGroup: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: spacing.xs,
  },
  categoryHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryGroupName: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  catalogueCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  cataloguesGrid: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catalogueThumbnailWrapper: {
    width: CARD_WIDTH,
  },
  catalogueThumbnail: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  thumbnailImageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  statusBadgeThumbnail: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  statusDot: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailStoreName: {
    fontSize: 11,
    color: colors.text,
    marginTop: 5,
    textAlign: 'center',
    width: '100%',
    fontWeight: '600',
  },
  thumbnailDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
    fontWeight: '500',
  },
});