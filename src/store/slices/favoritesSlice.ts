import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FavoritesState } from '../../types';
import { syncFavoritesToFirestore } from '../../services/userDataService';

const initialState: FavoritesState = {
  storeIds: [],
  offerIds: [],
};

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavoriteStore: (state, action: PayloadAction<string>) => {
      const storeId = action.payload;
      const index = state.storeIds.indexOf(storeId);
      
      if (index === -1) {
        state.storeIds.push(storeId);
      } else {
        state.storeIds.splice(index, 1);
      }
    },
    
    toggleFavoriteOffer: (state, action: PayloadAction<string>) => {
      const offerId = action.payload;
      const index = state.offerIds.indexOf(offerId);
      
      if (index === -1) {
        state.offerIds.push(offerId);
      } else {
        state.offerIds.splice(index, 1);
      }
    },
    
    clearFavorites: (state) => {
      state.storeIds = [];
      state.offerIds = [];
    },
    
    hydrateFavorites: (state, action: PayloadAction<FavoritesState>) => {
      state.storeIds = action.payload.storeIds;
      state.offerIds = action.payload.offerIds;
    },

    // Sync favorites to Firestore for authenticated users
    syncFavorites: (state, action: PayloadAction<string>) => {
      const uid = action.payload;
      if (uid) {
        syncFavoritesToFirestore(uid, { storeIds: state.storeIds, offerIds: state.offerIds }).catch((error) => {
          console.error('Error syncing favorites:', error);
        });
      }
    },
  },
});

export const {
  toggleFavoriteStore,
  toggleFavoriteOffer,
  clearFavorites,
  hydrateFavorites,
  syncFavorites,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
