// src/store/slices/settingsSlice.ts - ✅ COMPLETE WITH LOCATION SYNC
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { syncLocationToFirestore } from '../../services/userDataService';
import type { SettingsState } from '../../types';
import type { RootState } from '../index';

interface LocationPayload {
  governorate: string | null;
  city?: string | null;
}

const initialState: SettingsState = {
  language: 'ar',
  notificationsEnabled: true,
  isRTL: true,
  userGovernorate: null,
  userCity: null,
};

// ============================================
// ✅ ASYNC THUNK TO SYNC LOCATION TO FIRESTORE
// ============================================

/**
 * Sync user location to Firestore (if logged in)
 */
export const syncLocation = createAsyncThunk(
  'settings/syncLocation',
  async (payload: LocationPayload, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;

      // Only sync if user is logged in
      if (user) {
        console.log('📍 Syncing location to Firestore:', payload);
        await syncLocationToFirestore(
          user.uid,
          payload.governorate,
          payload.city || null
        );
        console.log('✅ Location synced successfully');
      } else {
        console.log('ℹ️ User not logged in, skipping Firestore sync');
      }

      return payload;
    } catch (error: any) {
      console.error('❌ Failed to sync location:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'ar' | 'en'>) => {
      state.language = action.payload;
      state.isRTL = action.payload === 'ar';
    },

    toggleNotifications: (state) => {
      state.notificationsEnabled = !state.notificationsEnabled;
    },

    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },

    setUserLocation: (state, action: PayloadAction<LocationPayload>) => {
      state.userGovernorate = action.payload.governorate;
      state.userCity = action.payload.city ?? null;
      console.log('📍 Redux: Location updated:', action.payload);
    },

    clearUserLocation: (state) => {
      state.userGovernorate = null;
      state.userCity = null;
      console.log('📍 Redux: Location cleared');
    },

    // ✅ NEW: Hydrate location from Firestore on login
    hydrateLocation: (state, action: PayloadAction<LocationPayload>) => {
      state.userGovernorate = action.payload.governorate;
      state.userCity = action.payload.city ?? null;
      console.log('📍 Redux: Location hydrated from Firestore:', action.payload);
    },

    hydrateSettings: (state, action: PayloadAction<SettingsState>) => {
      state.language = action.payload.language;
      state.notificationsEnabled = action.payload.notificationsEnabled;
      state.isRTL = action.payload.language === 'ar';
      state.userGovernorate = action.payload.userGovernorate ?? null;
      state.userCity = action.payload.userCity ?? null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncLocation.pending, (state) => {
        console.log('⏳ Syncing location to Firestore...');
      })
      .addCase(syncLocation.fulfilled, (state, action) => {
        console.log('✅ Location sync completed');
      })
      .addCase(syncLocation.rejected, (state, action) => {
        console.error('❌ Location sync failed:', action.payload);
      });
  },
});

export const {
  setLanguage,
  toggleNotifications,
  setNotificationsEnabled,
  setUserLocation,
  clearUserLocation,
  hydrateLocation,
  hydrateSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;