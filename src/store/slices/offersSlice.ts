import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OffersState, Offer, Catalogue } from '../../types';

const initialState: OffersState = {
  offers: [],
  catalogues: [],
  loading: false,
  error: null,
};

export const offersSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    setOffers: (state, action: PayloadAction<Offer[]>) => {
      state.offers = action.payload;
    },
    
    setCatalogues: (state, action: PayloadAction<Catalogue[]>) => {
      state.catalogues = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    hydrateOffers: (state, action: PayloadAction<OffersState>) => {
      state.offers = action.payload.offers;
      state.catalogues = action.payload.catalogues;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setOffers,
  setCatalogues,
  setLoading,
  setError,
  hydrateOffers,
} = offersSlice.actions;

export default offersSlice.reducer;
