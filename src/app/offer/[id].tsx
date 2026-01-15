// src/app/offer/[id].tsx - UPDATED WITH TRANSLATIONS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { Button } from '../../components/common';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useLocalized } from '../../hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteSubcategory } from '../../store/slices/favoritesSlice';
import { getOfferById } from '../../services/offerService';
import type { OfferWithCatalogue } from '../../services/offerService';
import { getCategoryById } from '../../data/categories';
import { formatCurrency, calculateDiscount, formatDate, getDaysRemaining } from '../../utils/helpers';

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { getName, getDescription, language } = useLocalized();

  const [offer, setOffer] = useState<OfferWithCatalogue | null>(null);
  const [loading, setLoading] = useState(true);

  const stores = useAppSelector(state => state.stores.stores);
  const favoriteSubcategoryIds = useAppSelector(state => state.favorites.subcategoryIds);

  const isFavorite = offer ? favoriteSubcategoryIds.includes(offer.categoryId) : false;

  useEffect(() => {
    const loadOffer = async () => {
      try {
        setLoading(true);
        console.log('🔥 Loading offer:', id);
        const offerData = await getOfferById(id);
        setOffer(offerData);
        console.log('✅ Offer loaded:', offerData);
      } catch (error) {
        console.error('❌ Error loading offer:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOffer();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="pricetag-outline" size={64} color={colors.gray[300]} />
        <Text style={styles.errorText}>{t('offerDetails.notFound')}</Text>
        <Text style={styles.errorSubtext}>ID: {id}</Text>
        <Button title={t('common.back')} onPress={() => router.back()} />
      </View>
    );
  }

  const store = stores.find(s => s.id === offer.storeId) || {
    id: offer.storeId,
    nameAr: offer.storeName,
    nameEn: offer.storeName,
    logo: `https://placehold.co/100x100/e63946/ffffff?text=${offer.storeId}`,
    branches: [],
  };

  const category = offer.categoryId ? getCategoryById(offer.categoryId) : undefined;
  const discount = offer.originalPrice
    ? calculateDiscount(offer.originalPrice, offer.offerPrice)
    : 0;
  const daysRemaining = getDaysRemaining(offer.catalogueEndDate);

  const handleToggleFavorite = () => {
    dispatch(toggleFavoriteSubcategory(offer.categoryId));
  };

  const handleAddToBasket = () => {
    const serializableOffer = {
      id: offer.id,
      storeId: offer.storeId,
      catalogueId: offer.catalogueId,
      categoryId: offer.categoryId,
      nameAr: offer.nameAr,
      nameEn: offer.nameEn,
      descriptionAr: offer.descriptionAr,
      descriptionEn: offer.descriptionEn,
      imageUrl: offer.imageUrl,
      offerPrice: offer.offerPrice,
      originalPrice: offer.originalPrice,
      unit: offer.unit,
      pageNumber: offer.pageNumber,
      isActive: offer.isActive,
      catalogueStartDate: offer.catalogueStartDate,
      catalogueEndDate: offer.catalogueEndDate,
      startDate: offer.startDate,
      endDate: offer.endDate,
    };

    dispatch(addToBasket({
      offer: serializableOffer,
      storeName: offer.storeName,
    }));
  };

  const handleViewStore = () => {
    router.push(`/store/${store.id}`);
  };

  const handleViewCatalogue = () => {
    router.push(`/flyer/${offer.catalogueId}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: offer.nameAr || getName(offer),
          headerBackTitle: t('common.back'),
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
          {!offer.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>{t('status.expired')}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{offer.nameAr}</Text>

          {/* Category with favorite indicator */}
          {category && (
            <TouchableOpacity
              style={styles.categoryTag}
              onPress={handleToggleFavorite}
              activeOpacity={0.7}
            >
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={colors.primary}
              />
              <Text style={styles.categoryText}>{category.nameAr}</Text>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={14}
                color={isFavorite ? colors.primary : colors.gray[400]}
                style={styles.categoryHeartIcon}
              />
            </TouchableOpacity>
          )}

          {offer.descriptionAr && (
            <Text style={styles.description}>{offer.descriptionAr}</Text>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.label}>{t('offerDetails.offerPrice')}</Text>
              <Text style={styles.offerPrice}>{formatCurrency(offer.offerPrice)}</Text>
            </View>
            {offer.originalPrice && (
              <View style={styles.priceRow}>
                <Text style={styles.label}>{t('offerDetails.originalPrice')}</Text>
                <Text style={styles.originalPrice}>{formatCurrency(offer.originalPrice)}</Text>
              </View>
            )}
            {offer.unit && (
              <View style={styles.priceRow}>
                <Text style={styles.label}>{t('offerDetails.unit')}</Text>
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
                  ? `${t('offerDetails.daysRemaining')} ${daysRemaining} ${t('basket.days')}`
                  : t('status.expired')}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {t('offerDetails.validUntil')}: {formatDate(offer.catalogueEndDate, language)}
            </Text>
          </View>

          {/* Catalogue Info */}
          <TouchableOpacity style={styles.catalogueCard} onPress={handleViewCatalogue}>
            <View style={styles.catalogueInfo}>
              <View style={styles.catalogueHeader}>
                <Ionicons name="book-outline" size={20} color={colors.primary} />
                <Text style={styles.catalogueLabel}>{t('offerDetails.catalogue')}</Text>
              </View>
              <Text style={styles.catalogueTitle}>{offer.catalogueTitle}</Text>
              {offer.pageNumber && (
                <Text style={styles.pageNumber}>{t('common.page')} {offer.pageNumber}</Text>
              )}
            </View>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
              size={24}
              color={colors.gray[400]}
            />
          </TouchableOpacity>

          {/* Store Info */}
          <TouchableOpacity style={styles.storeCard} onPress={handleViewStore}>
            <Image source={{ uri: store.logo }} style={styles.storeLogo} resizeMode="contain" />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{offer.storeName}</Text>
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
          title={t('common.addToBasket')}
          onPress={handleAddToBasket}
          fullWidth
          size="large"
          disabled={!offer.isActive}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
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
  inactiveBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: I18nManager.isRTL ? undefined : spacing.lg,
    left: I18nManager.isRTL ? spacing.lg : undefined,
    backgroundColor: colors.gray[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  inactiveBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
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
  categoryHeartIcon: {
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
  catalogueCard: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  catalogueInfo: {
    flex: 1,
  },
  catalogueHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  catalogueLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  catalogueTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginBottom: spacing.xs,
  },
  pageNumber: {
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