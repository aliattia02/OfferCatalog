import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SettingsState } from '../../types';

const initialState: SettingsState = {
  language: 'ar',
  notificationsEnabled: true,
  isRTL: true,
  userGovernorate: null,
  userCity: null,
};

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

    setUserLocation: (
      state,
      action: PayloadAction<{ governorate: string | null; city?: string | null }>
    ) => {
      state.userGovernorate = action.payload.governorate;
      state.userCity = action.payload.city ?? null;
    },

    clearUserLocation: (state) => {
      state.userGovernorate = null;
      state.userCity = null;
    },

    hydrateSettings: (state, action: PayloadAction<SettingsState>) => {
      state.language = action.payload.language;
      state.notificationsEnabled = action.payload.notificationsEnabled;
      state.isRTL = action.payload.language === 'ar';
      state.userGovernorate = action.payload.userGovernorate ?? null;
      state.userCity = action.payload.userCity ?? null;
    },
  },
});

export const {
  setLanguage,
  toggleNotifications,
  setNotificationsEnabled,
  setUserLocation,
  clearUserLocation,
  hydrateSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;