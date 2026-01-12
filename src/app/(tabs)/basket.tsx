// src/app/(tabs)/basket.tsx - WITH STORE FILTER & SMART SORTING
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { BasketItemCard, SavedPageCard } from '../../components/basket';
import { Button } from '../../components/common';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  removeFromBasket,
  updateBasketItemQuantity,
  clearBasket,
  removeExpiredItems
} from '../../store/slices/basketSlice';
import { toggleFavoriteSubcategory, toggleFavoriteStore } from '../../store/slices/favoritesSlice';
import { useSafeTabBarHeight } from '../../hooks';
import { formatCurrency } from '../../utils/helpers';
import { isDateExpired } from '../../utils/dateUtils';
import { getCatalogueById } from '../../data/catalogueRegistry';
import type { BasketItem } from '../../types';

type SortOption = 'default' | 'store' | 'expiry';

export default function BasketScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { paddingBottom } = useSafeTabBarHeight();

  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showFilters, setShowFilters] = useState(false);

  const basketItems = useAppSelector(state => state.basket.items);
  const favoriteSubcategoryIds = useAppSelector(state => state.favorites.subcategoryIds);
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);

  // Get unique stores from basket items
  const availableStores = useMemo(() => {
    const storeSet = new Set<string>();
    basketItems.forEach(item => {
      if (item.storeName) {
        storeSet.add(item.storeName);
      }
    });
    return Array.from(storeSet).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [basketItems]);

  // Separate and sort items
  const { activeItems, expiredItems, totalActive, stats } = useMemo(() => {
    let active: BasketItem[] = [];
    let expired: BasketItem[] = [];
    let total = 0;
    let activeOffersCount = 0;
    let activePagesCount = 0;

    // First, separate by expiry status
    basketItems.forEach(item => {
      const itemExpired = item.offerEndDate ? isDateExpired(item.offerEndDate) : false;

      if (itemExpired) {
        expired.push(item);
      } else {
        active.push(item);
        // Count by type
        if (item.type === 'offer') {
          activeOffersCount++;
          total += (item.offer?.offerPrice || 0) * item.quantity;
        } else if (item.type === 'page') {
          activePagesCount++;
        }
      }
    });

    // Filter by selected store
    if (selectedStore) {
      active = active.filter(item => item.storeName === selectedStore);
      expired = expired.filter(item => item.storeName === selectedStore);
    }

    // Sort active items
    switch (sortBy) {
      case 'store':
        active.sort((a, b) => {
          const storeCompare = (a.storeName || '').localeCompare(b.storeName || '', 'ar');
          if (storeCompare !== 0) return storeCompare;
          // Secondary sort by type (offers first)
          if (a.type === 'offer' && b.type !== 'offer') return -1;
          if (a.type !== 'offer' && b.type === 'offer') return 1;
          return 0;
        });
        break;

      case 'expiry':
        active.sort((a, b) => {
          const dateA = a.offerEndDate || '9999-12-31';
          const dateB = b.offerEndDate || '9999-12-31';
          const dateCompare = dateA.localeCompare(dateB);
          if (dateCompare !== 0) return dateCompare;
          // Secondary sort by type
          if (a.type === 'offer' && b.type !== 'offer') return -1;
          if (a.type !== 'offer' && b.type === 'offer') return 1;
          return 0;
        });
        break;

      case 'default':
      default:
        // Keep original order but ensure offers and pages are mixed
        // No additional sorting
        break;
    }

    // Sort expired items (always by store, then by type)
    expired.sort((a, b) => {
      const storeCompare = (a.storeName || '').localeCompare(b.storeName || '', 'ar');
      if (storeCompare !== 0) return storeCompare;
      if (a.type === 'offer' && b.type !== 'offer') return -1;
      if (a.type !== 'offer' && b.type === 'offer') return 1;
      return 0;
    });

    return {
      activeItems: active,
      expiredItems: expired,
      totalActive: total,
      stats: {
        activeOffers: activeOffersCount,
        activePages: activePagesCount,
        expired: expired.length,
      },
    };
  }, [basketItems, selectedStore, sortBy]);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      dispatch(updateBasketItemQuantity({ id: itemId, quantity }));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'حذف العنصر',
      'هل تريد حذف هذا العنصر من السلة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => dispatch(removeFromBasket(itemId)),
        },
      ]
    );
  };

  const handleClearBasket = () => {
    Alert.alert(
      'إفراغ السلة',
      'هل تريد حذف جميع العناصر من السلة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إفراغ',
          style: 'destructive',
          onPress: () => dispatch(clearBasket()),
        },
      ]
    );
  };

  const handleDeleteExpired = () => {
    Alert.alert(
      'حذف العروض المنتهية',
      `هل تريد حذف ${stats.expired} ${stats.expired === 1 ? 'عنصر منتهي' : 'عنصر منتهي'}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            dispatch(removeExpiredItems());
            Alert.alert('تم', 'تم حذف العناصر المنتهية بنجاح');
          },
        },
      ]
    );
  };

  const renderOfferItem = (item: BasketItem, isExpired: boolean = false) => {
    if (!item.offer) return null;

    const isFavorite = favoriteSubcategoryIds.includes(item.offer.categoryId);

    return (
      <BasketItemCard
        key={item.id}
        item={item}
        onUpdateQuantity={(quantity) => handleUpdateQuantity(item.id, quantity)}
        onRemove={() => handleRemoveItem(item.id)}
        onPress={() => router.push(`/offer/${item.offer!.id}`)}
        isExpired={isExpired}
        isFavorite={isFavorite}
        onToggleFavorite={() => dispatch(toggleFavoriteSubcategory(item.offer!.categoryId))}
      />
    );
  };

  const renderPageItem = (item: BasketItem, isExpired: boolean = false) => {
    if (!item.cataloguePage) return null;

    const catalogue = getCatalogueById(item.cataloguePage.catalogueId);
    const isFavorite = catalogue ? favoriteStoreIds.includes(catalogue.storeId) : false;

    return (
      <SavedPageCard
        key={item.id}
        item={item}
        onRemove={() => handleRemoveItem(item.id)}
        onViewPage={() => router.push(`/flyer/${item.cataloguePage!.catalogueId}?page=${item.cataloguePage!.pageNumber}`)}
        isFavorite={isFavorite}
        onToggleFavorite={() => {
          if (catalogue) {
            dispatch(toggleFavoriteStore(catalogue.storeId));
          }
        }}
      />
    );
  };

  const renderItem = (item: BasketItem, isExpired: boolean = false) => {
    if (item.type === 'offer') {
      return renderOfferItem(item, isExpired);
    } else if (item.type === 'page') {
      return renderPageItem(item, isExpired);
    }
    return null;
  };

  if (basketItems.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'السلة',
            headerShown: true,
          }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={80} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>السلة فارغة</Text>
          <Text style={styles.emptySubtitle}>
            ابدأ بإضافة العروض والصفحات المفضلة لديك
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/flyers')}
          >
            <Text style={styles.browseButtonText}>تصفح العروض</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'السلة',
          headerShown: true,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={styles.headerButton}
              >
                <Ionicons
                  name={showFilters ? "funnel" : "funnel-outline"}
                  size={22}
                  color={showFilters ? colors.primary : colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearBasket} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters Panel */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            {/* Store Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>تصفية حسب المتجر</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterChipsContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !selectedStore && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedStore(null)}
                >
                  <Text style={[
                    styles.filterChipText,
                    !selectedStore && styles.filterChipTextActive,
                  ]}>
                    الكل
                  </Text>
                </TouchableOpacity>
                {availableStores.map(store => (
                  <TouchableOpacity
                    key={store}
                    style={[
                      styles.filterChip,
                      selectedStore === store && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedStore(store === selectedStore ? null : store)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedStore === store && styles.filterChipTextActive,
                    ]}>
                      {store}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>ترتيب حسب</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'default' && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy('default')}
                >
                  <Ionicons
                    name="list-outline"
                    size={18}
                    color={sortBy === 'default' ? colors.white : colors.text}
                  />
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === 'default' && styles.sortButtonTextActive,
                  ]}>
                    الافتراضي
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'store' && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy('store')}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={18}
                    color={sortBy === 'store' ? colors.white : colors.text}
                  />
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === 'store' && styles.sortButtonTextActive,
                  ]}>
                    المتجر
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'expiry' && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy('expiry')}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={sortBy === 'expiry' ? colors.white : colors.text}
                  />
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === 'expiry' && styles.sortButtonTextActive,
                  ]}>
                    تاريخ الانتهاء
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Delete Expired Items Banner */}
        {stats.expired > 0 && (
          <TouchableOpacity
            style={styles.expiredBanner}
            onPress={handleDeleteExpired}
            activeOpacity={0.7}
          >
            <View style={styles.expiredBannerContent}>
              <Ionicons name="time-outline" size={24} color={colors.white} />
              <View style={styles.expiredBannerText}>
                <Text style={styles.expiredBannerTitle}>
                  {stats.expired} {stats.expired === 1 ? 'عنصر منتهي' : 'عنصر منتهي'}
                </Text>
                <Text style={styles.expiredBannerSubtitle}>
                  اضغط لحذف العناصر المنتهية
                </Text>
              </View>
            </View>
            <Ionicons name="trash" size={22} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="pricetag" size={20} color={colors.primary} />
              <Text style={styles.summaryLabel}>عروض نشطة</Text>
              <Text style={styles.summaryValue}>{stats.activeOffers}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="bookmark" size={20} color={colors.primary} />
              <Text style={styles.summaryLabel}>صفحات محفوظة</Text>
              <Text style={styles.summaryValue}>{stats.activePages}</Text>
            </View>
            {stats.expired > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Ionicons name="time" size={20} color={colors.error} />
                  <Text style={styles.summaryLabel}>منتهية</Text>
                  <Text style={[styles.summaryValue, styles.summaryValueExpired]}>
                    {stats.expired}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Active Items */}
        {activeItems.length > 0 && (
          <View style={styles.itemsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkbox-outline" size={20} color={colors.success} />
              <Text style={styles.sectionTitle}>
                العناصر النشطة ({activeItems.length})
              </Text>
            </View>
            {activeItems.map(item => renderItem(item, false))}
          </View>
        )}

        {/* Expired Items - Always at Bottom */}
        {expiredItems.length > 0 && (
          <View style={styles.itemsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.error} />
              <Text style={[styles.sectionTitle, styles.sectionTitleExpired]}>
                عناصر منتهية ({expiredItems.length})
              </Text>
            </View>
            {expiredItems.map(item => renderItem(item, true))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Total Footer - Only for Active Offers */}
      {stats.activeOffers > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>الإجمالي التقديري</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalActive)}</Text>
          </View>
          <Text style={styles.disclaimer}>
            * الأسعار قد تختلف في المتجر
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  headerButtons: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundSecondary,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  filtersPanel: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  filterChipsContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing.sm,
    marginLeft: I18nManager.isRTL ? spacing.sm : 0,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.sm,
  },
  sortButton: {
    flex: 1,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  expiredBanner: {
    backgroundColor: colors.error,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  expiredBannerContent: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  expiredBannerText: {
    marginLeft: I18nManager.isRTL ? 0 : spacing.md,
    marginRight: I18nManager.isRTL ? spacing.md : 0,
    flex: 1,
  },
  expiredBannerTitle: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  expiredBannerSubtitle: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    opacity: 0.9,
  },
  summaryCard: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryValueExpired: {
    color: colors.error,
  },
  itemsSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionTitleExpired: {
    color: colors.error,
  },
  bottomPadding: {
    height: spacing.xl,
  },
  footer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  disclaimer: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});