// src/app/(tabs)/basket.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Button, EmptyState } from '../../components/common';
import { BasketItemCard, SavedPageCard, SavedPdfPageCard } from '../../components/basket';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateQuantity, removeFromBasket, clearBasket } from '../../store/slices/basketSlice';
import { formatCurrency } from '../../utils/helpers';
import { useSafeTabBarHeight } from '../../hooks';

export default function BasketScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { paddingBottom } = useSafeTabBarHeight();

  const { items, total } = useAppSelector(state => state.basket);

  // Separate items by type
  const savedPages = items.filter(item => item.type === 'page' || item.type === 'pdf-page');
  const offerItems = items.filter(item => item.type === 'offer');

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    console.log(`🔄 [BasketScreen] Update quantity: ${itemId} -> ${quantity}`);
    dispatch(updateQuantity({ itemId, quantity }));
  };

  const handleRemoveItem = (itemId: string, itemType: 'offer' | 'page' | 'pdf-page') => {
    const message = (itemType === 'page' || itemType === 'pdf-page')
      ? 'هل تريد حذف هذه الصفحة المحفوظة من السلة؟'
      : 'هل تريد حذف هذا العنصر من السلة؟';

    console.log(`🗑️ [BasketScreen] Remove item requested: ${itemId}`);

    Alert.alert(
      t('common.confirm'),
      message,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => console.log('❌ [BasketScreen] Remove cancelled')
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            console.log(`✅ [BasketScreen] Confirmed removal of ${itemId}`);
            dispatch(removeFromBasket(itemId));
          },
        },
      ]
    );
  };

  const handleClearBasket = () => {
    console.log('🗑️ [BasketScreen] Clear basket requested');

    Alert.alert(
      t('basket.clearBasket'),
      'هل تريد تفريغ السلة بالكامل؟',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => console.log('❌ [BasketScreen] Clear cancelled')
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            console.log('✅ [BasketScreen] Confirmed clear basket');
            dispatch(clearBasket());
          },
        },
      ]
    );
  };

  const handleShareList = () => {
    Alert.alert('قريباً', 'ميزة المشاركة قيد التطوير');
  };

  const handleViewPage = (catalogueId: string) => {
    router.push(`/flyer/${catalogueId}`);
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="cart-outline" size={64} color={colors.gray[400]} />}
          title={t('basket.empty')}
          description={t('basket.emptyDescription')}
        />
      </View>
    );
  }

  const itemCount = offerItems.reduce((sum, item) => sum + item.quantity, 0);

  const renderItem = ({ item }: { item: typeof items[0] }) => {
    if (item.type === 'page') {
      return (
        <SavedPageCard
          item={item}
          onRemove={() => {
            console.log(`🗑️ [BasketScreen] Remove page card: ${item.id}`);
            handleRemoveItem(item.id, 'page');
          }}
          onViewPage={() => handleViewPage(item.cataloguePage!.catalogueId)}
        />
      );
    }

    if (item.type === 'pdf-page') {
      return (
        <SavedPdfPageCard
          item={item}
          onRemove={() => {
            console.log(`🗑️ [BasketScreen] Remove PDF page card: ${item.id}`);
            handleRemoveItem(item.id, 'pdf-page');
          }}
          onViewPage={() => handleViewPage(item.pdfPage!.catalogueId)}
        />
      );
    }

    return (
      <BasketItemCard
        item={item}
        onUpdateQuantity={(quantity) => handleUpdateQuantity(item.id, quantity)}
        onRemove={() => {
          console.log(`🗑️ [BasketScreen] Remove offer card: ${item.id}`);
          handleRemoveItem(item.id, 'offer');
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShareList}>
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={styles.actionText}>{t('basket.shareList')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleClearBasket}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>
            {t('basket.clearBasket')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {(savedPages.length > 0 || offerItems.length > 0) && (
        <View style={styles.statsContainer}>
          {savedPages.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="bookmark" size={18} color={colors.primary} />
              <Text style={styles.statText}>
                {savedPages.length} {savedPages.length === 1 ? 'صفحة' : 'صفحات'} محفوظة
              </Text>
            </View>
          )}
          {offerItems.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="pricetag" size={18} color={colors.success} />
              <Text style={styles.statText}>
                {itemCount} {itemCount === 1 ? 'منتج' : 'منتجات'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Items List with Dynamic Padding */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom } // Dynamic padding based on tab bar height
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer with Total (only show if there are offer items) */}
      {offerItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.itemCount}>
              {itemCount} {itemCount === 1 ? t('basket.item') : t('basket.items')}
            </Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('basket.total')}</Text>
              <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
            </View>
          </View>
          <Button
            title={t('basket.storeComparison')}
            onPress={() => Alert.alert('قريباً', 'ميزة مقارنة المتاجر قيد التطوير')}
            variant="outline"
            fullWidth
            style={styles.compareButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  headerActions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  actionButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  statsContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing.md,
  },
  footer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  totalContainer: {
    marginBottom: spacing.md,
  },
  itemCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  totalRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: typography.fontSize.xxl,
    color: colors.primary,
    fontWeight: 'bold',
  },
  compareButton: {
    marginTop: spacing.sm,
  },
});