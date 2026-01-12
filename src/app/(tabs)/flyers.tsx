// src/app/(tabs)/flyers.tsx - UPDATED for subcategory favorites
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

import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { getTodayString, normalizeDateString } from '../../utils/dateUtils';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { OfferCard } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteSubcategory, toggleFavoriteStore } from '../../store/slices/favoritesSlice';
import { loadCatalogues } from '../../store/slices/offersSlice';
import { setCataloguesCache } from '../../data/catalogueRegistry';
import { getActiveOffers, getOffersByCategory, getAllOffers } from '../../services/offerService';
import {
  getMainCategories,
  getMainSubcategories,
  getCategoryById
} from '../../data/categories';
import { formatDateRange } from '../../utils/catalogueUtils';
import { useSafeTabBarHeight } from '../../hooks';
import type { Catalogue } from '../../types';
import type { OfferWithCatalogue } from '../../services/offerService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (spacing.md * 4)) / 3;

type FilterType = 'all' | 'active' | 'upcoming' | 'expired';
type CatalogueStatus = 'active' | 'upcoming' | 'expired';

interface CatalogueWithStatus extends Catalogue {
  status: CatalogueStatus;
}

interface StoreGroup {
  storeId: string;
  storeName: string;
  catalogues: CatalogueWithStatus[];
  hasActive: boolean;
}

export default function FlyersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { paddingBottom } = useSafeTabBarHeight();

  const params = useLocalSearchParams();
  const initialMainCategory = params.mainCategoryId as string | undefined;

  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(initialMainCategory || null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'catalogues' | 'offers'>('catalogues');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [offersStatusFilter, setOffersStatusFilter] = useState<FilterType>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [offersData, setOffersData] = useState<OfferWithCatalogue[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [allOffersForStats, setAllOffersForStats] = useState<OfferWithCatalogue[]>([]);

  const stores = useAppSelector(state => state.stores.stores);
  const catalogues = useAppSelector(state => state.offers.catalogues);
  const cataloguesLoading = useAppSelector(state => state.offers.loading);
  const favoriteSubcategoryIds = useAppSelector(state => state.favorites.subcategoryIds); // UPDATED
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);

  const mainCategories = getMainCategories();
  const mainSubcategories = useMemo(() => {
    if (selectedMainCategory) {
      return getMainSubcategories(selectedMainCategory);
    }
    return getMainSubcategories();
  }, [selectedMainCategory]);

  useEffect(() => {
    if (catalogues.length === 0 && !cataloguesLoading) {
      dispatch(loadCatalogues());
    }
  }, []);

  // Load all offers once for stats calculation
  useEffect(() => {
    const loadAllOffersForStats = async () => {
      try {
        console.log('📊 Loading all offers for stats...');
        const offers = await getAllOffers();
        setAllOffersForStats(offers);
        console.log(`✅ Loaded ${offers.length} offers for stats`);
      } catch (error) {
        console.error('❌ Error loading offers for stats:', error);
      }
    };

    loadAllOffersForStats();
  }, []);

  useEffect(() => {
    if (viewMode === 'offers') {
      console.log('🔵 [Flyers] Loading offers for offers view');
      loadOffers();
    }
  }, [viewMode, selectedSubcategory, offersStatusFilter, selectedMainCategory]);

  const loadOffers = async () => {
    try {
      console.log('📦 [Flyers] Starting loadOffers...');
      console.log('📦 [Flyers] Status filter:', offersStatusFilter);
      console.log('📦 [Flyers] Main category:', selectedMainCategory);
      console.log('📦 [Flyers] Subcategory:', selectedSubcategory);

      setOffersLoading(true);

      const today = getTodayString();
      console.log('📦 [Flyers] Using Egypt date:', today);

      let offers: OfferWithCatalogue[];

      if (selectedSubcategory) {
        console.log('📦 [Flyers] Loading by subcategory:', selectedSubcategory);
        const needAllOffers = offersStatusFilter === 'all' ||
                             offersStatusFilter === 'expired' ||
                             offersStatusFilter === 'upcoming';
        offers = await getOffersByCategory(selectedSubcategory, !needAllOffers);
      } else {
        console.log('📦 [Flyers] Loading based on status filter');
        if (offersStatusFilter === 'active') {
          offers = await getActiveOffers();
        } else {
          offers = await getAllOffers();
        }
      }

      console.log('📦 [Flyers] Raw offers loaded:', offers.length);

      const filteredOffers = offers.filter(offer => {
        const offerStartDate = normalizeDateString(offer.catalogueStartDate);
        const offerEndDate = normalizeDateString(offer.catalogueEndDate);

        let statusMatch = true;
        if (offersStatusFilter === 'active') {
          statusMatch = offerStartDate <= today && offerEndDate >= today;
        } else if (offersStatusFilter === 'upcoming') {
          statusMatch = offerStartDate > today;
        } else if (offersStatusFilter === 'expired') {
          statusMatch = offerEndDate < today;
        }

        if (!statusMatch) {
          console.log(`  ⏭️ [Flyers] Filtered out ${offer.nameAr}: ${offersStatusFilter} failed (${offerStartDate} to ${offerEndDate} vs ${today})`);
          return false;
        }

        if (selectedMainCategory && !selectedSubcategory) {
          const offerCategory = getCategoryById(offer.categoryId);
          if (offerCategory?.parentId !== selectedMainCategory) {
            console.log(`  ⏭️ [Flyers] Filtered out ${offer.nameAr}: category mismatch`);
            return false;
          }
        }

        console.log(`  ✅ [Flyers] Keeping ${offer.nameAr} (${offerStartDate} to ${offerEndDate})`);
        return true;
      });

      console.log('✅ [Flyers] Filtered offers:', filteredOffers.length);
      setOffersData(filteredOffers);
    } catch (error) {
      console.error('❌ [Flyers] Error loading offers:', error);
      setOffersData([]);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await dispatch(loadCatalogues()).unwrap();
      setCataloguesCache(result);

      const offers = await getAllOffers();
      setAllOffersForStats(offers);

      if (viewMode === 'offers') {
        await loadOffers();
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

  const cataloguesWithStatus: CatalogueWithStatus[] = useMemo(() => {
    let filtered = catalogues;
    if (selectedMainCategory) {
      filtered = catalogues.filter(cat => cat.categoryId === selectedMainCategory);
    }
    return filtered.map(cat => ({
      ...cat,
      status: getCatalogueStatus(cat.startDate, cat.endDate),
    }));
  }, [catalogues, selectedMainCategory]);

  const storeGroups: StoreGroup[] = useMemo(() => {
    const groups: { [storeId: string]: StoreGroup } = {};

    cataloguesWithStatus.forEach(catalogue => {
      if (!groups[catalogue.storeId]) {
        const store = stores.find(s => s.id === catalogue.storeId);
        groups[catalogue.storeId] = {
          storeId: catalogue.storeId,
          storeName: store?.nameAr || catalogue.titleAr.replace('عروض ', ''),
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
  }, [cataloguesWithStatus, stores]);

  const filteredStoreGroups = useMemo(() => {
    let filtered = storeGroups;

    if (statusFilter !== 'all') {
      filtered = filtered.map(group => ({
        ...group,
        catalogues: group.catalogues.filter(cat => {
          if (statusFilter === 'active') return cat.status === 'active';
          if (statusFilter === 'upcoming') return cat.status === 'upcoming';
          if (statusFilter === 'expired') return cat.status === 'expired';
          return true;
        }),
      })).filter(group => group.catalogues.length > 0);
    }

    return filtered;
  }, [storeGroups, statusFilter]);

  const catalogueStats = useMemo(() => {
    const all = cataloguesWithStatus;
    return {
      all: all.length,
      active: all.filter(c => c.status === 'active').length,
      upcoming: all.filter(c => c.status === 'upcoming').length,
      expired: all.filter(c => c.status === 'expired').length,
    };
  }, [cataloguesWithStatus]);

  const offersStats = useMemo(() => {
    const today = getTodayString();

    const dataSource = (viewMode === 'offers' && offersData.length > 0)
      ? offersData
      : allOffersForStats;

    if (dataSource.length === 0) {
      return { all: 0, active: 0, upcoming: 0, expired: 0 };
    }

    return {
      all: dataSource.length,
      active: dataSource.filter(o => {
        const start = normalizeDateString(o.catalogueStartDate);
        const end = normalizeDateString(o.catalogueEndDate);
        return start <= today && end >= today;
      }).length,
      upcoming: dataSource.filter(o => {
        const start = normalizeDateString(o.catalogueStartDate);
        return start > today;
      }).length,
      expired: dataSource.filter(o => {
        const end = normalizeDateString(o.catalogueEndDate);
        return end < today;
      }).length,
    };
  }, [offersData, allOffersForStats, viewMode]);

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

  // UPDATED: Handle toggle favorite subcategory
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'upcoming': return 'قادم';
      case 'expired': return 'منتهي';
      default: return status;
    }
  };

  const renderMainCategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
      <TouchableOpacity style={[styles.categoryChip, !selectedMainCategory && styles.categoryChipActive]} onPress={() => { setSelectedMainCategory(null); setSelectedSubcategory(null); }}>
        <Text style={[styles.categoryChipText, !selectedMainCategory && styles.categoryChipTextActive]}>الكل</Text>
      </TouchableOpacity>
      {mainCategories.map(category => (
        <TouchableOpacity key={category.id} style={[styles.categoryChip, selectedMainCategory === category.id && styles.categoryChipActive]} onPress={() => { setSelectedMainCategory(category.id); setSelectedSubcategory(null); }}>
          <Ionicons name={category.icon as any} size={16} color={selectedMainCategory === category.id ? colors.white : colors.primary} />
          <Text style={[styles.categoryChipText, selectedMainCategory === category.id && styles.categoryChipTextActive]}>{category.nameAr}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSubcategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContainer}>
      <TouchableOpacity style={[styles.categoryChip, !selectedSubcategory && styles.categoryChipActive]} onPress={() => setSelectedSubcategory(null)}>
        <Text style={[styles.categoryChipText, !selectedSubcategory && styles.categoryChipTextActive]}>{selectedMainCategory ? 'الكل' : t('categories.all')}</Text>
      </TouchableOpacity>
      {mainSubcategories.map(subcategory => (
        <TouchableOpacity key={subcategory.id} style={[styles.categoryChip, selectedSubcategory === subcategory.id && styles.categoryChipActive]} onPress={() => setSelectedSubcategory(subcategory.id)}>
          <Text style={[styles.categoryChipText, selectedSubcategory === subcategory.id && styles.categoryChipTextActive]}>{subcategory.nameAr}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStatusFilter = () => {
    const currentFilter = viewMode === 'catalogues' ? statusFilter : offersStatusFilter;
    const setCurrentFilter = viewMode === 'catalogues' ? setStatusFilter : setOffersStatusFilter;
    const stats = viewMode === 'catalogues' ? catalogueStats : offersStats;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {(['all', 'active', 'upcoming', 'expired'] as FilterType[]).map((filter) => {
          const count = stats[filter];

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                currentFilter === filter && styles.filterChipActive,
                filter === 'active' && currentFilter === filter && styles.filterChipActiveGreen
              ]}
              onPress={() => setCurrentFilter(filter)}
            >
              <Text style={[styles.filterChipText, currentFilter === filter && styles.filterChipTextActive]}>
                {filter === 'all' ? 'الكل' : getStatusLabel(filter)}
                {` (${count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity style={[styles.toggleButton, viewMode === 'catalogues' && styles.toggleButtonActive]} onPress={() => setViewMode('catalogues')}>
        <Ionicons name="book-outline" size={20} color={viewMode === 'catalogues' ? colors.white : colors.text} />
        <Text style={[styles.toggleText, viewMode === 'catalogues' && styles.toggleTextActive]}>كتالوجات</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.toggleButton, viewMode === 'offers' && styles.toggleButtonActive]} onPress={() => setViewMode('offers')}>
        <Ionicons name="grid-outline" size={20} color={viewMode === 'offers' ? colors.white : colors.text} />
        <Text style={[styles.toggleText, viewMode === 'offers' && styles.toggleTextActive]}>عروض</Text>
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
        <Text style={styles.catalogueCount}>{group.catalogues.length} {group.catalogues.length === 1 ? 'كتالوج' : 'كتالوجات'}</Text>
      </View>
      <View style={styles.cataloguesGrid}>
        {group.catalogues.map(renderCatalogueCard)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderViewToggle()}
      {renderMainCategoryFilter()}
      {viewMode === 'offers' && renderSubcategoryFilter()}
      {renderStatusFilter()}

      {viewMode === 'catalogues' ? (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          {cataloguesLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>جاري تحميل الكتالوجات...</Text>
            </View>
          )}
          {!cataloguesLoading && filteredStoreGroups.length > 0 ? (
            filteredStoreGroups.map(renderStoreGroup)
          ) : !cataloguesLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyStateText}>لا توجد كتالوجات {statusFilter !== 'all' ? getStatusLabel(statusFilter) : ''}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <>
          {offersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>جاري تحميل العروض...</Text>
            </View>
          ) : offersData.length > 0 ? (
            <FlatList
              data={offersData}
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
              contentContainerStyle={[styles.offersContainer, { paddingBottom }]}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyStateText}>
                لا توجد عروض {selectedSubcategory ? 'في هذا القسم' : offersStatusFilter !== 'all' ? getStatusLabel(offersStatusFilter) : ''}
              </Text>
              <Text style={styles.emptyStateSubtext}>جرب تغيير الفلاتر للعثور على عروض</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  viewToggle: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', margin: spacing.md, backgroundColor: colors.gray[100], borderRadius: borderRadius.lg, padding: spacing.xs },
  toggleButton: { flex: 1, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  toggleButtonActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: typography.fontSize.md, color: colors.text, marginLeft: I18nManager.isRTL ? 0 : spacing.xs, marginRight: I18nManager.isRTL ? spacing.xs : 0 },
  toggleTextActive: { color: colors.white, fontWeight: '600' },
  filterScroll: { maxHeight: 50, marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  filterContainer: { paddingRight: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.white, marginRight: I18nManager.isRTL ? 0 : spacing.sm, marginLeft: I18nManager.isRTL ? spacing.sm : 0, borderWidth: 1, borderColor: colors.gray[200] },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipActiveGreen: { backgroundColor: colors.success, borderColor: colors.success },
  filterChipText: { fontSize: typography.fontSize.sm, color: colors.text },
  filterChipTextActive: { color: colors.white, fontWeight: '600' },
  categoryScroll: { maxHeight: 50 },
  categoryContainer: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  categoryChip: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.white, marginRight: I18nManager.isRTL ? 0 : spacing.sm, marginLeft: I18nManager.isRTL ? spacing.sm : 0, borderWidth: 1, borderColor: colors.gray[200] },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: typography.fontSize.sm, color: colors.text },
  categoryChipTextActive: { color: colors.white, fontWeight: '600' },
  content: { flex: 1, padding: spacing.md },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  loadingText: { marginTop: spacing.md, fontSize: typography.fontSize.md, color: colors.textSecondary },
  storeGroup: { marginBottom: spacing.lg },
  storeHeader: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: colors.white, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, gap: spacing.xs },
  storeName: { flex: 1, fontSize: typography.fontSize.md, fontWeight: 'bold', color: colors.text, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  catalogueCount: { fontSize: typography.fontSize.xs, color: colors.textSecondary, backgroundColor: colors.gray[100], paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm },
  cataloguesGrid: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: spacing.sm },
  catalogueThumbnailWrapper: { width: CARD_WIDTH },
  catalogueThumbnail: { width: '100%', alignItems: 'center', marginBottom: spacing.xs },
  thumbnailImageContainer: { width: CARD_WIDTH, height: CARD_WIDTH * 1.4, backgroundColor: colors.gray[100], borderRadius: borderRadius.md, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 3 },
  thumbnailImage: { width: '100%', height: '100%' },
  statusBadgeThumbnail: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.white },
  statusDot: { width: '100%', height: '100%' },
  favoriteButton: { position: 'absolute', top: 6, left: 6, width: 28, height: 28, borderRadius: borderRadius.full, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  thumbnailDate: { fontSize: 10, color: colors.textSecondary, marginTop: 5, textAlign: 'center', width: '100%', fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyStateText: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
  emptyStateSubtext: { fontSize: typography.fontSize.sm, color: colors.gray[400], marginTop: spacing.xs, textAlign: 'center' },
  offersContainer: { padding: spacing.md },
  offerRow: { justifyContent: 'space-between' },
});