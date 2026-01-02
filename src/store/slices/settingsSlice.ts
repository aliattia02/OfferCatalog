import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SettingsState } from '../../types';

const initialState: SettingsState = {
  language: 'ar',
  notificationsEnabled: true,
  isRTL: true,
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
    
    hydrateSettings: (state, action: PayloadAction<SettingsState>) => {
      state.language = action.payload.language;
      state.notificationsEnabled = action.payload.notificationsEnabled;
      state.isRTL = action.payload.language === 'ar';
    },
  },
});

export const {
  setLanguage,
  toggleNotifications,
  setNotificationsEnabled,
  hydrateSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
