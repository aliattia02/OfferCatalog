import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { Button } from '../../components/common';
import { LeafletMap } from '../../components/stores';
import { OfferCard } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useLocalized } from '../../hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteStore } from '../../store/slices/favoritesSlice';
import { getOffersByStore, getCatalogueByStore } from '../../data/offers';
import type { Offer } from '../../types';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { getName, getAddress } = useLocalized();
  
  const stores = useAppSelector(state => state.stores.stores);
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);
  
  const store = stores.find(s => s.id === id);
  const storeOffers = store ? getOffersByStore(store.id) : [];
  const catalogue = store ? getCatalogueByStore(store.id) : undefined;
  const isFavorite = store ? favoriteStoreIds.includes(store.id) : false;

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>المتجر غير موجود</Text>
        <Button title="العودة" onPress={() => router.back()} />
      </View>
    );
  }

  const handleToggleFavorite = () => {
    dispatch(toggleFavoriteStore(store.id));
  };

  const handleAddToBasket = (offer: Offer) => {
    dispatch(addToBasket({
      offer,
      storeName: store.nameAr,
    }));
  };

  const handleOfferPress = (offer: Offer) => {
    router.push(`/offer/${offer.id}`);
  };

  const handleCataloguePress = () => {
    if (catalogue) {
      router.push(`/flyer/${catalogue.id}`);
    }
  };

  const handleGetDirections = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('خطأ', 'لا يمكن فتح الخرائط');
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('خطأ', 'لا يمكن إجراء المكالمة');
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: getName(store),
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
        {/* Store Header */}
        <View style={styles.header}>
          <Image source={{ uri: store.logo }} style={styles.storeLogo} resizeMode="contain" />
          <View style={styles.headerInfo}>
            <Text style={styles.storeName}>{getName(store)}</Text>
            <Text style={styles.branchCount}>{store.branches.length} فروع في الزقازيق</Text>
          </View>
        </View>

        {/* View Catalogue Button */}
        {catalogue && (
          <TouchableOpacity style={styles.catalogueButton} onPress={handleCataloguePress}>
            <Ionicons name="book-outline" size={24} color={colors.primary} />
            <View style={styles.catalogueButtonContent}>
              <Text style={styles.catalogueButtonTitle}>{t('stores.viewOffers')}</Text>
              <Text style={styles.catalogueButtonSubtitle}>
                {t('flyers.validUntil')}: {catalogue.endDate}
              </Text>
            </View>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
              size={24}
              color={colors.gray[400]}
            />
          </TouchableOpacity>
        )}

        {/* Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stores.branches')}</Text>
          <LeafletMap branches={store.branches} height={200} />
        </View>

        {/* Branches List */}
        <View style={styles.section}>
          {store.branches.map(branch => (
            <View key={branch.id} style={styles.branchCard}>
              <View style={styles.branchInfo}>
                <Text style={styles.branchAddress}>{getAddress(branch)}</Text>
                <View style={styles.branchDetails}>
                  <Ionicons name="time-outline" size={14} color={colors.success} />
                  <Text style={styles.branchHours}>{branch.openingHours}</Text>
                </View>
              </View>
              <View style={styles.branchActions}>
                {branch.phone && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCall(branch.phone!)}
                  >
                    <Ionicons name="call" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
                {branch.latitude && branch.longitude && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleGetDirections(branch.latitude!, branch.longitude!)}
                  >
                    <Ionicons name="navigate" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Store Offers */}
        {storeOffers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>عروض المتجر</Text>
            <View style={styles.offersGrid}>
              {storeOffers.slice(0, 4).map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onPress={() => handleOfferPress(offer)}
                  onAddToBasket={() => handleAddToBasket(offer)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  storeLogo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  headerInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  branchCount: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  catalogueButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  catalogueButtonContent: {
    flex: 1,
    marginLeft: I18nManager.isRTL ? 0 : spacing.md,
    marginRight: I18nManager.isRTL ? spacing.md : 0,
  },
  catalogueButtonTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  catalogueButtonSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  branchCard: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  branchInfo: {
    flex: 1,
  },
  branchAddress: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginBottom: spacing.xs,
  },
  branchDetails: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  branchHours: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  branchActions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: I18nManager.isRTL ? 0 : spacing.sm,
    marginRight: I18nManager.isRTL ? spacing.sm : 0,
  },
  offersGrid: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
