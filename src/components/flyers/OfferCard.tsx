// src/components/flyers/OfferCard.tsx - UPDATED for subcategory favorites
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatCurrency, calculateDiscount } from '../../utils/helpers';
import { useLocalized } from '../../hooks';
import type { Offer } from '../../types';

interface OfferCardProps {
  offer: Offer;
  onPress: () => void;
  onAddToBasket: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onPress,
  onAddToBasket,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { getName, getDescription } = useLocalized();
  const discount = offer.originalPrice
    ? calculateDiscount(offer.originalPrice, offer.offerPrice)
    : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: offer.imageUrl }} style={styles.image} resizeMode="cover" />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}%</Text>
          </View>
        )}
        {/* 
          UPDATED: Now toggles the subcategory (categoryId) instead of individual offer
          When clicked, it favorites/unfavorites the entire subcategory
        */}
        {onToggleFavorite && (
          <TouchableOpacity style={styles.favoriteButton} onPress={onToggleFavorite}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? colors.primary : colors.white}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {getName(offer)}
        </Text>
        
        {getDescription(offer) && (
          <Text style={styles.description} numberOfLines={1}>
            {getDescription(offer)}
          </Text>
        )}
        
        <View style={styles.priceContainer}>
          <Text style={styles.offerPrice}>{formatCurrency(offer.offerPrice)}</Text>
          {offer.originalPrice && (
            <Text style={styles.originalPrice}>{formatCurrency(offer.originalPrice)}</Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={onAddToBasket}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>أضف للسلة</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
    marginBottom: spacing.md,
    width: '48%',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[100],
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: I18nManager.isRTL ? undefined : spacing.sm,
    right: I18nManager.isRTL ? spacing.sm : undefined,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: I18nManager.isRTL ? undefined : spacing.sm,
    left: I18nManager.isRTL ? spacing.sm : undefined,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  content: {
    padding: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  priceContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  offerPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: I18nManager.isRTL ? 0 : spacing.sm,
    marginLeft: I18nManager.isRTL ? spacing.sm : 0,
  },
  originalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  addButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  addButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
});

export default OfferCard;