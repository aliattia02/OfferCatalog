import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useLocalized } from '../../hooks';
import type { BasketItem } from '../../types';

interface BasketItemCardProps {
  item: BasketItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export const BasketItemCard: React.FC<BasketItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const { getName, language } = useLocalized();

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.offer.imageUrl }} style={styles.image} resizeMode="cover" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>{getName(item.offer)}</Text>
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.storeName}>{item.storeName}</Text>
        
        <View style={styles.expiryContainer}>
          <Ionicons name="time-outline" size={14} color={colors.warning} />
          <Text style={styles.expiryText}>
            ينتهي {formatDate(item.offerEndDate, language)}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(item.offer.offerPrice * item.quantity)}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(item.quantity - 1)}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={styles.quantity}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(item.quantity + 1)}
            >
              <Ionicons name="add" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginRight: I18nManager.isRTL ? 0 : spacing.sm,
    marginLeft: I18nManager.isRTL ? spacing.sm : 0,
  },
  removeButton: {
    padding: spacing.xs,
  },
  storeName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginBottom: spacing.xs,
  },
  expiryContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  expiryText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  footer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  quantityContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xs,
  },
  quantityButton: {
    padding: spacing.sm,
  },
  quantity: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
});

export default BasketItemCard;
