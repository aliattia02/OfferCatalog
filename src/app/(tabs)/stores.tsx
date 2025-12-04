import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { StoreCard, LeafletMap } from '../../components/stores';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleFavoriteStore } from '../../store/slices/favoritesSlice';
import { getAllBranches } from '../../data/stores';

export default function StoresScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const stores = useAppSelector(state => state.stores.stores);
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);
  
  const allBranches = getAllBranches();

  const handleStorePress = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  const handleToggleFavorite = (storeId: string) => {
    dispatch(toggleFavoriteStore(storeId));
  };

  const handleGetDirections = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('خطأ', 'لا يمكن فتح الخرائط');
    });
  };

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
        onPress={() => setViewMode('list')}
      >
        <Ionicons
          name="list"
          size={20}
          color={viewMode === 'list' ? colors.white : colors.text}
        />
        <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
          {t('stores.listView')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
        onPress={() => setViewMode('map')}
      >
        <Ionicons
          name="map"
          size={20}
          color={viewMode === 'map' ? colors.white : colors.text}
        />
        <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
          {t('stores.mapView')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderViewToggle()}
      
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <LeafletMap branches={allBranches} height={400} />
          <ScrollView style={styles.branchList}>
            {allBranches.map(branch => {
              const store = stores.find(s => s.id === branch.storeId);
              return (
                <TouchableOpacity
                  key={branch.id}
                  style={styles.branchCard}
                  onPress={() => {
                    if (branch.latitude && branch.longitude) {
                      handleGetDirections(branch.latitude, branch.longitude);
                    }
                  }}
                >
                  <View style={styles.branchInfo}>
                    <Text style={styles.branchStoreName}>{store?.nameAr || ''}</Text>
                    <Text style={styles.branchAddress}>{branch.addressAr}</Text>
                    <Text style={styles.branchHours}>{branch.openingHours}</Text>
                  </View>
                  <Ionicons name="navigate" size={24} color={colors.primary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>{t('stores.nearYou')}</Text>
          {stores.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              onPress={() => handleStorePress(store.id)}
              isFavorite={favoriteStoreIds.includes(store.id)}
              onToggleFavorite={() => handleToggleFavorite(store.id)}
            />
          ))}
        </ScrollView>
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
  mapContainer: {
    flex: 1,
  },
  branchList: {
    flex: 1,
    padding: spacing.md,
  },
  branchCard: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  branchInfo: {
    flex: 1,
  },
  branchStoreName: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  branchAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  branchHours: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});
