// src/store/slices/favoritesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FavoritesState } from '../../types';

const initialState: FavoritesState = {
  offerIds: [],
  storeIds:  [],
};

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavoriteOffer: (state, action: PayloadAction<string>) => {
      const offerId = action.payload;
      const index = state.offerIds. indexOf(offerId);
      
      if (index > -1) {
        state.offerIds.splice(index, 1);
        console.log(`❤️ Removed offer ${offerId} from favorites`);
      } else {
        state. offerIds.push(offerId);
        console.log(`❤️ Added offer ${offerId} to favorites`);
      }
    },
    
    toggleFavoriteStore: (state, action: PayloadAction<string>) => {
      const storeId = action.payload;
      const index = state.storeIds.indexOf(storeId);
      
      if (index > -1) {
        state.storeIds.splice(index, 1);
        console.log(`⭐ Removed store ${storeId} from favorites`);
      } else {
        state. storeIds.push(storeId);
        console.log(`⭐ Added store ${storeId} to favorites`);
      }
    },
    
    hydrateFavorites: (state, action: PayloadAction<FavoritesState>) => {
      state.offerIds = action.payload.offerIds;
      state.storeIds = action.payload.storeIds;
      console.log(`💧 Hydrated favorites:  ${state.offerIds.length} offers, ${state.storeIds.length} stores`);
    },

    clearFavorites: (state) => {
      console.log('🗑️ Clearing favorites');
      state.offerIds = [];
      state.storeIds = [];
    },
  },
});

export const { 
  toggleFavoriteOffer, 
  toggleFavoriteStore, 
  hydrateFavorites,
  clearFavorites 
} = favoritesSlice. actions;

export default favoritesSlice. reducer;