// src/store/slices/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, UserProfile } from '../../types';
import {
  signInWithGoogleToken,
  signOut as authSignOut,
  getUserProfile,
} from '../../services/authService';
import { getAllUserData } from '../../services/userDataService';
import { hydrateFavorites } from './favoritesSlice';
import { hydrateBasket } from './basketSlice';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  error: null,
};

// Token payload type
interface GoogleAuthTokens {
  idToken: string | null;
  accessToken: string | null;
}

/**
 * Async thunk for Google Sign-In
 * @param tokens Object containing idToken and/or accessToken
 */
export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (tokens:  GoogleAuthTokens, { dispatch, rejectWithValue }) => {
    try {
      const { idToken, accessToken } = tokens;

      console.log('=== AUTH SLICE DEBUG ===');
      console.log('Received idToken:', idToken ?  'present' :  'null');
      console.log('Received accessToken:', accessToken ? 'present' : 'null');

      const userProfile = await signInWithGoogleToken(idToken, accessToken);

      if (! userProfile) {
        return rejectWithValue('Sign-in cancelled or failed');
      }

      // Load user data from Firestore
      try {
        const { favorites, basket } = await getAllUserData(userProfile.uid);

        // Hydrate Redux state with user data
        if (favorites) {
          dispatch(hydrateFavorites(favorites));
        }
        if (basket && basket.length > 0) {
          dispatch(hydrateBasket({ items: basket, total: 0 }));
        }
      } catch (dataError) {
        console.warn('Could not load user data:', dataError);
        // Don't fail sign-in if user data fails to load
      }

      return userProfile;
    } catch (error:  any) {
      console.error('Auth slice error:', error);
      return rejectWithValue(error.message || 'Failed to sign in');
    }
  }
);

/**
 * Async thunk for Sign Out
 */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await authSignOut();
    } catch (error:  any) {
      return rejectWithValue(error.message || 'Failed to sign out');
    }
  }
);

/**
 * Async thunk to check auth state on app start
 */
export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (uid: string, { dispatch, rejectWithValue }) => {
    try {
      const userProfile = await getUserProfile(uid);

      if (! userProfile) {
        return rejectWithValue('User profile not found');
      }

      // Load user data from Firestore
      try {
        const { favorites, basket } = await getAllUserData(userProfile.uid);

        // Hydrate Redux state with user data
        if (favorites) {
          dispatch(hydrateFavorites(favorites));
        }
        if (basket && basket. length > 0) {
          dispatch(hydrateBasket({ items: basket, total: 0 }));
        }
      } catch (dataError) {
        console.warn('Could not load user data:', dataError);
      }

      return userProfile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check auth state');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isAdmin = action.payload?.isAdmin || false;
      state.error = null;
    },
    setLoading:  (state, action:  PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state. error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Sign In with Google
    builder
      .addCase(signInWithGoogle. pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state. loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isAdmin = action.payload. isAdmin;
        state.error = null;
      })
      .addCase(signInWithGoogle. rejected, (state, action) => {
        state.loading = false;
        state.error = action. payload as string;
      });

    // Sign Out
    builder
      .addCase(signOut.pending, (state) => {
        state. loading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state. loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state. error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Check Auth State
    builder
      . addCase(checkAuthState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.isAdmin;
        state.error = null;
      })
      .addCase(checkAuthState. rejected, (state, action) => {
        state.loading = false;
        state.error = action. payload as string;
      });
  },
});

export const { setUser, setLoading, setError, clearError, clearUser } = authSlice.actions;

export default authSlice.reducer;