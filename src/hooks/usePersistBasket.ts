// src/hooks/usePersistBasket.ts - FIXED: Debounced saves to prevent memory leak
import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { hydrateBasket, removeExpiredItems } from '../store/slices/basketSlice';
import { databaseService } from '../services/database';
import { imageCacheService } from '../services/imageCacheService';

/**
 * Hook to persist basket state and prefetch basket images
 * ✅ Debounced saves to prevent memory leaks
 * ✅ Only caches images for items actually in basket
 */
export const usePersistBasket = () => {
  const dispatch = useAppDispatch();
  const basket = useAppSelector(state => state.basket);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHydratedRef = useRef(false);

  // ✅ Load basket on mount (ONCE)
  useEffect(() => {
    const loadBasket = async () => {
      if (isHydratedRef.current) return; // Prevent multiple hydrations

      try {
        const savedBasket = await databaseService.getBasket();
        if (savedBasket) {
          dispatch(hydrateBasket(savedBasket));

          // Remove expired items after hydration
          dispatch(removeExpiredItems());

          console.log('💧 Basket hydrated from storage');
        }
        isHydratedRef.current = true;
      } catch (error) {
        console.error('❌ Error loading basket:', error);
      }
    };

    loadBasket();
  }, [dispatch]); // Only run once on mount

  // ✅ Save basket with debouncing (prevent rapid saves)
  useEffect(() => {
    // Skip if not yet hydrated (prevents saving initial empty state)
    if (!isHydratedRef.current) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce saves (wait 500ms after last change)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await databaseService.saveBasket(basket);
        console.log(`💾 Basket saved (${basket.items.length} items)`);
      } catch (error) {
        console.error('❌ Error saving basket:', error);
      }
    }, 500); // 500ms debounce

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [basket.items.length, basket.total]); // Only trigger on meaningful changes

  // ✅ Prefetch basket item images with HIGH priority (debounced)
  useEffect(() => {
    // Skip if not yet hydrated
    if (!isHydratedRef.current) return;
    if (basket.items.length === 0) return;

    const prefetchTimer = setTimeout(async () => {
      const imageUrls: string[] = [];

      for (const item of basket.items) {
        if (item.type === 'offer' && item.offer?.imageUrl) {
          imageUrls.push(item.offer.imageUrl);
        }
        // For pages, cache the page image if available
        if (item.type === 'page' && item.cataloguePage?.imageUrl) {
          imageUrls.push(item.cataloguePage.imageUrl);
        }
      }

      if (imageUrls.length > 0) {
        try {
          console.log(`🔥 Prefetching ${imageUrls.length} basket images...`);
          await imageCacheService.prefetchBasketImages(imageUrls);
        } catch (error) {
          console.error('❌ Error prefetching basket images:', error);
        }
      }
    }, 1000); // Delay image prefetching by 1 second

    return () => clearTimeout(prefetchTimer);
  }, [basket.items.length]); // Only trigger when item count changes
};