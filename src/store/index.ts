import { configureStore } from '@reduxjs/toolkit';
import basketReducer from './slices/basketSlice';
import favoritesReducer from './slices/favoritesSlice';
import offersReducer from './slices/offersSlice';
import storesReducer from './slices/storesSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    basket: basketReducer,
    favorites: favoritesReducer,
    offers: offersReducer,
    stores: storesReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['basket/hydrateBasket', 'favorites/hydrateFavorites'],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;
