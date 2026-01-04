// src/app/(tabs)/flyers.tsx
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { OfferCard } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteOffer } from '../../store/slices/favoritesSlice';
import { loadCatalogues } from '../../store/slices/offersSlice';
import { setCataloguesCache } from '../../data/catalogueRegistry';
import { offers } from '../../data/offers';
import { categories } from '../../data/categories';
import { formatDateRange } from '../../utils/catalogueUtils';
import type { Offer, Catalogue } from '../../types';

type FilterType = 'all' | 'active' | 'upcoming' | 'expired';
type CatalogueStatus = 'active' | 'upcoming' | 'expired';

interface CatalogueWithStatus extends Catalogue {
  status: CatalogueStatus;
}

export default function FlyersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'catalogues' | 'offers'>('catalogues');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const stores = useAppSelector(state => state.stores. stores);
  const catalogues = useAppSelector(state => state.offers.catalogues);
  const cataloguesLoading = useAppSelector(state => state.offers.loading);
  const favoriteOfferIds = useAppSelector(state => state.favorites.offerIds);

  // Load catalogues on mount if not loaded
  useEffect(() => {
    console.log('🎬 [Flyers] Component mounted');
    console.log(`📦 [Flyers] Catalogues in Redux: ${catalogues.length}`);

    if (catalogues.length === 0 && !cataloguesLoading) {
      console.log('📥 [Flyers] No catalogues, loading from Firestore...');
      dispatch(loadCatalogues());
    }
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    console.log('🔄 [Flyers] Refreshing catalogues...');
    setRefreshing(true);
    try {
      const result = await dispatch(loadCatalogues()).unwrap();
      setCataloguesCache(result);
      console.log('✅ [Flyers] Catalogues refreshed');
    } catch (error) {
      console.error('❌ [Flyers] Error refreshing:', error);
    }
    setRefreshing(false);
  };

  // Determine catalogue status
  const getCatalogueStatus = (startDate: string, endDate: string): CatalogueStatus => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now < start) {
      return 'upcoming';
    } else if (now > end) {
      return 'expired';
    } else {
      return 'active';
    }
  };

  // Get catalogues with status - COMPUTED FROM REDUX
  const cataloguesWithStatus:  CatalogueWithStatus[] = useMemo(() => {
    console.log(`🔄 [Flyers] Computing catalogues with status from ${catalogues.length} Redux items`);
    const result = catalogues.map(cat => ({
      ...cat,
      status: getCatalogueStatus(cat.startDate, cat.endDate),
    }));
    console.log(`✅ [Flyers] Computed ${result.length} catalogues with status`);
    return result;
  }, [catalogues]);

  // Group by status - COMPUTED FROM REDUX
  const catalogueGroups = useMemo(() => {
    const groups = {
      all: cataloguesWithStatus,
      active: cataloguesWithStatus.filter(c => c.status === 'active'),
      upcoming: cataloguesWithStatus.filter(c => c. status === 'upcoming'),
      expired: cataloguesWithStatus.filter(c => c.status === 'expired'),
    };

    console.log('📊 [Flyers] Catalogue groups:', {
      all: groups.all.length,
      active: groups.active.length,
      upcoming: groups.upcoming.length,
      expired: groups.expired.length,
    });

    return groups;
  }, [cataloguesWithStatus]);

  // Filter catalogues based on selected status
  const filteredCatalogues = useMemo(() => {
    let result:  CatalogueWithStatus[];
    switch (statusFilter) {
      case 'active':
        result = catalogueGroups.active;
        break;
      case 'upcoming':
        result = catalogueGroups.upcoming;
        break;
      case 'expired':
        result = catalogueGroups.expired;
        break;
      default:
        result = catalogueGroups.all;
    }
    console.log(`🔍 [Flyers] Filtered catalogues (${statusFilter}):`, result.length);
    return result;
  }, [statusFilter, catalogueGroups]);

  // Filter offers by category
  const filteredOffers = selectedCategory
    ? offers.filter(offer => offer.categoryId === selectedCategory)
    : offers;

  const handleOfferPress = (offer: Offer) => {
    router.push(`/offer/${offer.id}`);
  };

  const handleAddToBasket = (offer:  Offer) => {
    const store = stores.find(s => s.id === offer.storeId);
    dispatch(addToBasket({
      offer,
      storeName: store?.nameAr || '',
    }));
  };

  const handleToggleFavorite = (offerId: string) => {
    dispatch(toggleFavoriteOffer(offerId));
  };

  const handleCataloguePress = (catalogueId: string) => {
    console.log(`🖱️ [Flyers] Catalogue clicked: ${catalogueId}`);
    router.push(`/flyer/${catalogueId}`);
  };

  const getStatusBadgeStyle = (status: CatalogueStatus) => {
    switch (status) {
      case 'active':
        return { backgroundColor: colors. success };
      case 'upcoming':
        return { backgroundColor: colors.warning };
      case 'expired':
        return { backgroundColor: colors. gray[400] };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'upcoming':
        return 'قادم';
      case 'expired':
        return 'منتهي';
      default:
        return status;
    }
  };

  const renderStatusFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContainer}
    >
      {(['all', 'active', 'upcoming', 'expired'] as FilterType[]).map((filter) => {
        const count = filter === 'all'
          ? catalogueGroups.all.length
          : catalogueGroups[filter]. length;

        return (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              statusFilter === filter && styles.filterChipActive,
              filter === 'active' && statusFilter === filter && styles.filterChipActiveGreen,
            ]}
            onPress={() => {
              console.log(`🔘 [Flyers] Filter changed to:  ${filter}`);
              setStatusFilter(filter);
            }}
          >
            <Text
              style={[
                styles. filterChipText,
                statusFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter === 'all' ? 'الكل' : getStatusLabel(filter)} ({count})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryContainer}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          ! selectedCategory && styles.categoryChipActive,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text
          style={[
            styles. categoryChipText,
            ! selectedCategory && styles.categoryChipTextActive,
          ]}
        >
          {t('categories.all')}
        </Text>
      </TouchableOpacity>
      {categories.map(category => (
        <TouchableOpacity
          key={category. id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.categoryChipTextActive,
            ]}
          >
            {category.nameAr}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'catalogues' && styles.toggleButtonActive]}
        onPress={() => setViewMode('catalogues')}
      >
        <Ionicons
          name="book-outline"
          size={20}
          color={viewMode === 'catalogues' ? colors. white : colors.text}
        />
        <Text style={[styles.toggleText, viewMode === 'catalogues' && styles.toggleTextActive]}>
          كتالوجات
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'offers' && styles.toggleButtonActive]}
        onPress={() => setViewMode('offers')}
      >
        <Ionicons
          name="grid-outline"
          size={20}
          color={viewMode === 'offers' ? colors.white : colors.text}
        />
        <Text style={[styles.toggleText, viewMode === 'offers' && styles.toggleTextActive]}>
          عروض
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCatalogueCard = (catalogue: CatalogueWithStatus) => {
    return (
      <TouchableOpacity
        key={catalogue.id}
        style={styles.catalogueCard}
        onPress={() => handleCataloguePress(catalogue.id)}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, getStatusBadgeStyle(catalogue.status)]}>
          <Text style={styles.statusBadgeText}>
            {getStatusLabel(catalogue.status)}
          </Text>
        </View>

        {/* Store Info */}
        <View style={styles.catalogueHeader}>
          <View style={styles.storeInfo}>
            <Text style={styles. storeName}>
              {catalogue.storeName || catalogue.storeId}
            </Text>
            <Text style={styles. storeNameEn}>
              {catalogue.storeId. toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.dateText}>
            {formatDateRange(catalogue.startDate, catalogue.endDate)}
          </Text>
        </View>

        {/* Catalogue Title */}
        <Text style={styles.catalogueTitle}>{catalogue.titleAr}</Text>

        {/* View Button */}
        <View style={styles.viewButtonContainer}>
          <View style={[
            styles.viewButton,
            catalogue.status === 'expired' && styles.viewButtonExpired
          ]}>
            <Ionicons
              name="eye-outline"
              size={18}
              color={catalogue.status === 'expired' ?  colors.gray[500] : colors.primary}
            />
            <Text style={[
              styles.viewButtonText,
              catalogue.status === 'expired' && styles. viewButtonTextExpired
            ]}>
              عرض الكتالوج
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderViewToggle()}

      {viewMode === 'catalogues' && renderStatusFilter()}
      {viewMode === 'offers' && renderCategoryFilter()}

      {viewMode === 'catalogues' ?  (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {/* Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              📚 {catalogueGroups.all.length} كتالوج |
              ✅ {catalogueGroups. active.length} نشط |
              ⏳ {catalogueGroups.upcoming.length} قادم |
              ⌛ {catalogueGroups. expired.length} منتهي
            </Text>
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>
            {statusFilter === 'all' ? 'جميع الكتالوجات' :
             statusFilter === 'active' ?  'الكتالوجات النشطة' :
             statusFilter === 'upcoming' ? 'الكتالوجات القادمة' :
             'الكتالوجات المنتهية'}
          </Text>

          {/* Loading State */}
          {cataloguesLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>جاري تحميل الكتالوجات...</Text>
            </View>
          )}

          {/* Catalogues List */}
          {! cataloguesLoading && filteredCatalogues.length > 0 ? (
            filteredCatalogues.map(renderCatalogueCard)
          ) : !cataloguesLoading ?  (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyStateText}>
                لا توجد كتالوجات {statusFilter !== 'all' ? getStatusLabel(statusFilter) : ''}
              </Text>
            </View>
          ) : null}

          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredOffers}
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              onPress={() => handleOfferPress(item)}
              onAddToBasket={() => handleAddToBasket(item)}
              isFavorite={favoriteOfferIds.includes(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item. id)}
            />
          )}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.offerRow}
          contentContainerStyle={styles.offersContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  viewToggle: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' :  'row',
    margin: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  toggleButton: {
    flex: 1,
    flexDirection: I18nManager.isRTL ? 'row-reverse' :  'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText:  {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs :  0,
  },
  toggleTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical:  spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    marginRight: I18nManager.isRTL ? 0 : spacing.sm,
    marginLeft: I18nManager.isRTL ? spacing.sm : 0,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filterChipActive: {
    backgroundColor:  colors.primary,
    borderColor: colors.primary,
  },
  filterChipActiveGreen: {
    backgroundColor:  colors.success,
    borderColor: colors.success,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing. sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    marginRight: I18nManager.isRTL ? 0 : spacing.sm,
    marginLeft: I18nManager.isRTL ? spacing.sm : 0,
    borderWidth: 1,
    borderColor: colors. gray[200],
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography. fontSize.sm,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  summaryContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing. md,
  },
  summaryText: {
    fontSize:  typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize. xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
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
  catalogueCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical:  spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 1,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  catalogueHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' :  'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors. text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  storeNameEn:  {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' :  'left',
  },
  dateContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  catalogueTitle: {
    fontSize: typography.fontSize. md,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  viewButtonContainer: {
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent:  'center',
    backgroundColor: colors.primaryLight + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  viewButtonExpired: {
    backgroundColor:  colors.gray[100],
  },
  viewButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  viewButtonTextExpired: {
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize:  typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  offersContainer: {
    padding: spacing.md,
  },
  offerRow: {
    justifyContent: 'space-between',
  },
});