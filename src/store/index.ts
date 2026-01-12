// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import basketReducer from './slices/basketSlice';
import favoritesReducer from './slices/favoritesSlice';
import offersReducer from './slices/offersSlice';
import storesReducer from './slices/storesSlice';
import settingsReducer from './slices/settingsSlice';
import authReducer from './slices/authSlice';
import { syncMiddleware } from './middleware/syncMiddleware';

export const store = configureStore({
  reducer: {
    basket: basketReducer,
    favorites: favoritesReducer,
    offers: offersReducer,
    stores: storesReducer,
    settings: settingsReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types completely (they're already serialized in the thunks)
        ignoredActions: [
          'basket/hydrateBasket',
          'favorites/hydrateFavorites',
          'auth/signInWithGoogle/fulfilled',
          'auth/checkAuthState/fulfilled',
          'auth/setUser', // Add this line - this is the action causing the error
        ],
        // Ignore these specific paths in case any timestamps slip through
        ignoredPaths: [
          'auth.user.createdAt',
          'auth.user.lastLoginAt',
        ],
      },
    }).concat(syncMiddleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;