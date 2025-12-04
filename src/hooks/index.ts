import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { databaseService } from '../services/database';
import { hydrateBasket } from '../store/slices/basketSlice';
import { hydrateFavorites } from '../store/slices/favoritesSlice';
import { hydrateSettings } from '../store/slices/settingsSlice';
import { setStores } from '../store/slices/storesSlice';
import { setOffers, setCatalogues } from '../store/slices/offersSlice';
import { stores as mockStores } from '../data/stores';
import { offers as mockOffers, catalogues as mockCatalogues } from '../data/offers';
import type { BasketState, FavoritesState, SettingsState } from '../types';

// Hook for app initialization
export const useAppInitialization = () => {
  const [isReady, setIsReady] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load persisted data from AsyncStorage
        const [basket, favorites, settings] = await Promise.all([
          databaseService.getBasket(),
          databaseService.getFavorites(),
          databaseService.getSettings(),
        ]);

        // Hydrate Redux store with persisted data
        if (basket) {
          dispatch(hydrateBasket(basket));
        }
        if (favorites) {
          dispatch(hydrateFavorites(favorites));
        }
        if (settings) {
          dispatch(hydrateSettings(settings));
        }

        // Load mock data for MVP
        dispatch(setStores(mockStores));
        dispatch(setOffers(mockOffers));
        dispatch(setCatalogues(mockCatalogues));

        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true); // Still mark as ready to show app
      }
    };

    initializeApp();
  }, [dispatch]);

  return isReady;
};

// Hook for persisting basket changes
export const usePersistBasket = () => {
  const basket = useAppSelector(state => state.basket);

  useEffect(() => {
    const persistBasket = async () => {
      await databaseService.saveBasket(basket);
    };
    persistBasket();
  }, [basket]);
};

// Hook for persisting favorites changes
export const usePersistFavorites = () => {
  const favorites = useAppSelector(state => state.favorites);

  useEffect(() => {
    const persistFavorites = async () => {
      await databaseService.saveFavorites(favorites);
    };
    persistFavorites();
  }, [favorites]);
};

// Hook for persisting settings changes
export const usePersistSettings = () => {
  const settings = useAppSelector(state => state.settings);

  useEffect(() => {
    const persistSettings = async () => {
      await databaseService.saveSettings(settings);
    };
    persistSettings();
  }, [settings]);
};

// Hook for getting localized content
export const useLocalized = () => {
  const { i18n } = useTranslation();
  const language = (i18n.language || 'ar') as 'ar' | 'en';
  const isRTL = language === 'ar';

  const getName = useCallback(
    (item: { nameAr: string; nameEn: string }): string => {
      return language === 'ar' ? item.nameAr : item.nameEn;
    },
    [language]
  );

  const getAddress = useCallback(
    (item: { addressAr: string; addressEn: string }): string => {
      return language === 'ar' ? item.addressAr : item.addressEn;
    },
    [language]
  );

  const getDescription = useCallback(
    (item: { descriptionAr?: string; descriptionEn?: string }): string | undefined => {
      return language === 'ar' ? item.descriptionAr : item.descriptionEn;
    },
    [language]
  );

  const getTitle = useCallback(
    (item: { titleAr: string; titleEn: string }): string => {
      return language === 'ar' ? item.titleAr : item.titleEn;
    },
    [language]
  );

  return {
    language,
    isRTL,
    getName,
    getAddress,
    getDescription,
    getTitle,
  };
};

// Re-export store hooks
export { useAppSelector, useAppDispatch } from '../store/hooks';
