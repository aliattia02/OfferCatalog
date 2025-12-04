import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  I18nManager,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Button } from '../../components/common';
import { OfferCard } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useLocalized } from '../../hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { getCatalogueById, getOfferById } from '../../data/offers';
import type { Offer } from '../../types';

const { width } = Dimensions.get('window');

export default function FlyerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { getTitle, getName } = useLocalized();
  
  const [currentPage, setCurrentPage] = useState(0);
  
  const catalogue = getCatalogueById(id);
  const stores = useAppSelector(state => state.stores.stores);
  const store = stores.find(s => s.id === catalogue?.storeId);

  if (!catalogue || !store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>الكتالوج غير موجود</Text>
        <Button title="العودة" onPress={() => router.back()} />
      </View>
    );
  }

  const currentPageData = catalogue.pages[currentPage];
  const pageOffers = currentPageData?.offers.map(offerId => getOfferById(offerId)).filter(Boolean) as Offer[];

  const handleAddToBasket = (offer: Offer) => {
    dispatch(addToBasket({
      offer,
      storeName: store.nameAr,
    }));
  };

  const handleOfferPress = (offer: Offer) => {
    router.push(`/offer/${offer.id}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: getTitle(catalogue),
          headerBackTitle: 'عودة',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Store Header */}
        <View style={styles.header}>
          <Image source={{ uri: store.logo }} style={styles.storeLogo} resizeMode="contain" />
          <View style={styles.headerInfo}>
            <Text style={styles.catalogueTitle}>{getTitle(catalogue)}</Text>
            <Text style={styles.validDate}>
              {t('flyers.validUntil')}: {catalogue.endDate}
            </Text>
          </View>
        </View>

        {/* Flyer Page Viewer */}
        <View style={styles.pageContainer}>
          <Image
            source={{ uri: currentPageData?.imageUrl }}
            style={styles.pageImage}
            resizeMode="contain"
          />
          
          {/* Page Navigation */}
          <View style={styles.pageNavigation}>
            <TouchableOpacity
              style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
              onPress={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
                size={24}
                color={currentPage === 0 ? colors.gray[400] : colors.white}
              />
            </TouchableOpacity>
            
            <Text style={styles.pageIndicator}>
              {currentPage + 1} / {catalogue.pages.length}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.navButton,
                currentPage === catalogue.pages.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={() => setCurrentPage(p => Math.min(catalogue.pages.length - 1, p + 1))}
              disabled={currentPage === catalogue.pages.length - 1}
            >
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={24}
                color={currentPage === catalogue.pages.length - 1 ? colors.gray[400] : colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Offers on Current Page */}
        {pageOffers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.sectionTitle}>عروض هذه الصفحة</Text>
            <View style={styles.offersGrid}>
              {pageOffers.map(offer => (
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
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  headerInfo: {
    flex: 1,
  },
  catalogueTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  validDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  pageContainer: {
    backgroundColor: colors.gray[900],
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  pageImage: {
    width: '100%',
    height: 400,
    backgroundColor: colors.gray[200],
  },
  pageNavigation: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors.gray[600],
  },
  pageIndicator: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  offersSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
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
