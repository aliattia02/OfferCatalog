import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { OfferCard, CatalogueCard } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addToBasket } from '../../store/slices/basketSlice';
import { toggleFavoriteOffer } from '../../store/slices/favoritesSlice';
import { offers, catalogues } from '../../data/offers';
import { categories } from '../../data/categories';
import type { Offer, Category } from '../../types';

export default function FlyersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'catalogues' | 'offers'>('catalogues');
  
  const stores = useAppSelector(state => state.stores.stores);
  const favoriteOfferIds = useAppSelector(state => state.favorites.offerIds);

  // Filter offers by category
  const filteredOffers = selectedCategory
    ? offers.filter(offer => offer.categoryId === selectedCategory)
    : offers;

  const handleOfferPress = (offer: Offer) => {
    router.push(`/offer/${offer.id}`);
  };

  const handleAddToBasket = (offer: Offer) => {
    const store = stores.find(s => s.id === offer.storeId);
    dispatch(addToBasket({
      offer,
      storeName: store?.nameAr || '',
    }));
  };

  const handleToggleFavorite = (offerId: string) => {
    dispatch(toggleFavoriteOffer(offerId));
  };

  const handleCataloguePress = (catalogueId: string) => {
    router.push(`/flyer/${catalogueId}`);
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryContainer}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          !selectedCategory && styles.categoryChipActive,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text
          style={[
            styles.categoryChipText,
            !selectedCategory && styles.categoryChipTextActive,
          ]}
        >
          {t('categories.all')}
        </Text>
      </TouchableOpacity>
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.categoryChipTextActive,
            ]}
          >
            {category.nameAr}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'catalogues' && styles.toggleButtonActive]}
        onPress={() => setViewMode('catalogues')}
      >
        <Ionicons
          name="book-outline"
          size={20}
          color={viewMode === 'catalogues' ? colors.white : colors.text}
        />
        <Text style={[styles.toggleText, viewMode === 'catalogues' && styles.toggleTextActive]}>
          كتالوجات
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'offers' && styles.toggleButtonActive]}
        onPress={() => setViewMode('offers')}
      >
        <Ionicons
          name="grid-outline"
          size={20}
          color={viewMode === 'offers' ? colors.white : colors.text}
        />
        <Text style={[styles.toggleText, viewMode === 'offers' && styles.toggleTextActive]}>
          عروض
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderViewToggle()}
      {viewMode === 'offers' && renderCategoryFilter()}
      
      {viewMode === 'catalogues' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>{t('flyers.activeCatalogues')}</Text>
          {catalogues.map(catalogue => {
            const store = stores.find(s => s.id === catalogue.storeId);
            if (!store) return null;
            return (
              <View key={catalogue.id} style={styles.catalogueWrapper}>
                <CatalogueCard
                  catalogue={catalogue}
                  store={store}
                  onPress={() => handleCataloguePress(catalogue.id)}
                />
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredOffers}
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              onPress={() => handleOfferPress(item)}
              onAddToBasket={() => handleAddToBasket(item)}
              isFavorite={favoriteOfferIds.includes(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
            />
          )}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.offerRow}
          contentContainerStyle={styles.offersContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  viewToggle: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    margin: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  toggleButton: {
    flex: 1,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  toggleTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    marginRight: I18nManager.isRTL ? 0 : spacing.sm,
    marginLeft: I18nManager.isRTL ? spacing.sm : 0,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  catalogueWrapper: {
    marginBottom: spacing.md,
  },
  offersContainer: {
    padding: spacing.md,
  },
  offerRow: {
    justifyContent: 'space-between',
  },
});
