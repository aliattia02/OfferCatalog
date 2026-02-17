// src/store/middleware/syncMiddleware.ts - FIXED: Always uses fresh state
import { Middleware } from '@reduxjs/toolkit';
import { syncBasketToFirestore, syncFavoritesToFirestore } from '../../services/userDataService';
import type { RootState } from '../index';

// Debounce helper
let syncTimeout: NodeJS.Timeout | null = null;

/**
 * Middleware to automatically sync basket and favorites to Firestore
 * ✅ FIXED: Always gets fresh state from store at sync time
 */
export const syncMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  // Only sync if action affects basket or favorites (but not hydrate actions)
  const shouldSync =
    (action.type.startsWith('basket/') && action.type !== 'basket/hydrateBasket' && action.type !== 'basket/clearBasket') ||
    (action.type.startsWith('favorites/') && action.type !== 'favorites/hydrateFavorites' && action.type !== 'favorites/clearFavorites');

  if (shouldSync) {
    // ✅ Get current auth state to check if we should sync
    const currentState = store.getState();
    const { user, isAuthenticated } = currentState.auth;

    // Only sync if user is authenticated
    if (isAuthenticated && user) {
      // Debounce sync to avoid too many writes
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }

      syncTimeout = setTimeout(async () => {
        try {
          // ✅ CRITICAL FIX: Get FRESH state at sync time, not from closure
          const freshState = store.getState();
          const freshUser = freshState.auth.user;

          // Double-check user is still authenticated
          if (!freshUser || !freshState.auth.isAuthenticated) {
            console.log('⚠️ [Sync] User no longer authenticated, skipping sync');
            return;
          }

          console.log('💾 [Sync] Auto-syncing data to Firestore...');
          console.log(`📊 [Sync] Fresh data: ${freshState.basket.items.length} basket items, ${freshState.favorites.subcategoryIds.length} favorites`);

          const promises = [];

          // Sync basket if basket action
          if (action.type.startsWith('basket/')) {
            // ✅ Use fresh basket state
            promises.push(
              syncBasketToFirestore(freshUser.uid, freshState.basket.items)
                .then(() => console.log(`✅ [Sync] Basket synced (${freshState.basket.items.length} items)`))
                .catch((err) => console.error('❌ [Sync] Basket sync failed:', err))
            );
          }

          // Sync favorites if favorites action
          if (action.type.startsWith('favorites/')) {
            // ✅ Use fresh favorites state
            promises.push(
              syncFavoritesToFirestore(freshUser.uid, freshState.favorites)
                .then(() => console.log('✅ [Sync] Favorites synced'))
                .catch((err) => console.error('❌ [Sync] Favorites sync failed:', err))
            );
          }

          await Promise.all(promises);
        } catch (error) {
          console.error('❌ [Sync] Error during auto-sync:', error);
        }
      }, 1000); // Wait 1 second before syncing
    }
  }

  return result;
};