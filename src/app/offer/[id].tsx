import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { Button } from '../../components/common';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useLocalized } from '../../hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteOffer } from '../../store/slices/favoritesSlice';
import { getOfferById } from '../../data/offers';
import { getCategoryById } from '../../data/categories';
import { formatCurrency, calculateDiscount, formatDate, getDaysRemaining } from '../../utils/helpers';

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { getName, getDescription, language } = useLocalized();
  
  const stores = useAppSelector(state => state.stores.stores);
  const favoriteOfferIds = useAppSelector(state => state.favorites.offerIds);
  
  const offer = getOfferById(id);
  const store = stores.find(s => s.id === offer?.storeId);
  const category = offer ? getCategoryById(offer.categoryId) : undefined;
  const isFavorite = offer ? favoriteOfferIds.includes(offer.id) : false;

  if (!offer || !store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>العرض غير موجود</Text>
        <Button title="العودة" onPress={() => router.back()} />
      </View>
    );
  }

  const discount = offer.originalPrice
    ? calculateDiscount(offer.originalPrice, offer.offerPrice)
    : 0;
  const daysRemaining = getDaysRemaining(offer.endDate);

  const handleToggleFavorite = () => {
    dispatch(toggleFavoriteOffer(offer.id));
  };

  const handleAddToBasket = () => {
    dispatch(addToBasket({
      offer,
      storeName: store.nameAr,
    }));
  };

  const handleViewStore = () => {
    router.push(`/store/${store.id}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: getName(offer),
          headerBackTitle: 'عودة',
          headerRight: () => (
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: offer.imageUrl }} style={styles.image} resizeMode="contain" />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% {t('common.off')}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{getName(offer)}</Text>
          
          {category && (
            <View style={styles.categoryTag}>
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={colors.primary}
              />
              <Text style={styles.categoryText}>{getName(category)}</Text>
            </View>
          )}
          
          {getDescription(offer) && (
            <Text style={styles.description}>{getDescription(offer)}</Text>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.label}>{t('common.offerPrice')}</Text>
              <Text style={styles.offerPrice}>{formatCurrency(offer.offerPrice)}</Text>
            </View>
            {offer.originalPrice && (
              <View style={styles.priceRow}>
                <Text style={styles.label}>{t('common.originalPrice')}</Text>
                <Text style={styles.originalPrice}>{formatCurrency(offer.originalPrice)}</Text>
              </View>
            )}
            {offer.unit && (
              <View style={styles.priceRow}>
                <Text style={styles.label}>الوحدة</Text>
                <Text style={styles.unitText}>{offer.unit}</Text>
              </View>
            )}
          </View>

          {/* Validity */}
          <View style={styles.validitySection}>
            <View style={styles.validityBadge}>
              <Ionicons name="time-outline" size={18} color={daysRemaining <= 2 ? colors.error : colors.success} />
              <Text
                style={[
                  styles.validityText,
                  daysRemaining <= 2 && styles.validityTextWarning,
                ]}
              >
                {daysRemaining > 0
                  ? `متبقي ${daysRemaining} أيام`
                  : 'انتهى العرض'}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {t('flyers.validUntil')}: {formatDate(offer.endDate, language)}
            </Text>
          </View>

          {/* Store Info */}
          <TouchableOpacity style={styles.storeCard} onPress={handleViewStore}>
            <Image source={{ uri: store.logo }} style={styles.storeLogo} resizeMode="contain" />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{getName(store)}</Text>
              <Text style={styles.storeAction}>{t('stores.viewOffers')}</Text>
            </View>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
              size={24}
              color={colors.gray[400]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add to Basket Button */}
      <View style={styles.footer}>
        <Button
          title={t('flyers.addToBasket')}
          onPress={handleAddToBasket}
          fullWidth
          size="large"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  headerButton: {
    padding: spacing.sm,
  },
  imageContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: I18nManager.isRTL ? undefined : spacing.lg,
    right: I18nManager.isRTL ? spacing.lg : undefined,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  discountText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: spacing.md,
  },
  productName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginBottom: spacing.sm,
  },
  categoryTag: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start',
    marginBottom: spacing.md,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  priceSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  priceRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  offerPrice: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  unitText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  validitySection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  validityBadge: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  validityText: {
    fontSize: typography.fontSize.md,
    color: colors.success,
    fontWeight: '600',
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  validityTextWarning: {
    color: colors.error,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  storeCard: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  storeAction: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});
