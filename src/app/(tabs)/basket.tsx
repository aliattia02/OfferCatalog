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
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Button, EmptyState } from '../../components/common';
import { BasketItemCard } from '../../components/basket';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateQuantity, removeFromBasket, clearBasket } from '../../store/slices/basketSlice';
import { formatCurrency } from '../../utils/helpers';

export default function BasketScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const { items, total } = useAppSelector(state => state.basket);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    dispatch(updateQuantity({ itemId, quantity }));
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      t('common.confirm'),
      'هل تريد حذف هذا العنصر من السلة؟',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => dispatch(removeFromBasket(itemId)),
        },
      ]
    );
  };

  const handleClearBasket = () => {
    Alert.alert(
      t('basket.clearBasket'),
      'هل تريد تفريغ السلة بالكامل؟',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => dispatch(clearBasket()),
        },
      ]
    );
  };

  const handleShareList = () => {
    // Placeholder for share functionality
    Alert.alert('قريباً', 'ميزة المشاركة قيد التطوير');
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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShareList}>
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={styles.actionText}>{t('basket.shareList')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleClearBasket}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>
            {t('basket.clearBasket')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <BasketItemCard
            item={item}
            onUpdateQuantity={(quantity) => handleUpdateQuantity(item.id, quantity)}
            onRemove={() => handleRemoveItem(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer with Total */}
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
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
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
