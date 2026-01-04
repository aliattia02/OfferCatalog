// src/store/slices/offersSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { OffersState, Offer, Catalogue } from '../../types';
import { loadCataloguesFromFirestore } from '../../data/catalogueRegistry';

const initialState: OffersState = {
  offers: [],
  catalogues: [],
  loading:  false,
  error: null,
};

/**
 * Async thunk to load catalogues from Firestore
 */
export const loadCatalogues = createAsyncThunk(
  'offers/loadCatalogues',
  async () => {
    console.log('🔄 [offersSlice] Loading catalogues.. .');
    const catalogues = await loadCataloguesFromFirestore();
    console.log(`✅ [offersSlice] Loaded ${catalogues.length} catalogues`);
    return catalogues;
  }
);

export const offersSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    setOffers: (state, action:  PayloadAction<Offer[]>) => {
      state.offers = action.payload;
      console.log(`📝 [offersSlice] Set ${action.payload.length} offers`);
    },
    
    setCatalogues: (state, action: PayloadAction<Catalogue[]>) => {
      state.catalogues = action.payload;
      console.log(`📝 [offersSlice] Set ${action.payload.length} catalogues`);
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError:  (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    hydrateOffers: (state, action: PayloadAction<OffersState>) => {
      state.offers = action.payload. offers;
      state.catalogues = action.payload.catalogues;
      state.loading = false;
      state.error = null;
      console.log(`💧 [offersSlice] Hydrated with ${action.payload.catalogues.length} catalogues`);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCatalogues. pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('⏳ [offersSlice] Loading catalogues...');
      })
      .addCase(loadCatalogues.fulfilled, (state, action) => {
        state.loading = false;
        state.catalogues = action.payload;
        console.log(`✅ [offersSlice] Catalogues loaded into Redux:  ${action.payload.length}`);
      })
      .addCase(loadCatalogues. rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load catalogues';
        console.error('❌ [offersSlice] Failed to load catalogues:', action.error);
      });
  },
});

export const {
  setOffers,
  setCatalogues,
  setLoading,
  setError,
  hydrateOffers,
} = offersSlice. actions;

export default offersSlice.reducer;