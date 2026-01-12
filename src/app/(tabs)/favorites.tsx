// src/app/(tabs)/favorites.tsx - UPDATED FOR SUBCATEGORIES
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  I18nManager,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { OfferCard } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteSubcategory, toggleFavoriteStore } from '../../store/slices/favoritesSlice';
import { loadCatalogues } from '../../store/slices/offersSlice';
import { getAllOffers } from '../../services/offerService';
import { formatDateRange } from '../../utils/catalogueUtils';
import { useSafeTabBarHeight } from '../../hooks';
import { getCategoryById, getSubcategories } from '../../data/categories';
import type { Catalogue, Category } from '../../types';
import type { OfferWithCatalogue } from '../../services/offerService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (spacing.md * 4)) / 3;

type ViewMode = 'catalogues' | 'subcategories';
type CatalogueStatus = 'active' | 'upcoming' | 'expired';

interface CatalogueWithStatus extends Catalogue {
  status: CatalogueStatus;
  storeName: string;
}

interface StoreGroup {
  storeId: string;
  storeName: string;
  catalogues: CatalogueWithStatus[];
  hasActive: boolean;
}

interface SubcategoryGroup {
  subcategoryId: string;
  subcategoryName: string;
  subcategoryIcon: string;
  offers: OfferWithCatalogue[];
}

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { paddingBottom } = useSafeTabBarHeight();

  const [viewMode, setViewMode] = useState<ViewMode>('subcategories');
  const [refreshing, setRefreshing] = useState(false);
  const [offersData, setOffersData] = useState<OfferWithCatalogue[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const stores = useAppSelector(state => state.stores.stores);
  const catalogues = useAppSelector(state => state.offers.catalogues);
  const cataloguesLoading = useAppSelector(state => state.offers.loading);
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);
  const favoriteSubcategoryIds = useAppSelector(state => state.favorites.subcategoryIds);

  useEffect(() => {
    if (catalogues.length === 0 && !cataloguesLoading) {
      dispatch(loadCatalogues());
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'subcategories') {
      loadFavoriteSubcategoryOffers();
    }
  }, [viewMode, favoriteSubcategoryIds]);

  const loadFavoriteSubcategoryOffers = async () => {
    try {
      setOffersLoading(true);
      const allOffers = await getAllOffers();

      // Filter offers by favorite subcategories
      const favoriteOffers = allOffers.filter(offer =>
        favoriteSubcategoryIds.includes(offer.categoryId)
      );

      setOffersData(favoriteOffers);
      console.log(`✅ Loaded ${favoriteOffers.length} offers from ${favoriteSubcategoryIds.length} favorite subcategories`);
    } catch (error) {
      console.error('Error loading favorite subcategory offers:', error);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(loadCatalogues()).unwrap();
      if (viewMode === 'subcategories') {
        await loadFavoriteSubcategoryOffers();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
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

  // Get favorite stores' catalogues
  const favoriteCatalogues: CatalogueWithStatus[] = useMemo(() => {
    return catalogues
      .filter(cat => favoriteStoreIds.includes(cat.storeId))
      .map(cat => {
        const store = stores.find(s => s.id === cat.storeId);
        return {
          ...cat,
          status: getCatalogueStatus(cat.startDate, cat.endDate),
          storeName: store?.nameAr || cat.titleAr.replace('عروض ', ''),
        };
      });
  }, [catalogues, favoriteStoreIds, stores]);

  // Group catalogues by store
  const storeGroups: StoreGroup[] = useMemo(() => {
    const groups: { [storeId: string]: StoreGroup } = {};

    favoriteCatalogues.forEach(catalogue => {
      if (!groups[catalogue.storeId]) {
        groups[catalogue.storeId] = {
          storeId: catalogue.storeId,
          storeName: catalogue.storeName,
          catalogues: [],
          hasActive: false,
        };
      }
      groups[catalogue.storeId].catalogues.push(catalogue);
      if (catalogue.status === 'active') {
        groups[catalogue.storeId].hasActive = true;
      }
    });

    const groupArray = Object.values(groups);
    groupArray.sort((a, b) => a.storeName.localeCompare(b.storeName, 'ar'));
    groupArray.forEach(group => {
      group.catalogues.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
    });
    return groupArray;
  }, [favoriteCatalogues]);

  // Group offers by subcategory
  const subcategoryGroups: SubcategoryGroup[] = useMemo(() => {
    const groups: { [subcategoryId: string]: SubcategoryGroup } = {};

    offersData.forEach(offer => {
      const subcategoryId = offer.categoryId;
      if (!subcategoryId) return;

      if (!groups[subcategoryId]) {
        const subcategory = getCategoryById(subcategoryId);
        groups[subcategoryId] = {
          subcategoryId,
          subcategoryName: subcategory?.nameAr || subcategoryId,
          subcategoryIcon: subcategory?.icon || 'pricetag',
          offers: [],
        };
      }
      groups[subcategoryId].offers.push(offer);
    });

    // Convert to array and sort by name
    const groupArray = Object.values(groups);
    groupArray.sort((a, b) => a.subcategoryName.localeCompare(b.subcategoryName, 'ar'));

    return groupArray;
  }, [offersData]);

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

  const handleToggleFavoriteSubcategory = (subcategoryId: string) => {
    dispatch(toggleFavoriteSubcategory(subcategoryId));
  };

  const handleToggleFavoriteStore = (storeId: string) => {
    dispatch(toggleFavoriteStore(storeId));
  };

  const handleCataloguePress = (catalogueId: string) => {
    router.push(`/flyer/${catalogueId}`);
  };

  const getStatusBadgeStyle = (status: CatalogueStatus) => {
    switch (status) {
      case 'active': return { backgroundColor: colors.success };
      case 'upcoming': return { backgroundColor: colors.warning };
      case 'expired': return { backgroundColor: colors.gray[400] };
    }
  };

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'catalogues' && styles.toggleButtonActive]}
        onPress={() => setViewMode('catalogues')}
      >
        <Ionicons
          name="book-outline"
          size={20}
          color={viewMode === 'catalogues' ? colors.white : colors.text}
        />
        <Text style={[styles.toggleText, viewMode === 'catalogues' && styles.toggleTextActive]}>
          كتالوجات
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'subcategories' && styles.toggleButtonActive]}
        onPress={() => setViewMode('subcategories')}
      >
        <Ionicons
          name="grid-outline"
          size={20}
          color={viewMode === 'subcategories' ? colors.white : colors.text}
        />
        <Text style={[styles.toggleText, viewMode === 'subcategories' && styles.toggleTextActive]}>
          فئات مفضلة
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCatalogueCard = (catalogue: CatalogueWithStatus) => {
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
            {catalogue.storeName}
          </Text>
          <Text style={styles.thumbnailDate} numberOfLines={1}>
            {formatDateRange(catalogue.startDate, catalogue.endDate)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStoreGroup = (group: StoreGroup) => (
    <View key={group.storeId} style={styles.storeGroup}>
      <View style={styles.storeHeader}>
        <Ionicons name="storefront" size={20} color={colors.primary} />
        <Text style={styles.storeName}>{group.storeName}</Text>
        <Text style={styles.catalogueCount}>
          {group.catalogues.length} {group.catalogues.length === 1 ? 'كتالوج' : 'كتالوجات'}
        </Text>
      </View>
      <View style={styles.cataloguesGrid}>
        {group.catalogues.map(renderCatalogueCard)}
      </View>
    </View>
  );

  const renderSubcategoryGroup = (group: SubcategoryGroup) => {
    const isFavorite = favoriteSubcategoryIds.includes(group.subcategoryId);

    return (
      <View key={group.subcategoryId} style={styles.subcategoryGroup}>
        <View style={styles.subcategoryHeader}>
          <View style={styles.subcategoryHeaderLeft}>
            <Ionicons name={group.subcategoryIcon as any} size={20} color={colors.primary} />
            <Text style={styles.subcategoryName}>{group.subcategoryName}</Text>
            <Text style={styles.offerCount}>
              {group.offers.length} {group.offers.length === 1 ? 'عرض' : 'عروض'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleToggleFavoriteSubcategory(group.subcategoryId)}
            style={styles.favoriteIconButton}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.primary : colors.gray[400]}
            />
          </TouchableOpacity>
        </View>
        <FlatList
          data={group.offers}
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              onPress={() => handleOfferPress(item)}
              onAddToBasket={() => handleAddToBasket(item)}
              isFavorite={favoriteSubcategoryIds.includes(item.categoryId)}
              onToggleFavorite={() => handleToggleFavoriteSubcategory(item.categoryId)}
            />
          )}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.offerRow}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'المفضلة',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        {renderViewToggle()}

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Ionicons name="storefront" size={20} color={colors.primary} />
            <Text style={styles.statText}>
              {favoriteStoreIds.length} {favoriteStoreIds.length === 1 ? 'متجر' : 'متاجر'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="pricetag" size={20} color={colors.primary} />
            <Text style={styles.statText}>
              {favoriteSubcategoryIds.length} {favoriteSubcategoryIds.length === 1 ? 'فئة' : 'فئات'}
            </Text>
          </View>
        </View>

        {viewMode === 'catalogues' ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {cataloguesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>جاري تحميل الكتالوجات...</Text>
              </View>
            ) : storeGroups.length > 0 ? (
              storeGroups.map(renderStoreGroup)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={64} color={colors.gray[300]} />
                <Text style={styles.emptyStateText}>لا توجد متاجر مفضلة</Text>
                <Text style={styles.emptyStateSubtext}>
                  اضغط على ❤️ على أي متجر لإضافته للمفضلة
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push('/(tabs)/flyers')}
                >
                  <Text style={styles.exploreButtonText}>تصفح الكتالوجات</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {offersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>جاري تحميل العروض...</Text>
              </View>
            ) : subcategoryGroups.length > 0 ? (
              subcategoryGroups.map(renderSubcategoryGroup)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={64} color={colors.gray[300]} />
                <Text style={styles.emptyStateText}>لا توجد فئات مفضلة</Text>
                <Text style={styles.emptyStateSubtext}>
                  اضغط على ❤️ على أي عرض لحفظ فئته
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push('/(tabs)/flyers')}
                >
                  <Text style={styles.exploreButtonText}>تصفح العروض</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  viewToggle: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    margin: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  toggleButton: {
    flex: 1,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  toggleTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  storeGroup: {
    marginBottom: spacing.lg,
  },
  storeHeader: {
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
  storeName: {
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
  subcategoryGroup: {
    marginBottom: spacing.lg,
  },
  subcategoryHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  subcategoryHeaderLeft: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  subcategoryName: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  offerCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  favoriteIconButton: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  exploreButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  offerRow: {
    justifyContent: 'space-between',
  },
});
