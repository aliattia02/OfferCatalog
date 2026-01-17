
// src/app/(tabs)/index.tsx - OPTIMIZED: Performance fixes
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { SearchBar, AdBanner } from '../../components/common';
import { InterstitialAdModal } from '../../components/common/InterstitialAdModal';
import { CompactLocationSelector } from '../../components/common/CompactLocationSelector';
import { FeaturedOffers } from '../../components/home';
import { StoreCard } from '../../components/stores';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  useAppInitialization,
  usePersistBasket,
  usePersistFavorites,
  useSafeTabBarHeight,
  useInterstitialAd
} from '../../hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteStore, toggleFavoriteSubcategory } from '../../store/slices/favoritesSlice';
import { loadCatalogues } from '../../store/slices/offersSlice';
import { getMainCategories } from '../../data/categories';
import { getActiveOffers } from '../../services/offerService';
import { formatDateRange } from '../../utils/catalogueUtils';
import type { Category, Catalogue, Store } from '../../types';
import type { OfferWithCatalogue } from '../../services/offerService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (spacing.md * 4)) / 3;

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

// ✅ OPTIMIZATION 1: Memoized category button component
const CategoryButton = memo(({
  category,
  onPress
}: {
  category: Category;
  onPress: (category: Category) => void;
}) => (
  <TouchableOpacity
    style={styles.categoryButton}
    onPress={() => onPress(category)}
    activeOpacity={0.7}
  >
    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
      <Ionicons name={category.icon as any} size={24} color={colors.white} />
    </View>
    <Text style={styles.categoryLabel} numberOfLines={1}>
      {category.nameAr}
    </Text>
  </TouchableOpacity>
));

// ✅ OPTIMIZATION 2: Memoized catalogue card component
const CatalogueCard = memo(({
  catalogue,
  storeName,
  isFavorite,
  onPress,
  onToggleFavorite
}: {
  catalogue: CatalogueWithStatus;
  storeName: string;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) => {
  const getStatusBadgeStyle = useCallback((status: CatalogueStatus) => {
    switch (status) {
      case 'active': return { backgroundColor: colors.success };
      case 'upcoming': return { backgroundColor: colors.warning };
      case 'expired': return { backgroundColor: colors.gray[400] };
    }
  }, []);

  return (
    <View style={styles.catalogueThumbnailWrapper}>
      <TouchableOpacity
        style={styles.catalogueThumbnail}
        onPress={onPress}
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
            onPress={onToggleFavorite}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? colors.primary : colors.white}
            />
          </TouchableOpacity>

          {catalogue.isLocalStore && (
            <View style={styles.localBadge}>
              <Text style={styles.localBadgeText}>محلي</Text>
            </View>
          )}
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
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { paddingBottom } = useSafeTabBarHeight();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredOffers, setFeaturedOffers] = useState<OfferWithCatalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { showAd, currentAd, checkAndShowAd, dismissAd } = useInterstitialAd();

  const isReady = useAppInitialization();
  usePersistBasket();
  usePersistFavorites();

  const stores = useAppSelector(state => state.stores.stores);
  const catalogues = useAppSelector(state => state.offers.catalogues);
  const cataloguesLoading = useAppSelector(state => state.offers.loading);
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);
  const favoriteSubcategoryIds = useAppSelector(state => state.favorites.subcategoryIds);
  const userGovernorate = useAppSelector(state => state.settings.userGovernorate);

  // ✅ OPTIMIZATION 3: Cache main categories (they never change)
  const mainCategories = useMemo(() => getMainCategories(), []);

  useFocusEffect(
    useCallback(() => {
      console.log('🏠 [Home] Screen focused - refreshing data');
      loadOffers(false);
      checkAndShowAd();
    }, [])
  );

  useEffect(() => {
    if (catalogues.length === 0 && !cataloguesLoading) {
      dispatch(loadCatalogues());
    }
  }, []);

  const loadOffers = async (forceRefresh: boolean = false) => {
    try {
      console.log(`📄 [Home] Loading active offers ${forceRefresh ? '(FORCE REFRESH)' : '(from cache if available)'}...`);
      setLoading(true);

      const offers = await getActiveOffers(forceRefresh);
      const featured = offers.slice(0, 6);
      setFeaturedOffers(featured);

      console.log(`✅ [Home] Loaded ${featured.length} featured offers ${forceRefresh ? '(fresh from Firestore)' : ''}`);
    } catch (error) {
      console.error('❌ [Home] Error loading offers:', error);
      setFeaturedOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 [Home] Manual refresh triggered - forcing fresh data from Firestore');
    setRefreshing(true);
    try {
      await loadOffers(true);
      await dispatch(loadCatalogues(true)).unwrap();

      console.log('✅ [Home] Refresh complete - all data updated from Firestore');
    } catch (error) {
      console.error('❌ [Home] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ OPTIMIZATION 4: Extract date normalization to separate memoized function
  const normalizeDate = useCallback((dateStr: string): string => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    } catch (error) {
      console.error('Error normalizing date:', dateStr, error);
      return dateStr;
    }
  }, []);

  // ✅ OPTIMIZATION 5: Memoize status calculation function
  const getCatalogueStatus = useCallback((startDate: string, endDate: string): CatalogueStatus => {
    try {
      const now = new Date();
      const normalizedStart = normalizeDate(startDate);
      const normalizedEnd = normalizeDate(endDate);

      const start = new Date(normalizedStart);
      const end = new Date(normalizedEnd);

      now.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('❌ Invalid date format:', { startDate, endDate });
        return 'expired';
      }

      if (now < start) return 'upcoming';
      if (now > end) return 'expired';
      return 'active';
    } catch (error) {
      console.error('❌ Error getting catalogue status:', error);
      return 'expired';
    }
  }, [normalizeDate]);

  // ✅ OPTIMIZATION 6: Optimized category groups - only recalculate when dependencies change
  const categoryGroups: CategoryGroup[] = useMemo(() => {
    console.log(`📚 [Home] Processing ${catalogues.length} catalogues...`);

    // First pass: Add status to all catalogues (do this once)
    const cataloguesWithStatus: CatalogueWithStatus[] = catalogues.map(cat => ({
      ...cat,
      status: getCatalogueStatus(cat.startDate, cat.endDate),
    }));

    // Second pass: Filter active catalogues
    let activeCatalogues = cataloguesWithStatus.filter(cat => cat.status === 'active');

    // Third pass: Apply location filter if needed
    if (userGovernorate) {
      activeCatalogues = activeCatalogues.filter(cat => {
        if (!cat.isLocalStore) return true;
        return cat.localStoreGovernorate === userGovernorate;
      });
    }

    // Fourth pass: Group by category
    const groups: { [categoryId: string]: CategoryGroup } = {};

    activeCatalogues.forEach(catalogue => {
      const categoryId = catalogue.categoryId || 'general';

      if (!groups[categoryId]) {
        const category = mainCategories.find(c => c.id === categoryId);
        groups[categoryId] = {
          categoryId,
          categoryName: category?.nameAr || t('categories.general'),
          categoryIcon: category?.icon || 'apps',
          categoryColor: category?.color || colors.primary,
          catalogues: [],
        };
      }

      groups[categoryId].catalogues.push(catalogue);
    });

    // Fifth pass: Sort catalogues within groups
    Object.values(groups).forEach(group => {
      group.catalogues.sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    });

    // Final pass: Sort groups by category order
    const groupArray = Object.values(groups);
    groupArray.sort((a, b) => {
      const orderA = mainCategories.findIndex(c => c.id === a.categoryId);
      const orderB = mainCategories.findIndex(c => c.id === b.categoryId);
      return orderA - orderB;
    });

    return groupArray;
  }, [catalogues, userGovernorate, mainCategories, t, getCatalogueStatus]);

  // ✅ OPTIMIZATION 7: Optimized top stores calculation
  const topStoresByCatalogueCount = useMemo(() => {
    console.log('📊 [Home] Calculating top stores by catalogue count...');

    // Reuse cataloguesWithStatus from categoryGroups if possible
    const cataloguesWithStatus: CatalogueWithStatus[] = catalogues.map(cat => ({
      ...cat,
      status: getCatalogueStatus(cat.startDate, cat.endDate),
    }));

    let activeCatalogues = cataloguesWithStatus.filter(cat => cat.status === 'active');

    if (userGovernorate) {
      activeCatalogues = activeCatalogues.filter(cat => {
        if (!cat.isLocalStore) return true;
        return cat.localStoreGovernorate === userGovernorate;
      });
    }

    const storeCatalogueCount: Record<string, number> = {};
    activeCatalogues.forEach(cat => {
      const storeId = cat.storeId;
      if (storeId) {
        storeCatalogueCount[storeId] = (storeCatalogueCount[storeId] || 0) + 1;
      }
    });

    const sortedStores = stores
      .map(store => ({
        store,
        catalogueCount: storeCatalogueCount[store.id] || 0,
      }))
      .filter(item => item.catalogueCount > 0)
      .sort((a, b) => b.catalogueCount - a.catalogueCount)
      .slice(0, 3)
      .map(item => item.store);

    console.log(`✅ [Home] Top 3 stores:`, sortedStores.map(s => s.nameAr));

    return sortedStores;
  }, [stores, catalogues, userGovernorate, getCatalogueStatus]);

  // ✅ OPTIMIZATION 8: Memoized event handlers
  const handleOfferPress = useCallback((offer: OfferWithCatalogue) => {
    router.push(`/offer/${offer.id}`);
  }, [router]);

  const handleAddToBasket = useCallback((offer: OfferWithCatalogue) => {
    dispatch(addToBasket({
      offer: {
        ...offer,
        storeId: offer.storeId,
        catalogueId: offer.catalogueId,
      },
      storeName: offer.storeName,
    }));
  }, [dispatch]);

  const handleToggleFavoriteSubcategory = useCallback((subcategoryId: string) => {
    dispatch(toggleFavoriteSubcategory(subcategoryId));
  }, [dispatch]);

  const handleCategoryPress = useCallback((category: Category) => {
    router.push({
      pathname: '/(tabs)/flyers',
      params: { mainCategoryId: category.id },
    });
  }, [router]);

  const handleStorePress = useCallback((storeId: string) => {
    router.push(`/store/${storeId}`);
  }, [router]);

  const handleCataloguePress = useCallback((catalogueId: string) => {
    router.push(`/flyer/${catalogueId}`);
  }, [router]);

  const handleToggleFavoriteStore = useCallback((storeId: string) => {
    dispatch(toggleFavoriteStore(storeId));
  }, [dispatch]);

  const handleSearchPress = useCallback(() => {
    router.push('/search');
  }, [router]);

  // ✅ OPTIMIZATION 9: Memoized store name getter
  const getStoreName = useCallback((catalogue: CatalogueWithStatus): string => {
    if (catalogue.isLocalStore) {
      if (catalogue.localStoreNameAr && catalogue.localStoreNameAr !== 'غير محدد') {
        return catalogue.localStoreNameAr;
      }
      return catalogue.titleAr;
    }

    const store = stores.find(s => s.id === catalogue.storeId);
    return store?.nameAr || catalogue.titleAr.replace('عروض ', '');
  }, [stores]);

  // ✅ OPTIMIZATION 10: Memoized horizontal categories renderer
  const renderHorizontalCategories = useMemo(() => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesScroll}
      contentContainerStyle={styles.categoriesContainer}
    >
      {mainCategories.map(category => (
        <CategoryButton
          key={category.id}
          category={category}
          onPress={handleCategoryPress}
        />
      ))}
    </ScrollView>
  ), [mainCategories, handleCategoryPress]);

  // ✅ OPTIMIZATION 11: Memoized catalogue card renderer
  const renderCatalogueCard = useCallback((catalogue: CatalogueWithStatus) => {
    const storeName = getStoreName(catalogue);
    const isFavorite = favoriteStoreIds.includes(catalogue.storeId);

    return (
      <CatalogueCard
        key={catalogue.id}
        catalogue={catalogue}
        storeName={storeName}
        isFavorite={isFavorite}
        onPress={() => handleCataloguePress(catalogue.id)}
        onToggleFavorite={() => handleToggleFavoriteStore(catalogue.storeId)}
      />
    );
  }, [getStoreName, favoriteStoreIds, handleCataloguePress, handleToggleFavoriteStore]);

  // ✅ OPTIMIZATION 12: Memoized category group renderer
  const renderCategoryGroup = useCallback((group: CategoryGroup) => (
    <View key={group.categoryId} style={styles.categoryGroup}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryHeaderIcon, { backgroundColor: group.categoryColor }]}>
          <Ionicons name={group.categoryIcon as any} size={20} color={colors.white} />
        </View>
        <Text style={styles.categoryGroupName}>{group.categoryName}</Text>
        <Text style={styles.catalogueCount}>
          {group.catalogues.length} {group.catalogues.length === 1 ? t('home.catalogue') : t('home.catalogues')}
        </Text>
      </View>
      <View style={styles.cataloguesGrid}>
        {group.catalogues.map(renderCatalogueCard)}
      </View>
    </View>
  ), [t, renderCatalogueCard]);

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
        />
      }
    >
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={handleSearchPress}
        activeOpacity={0.8}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('home.searchPlaceholder')}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>

      <AdBanner position="home" />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.mainCategories')}</Text>
        {renderHorizontalCategories}
      </View>

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
            <Text style={styles.loadingText}>{t('home.loadingOffers')}</Text>
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
            <Text style={styles.emptyText}>{t('home.noActiveOffers')}</Text>
          </View>
        )}
      </View>

      {categoryGroups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.locationSelectorRow}>
            <CompactLocationSelector />
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.activeCatalogues')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/flyers')}>
              <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {cataloguesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>{t('home.loadingCatalogues')}</Text>
            </View>
          ) : (
            <View style={styles.cataloguesSection}>
              {categoryGroups.map(renderCategoryGroup)}
            </View>
          )}
        </View>
      )}

      {topStoresByCatalogueCount.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.nearbyStores')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stores')}>
              <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.storesList}>
            {topStoresByCatalogueCount.map(store => (
              <StoreCard
                key={store.id}
                store={store}
                onPress={() => handleStorePress(store.id)}
                isFavorite={favoriteStoreIds.includes(store.id)}
                onToggleFavorite={() => handleToggleFavoriteStore(store.id)}
                hideBranchCount={true}
              />
            ))}
          </View>
        </View>
      )}

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

      {currentAd && (
        <InterstitialAdModal
          ad={currentAd}
          visible={showAd}
          onDismiss={dismissAd}
        />
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
  sectionTitleRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
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
  locationSelectorRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
  localBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  localBadgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '600',
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