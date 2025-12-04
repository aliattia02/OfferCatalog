import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatCurrency, calculateDiscount } from '../../utils/helpers';
import { useLocalized } from '../../hooks';
import type { Offer } from '../../types';

interface FeaturedOffersProps {
  offers: Offer[];
  onOfferPress: (offer: Offer) => void;
  onAddToBasket: (offer: Offer) => void;
}

export const FeaturedOffers: React.FC<FeaturedOffersProps> = ({
  offers,
  onOfferPress,
  onAddToBasket,
}) => {
  const { getName } = useLocalized();

  const renderItem = ({ item }: { item: Offer }) => {
    const discount = item.originalPrice
      ? calculateDiscount(item.originalPrice, item.offerPrice)
      : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onOfferPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>{getName(item)}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.offerPrice}>{formatCurrency(item.offerPrice)}</Text>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>{formatCurrency(item.originalPrice)}</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddToBasket(item)}
          >
            <Ionicons name="add" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={offers}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      inverted={I18nManager.isRTL}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.md,
  },
  card: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  imageContainer: {
    position: 'relative',
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[100],
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: I18nManager.isRTL ? undefined : spacing.xs,
    right: I18nManager.isRTL ? spacing.xs : undefined,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    height: 36,
  },
  priceContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  offerPrice: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: I18nManager.isRTL ? 0 : spacing.xs,
    marginLeft: I18nManager.isRTL ? spacing.xs : 0,
  },
  originalPrice: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: I18nManager.isRTL ? undefined : spacing.sm,
    left: I18nManager.isRTL ? spacing.sm : undefined,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FeaturedOffers;
