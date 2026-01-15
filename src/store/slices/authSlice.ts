// src/store/slices/authSlice.ts - UPDATED WITH AUTH STATE CHECKING
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { onAuthStateChanged } from 'firebase/auth';
import type { AuthState, UserProfile } from '../../types';
import {
  signInWithGoogleToken,
  signOut as authSignOut,
  getUserProfile,
} from '../../services/authService';
import { getAllUserData, syncAllUserData } from '../../services/userDataService';
import { hydrateFavorites } from './favoritesSlice';
import { hydrateBasket } from './basketSlice';
import { getAuthInstance } from '../../config/firebase';
import type { RootState } from '../index';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true, // ✅ Start with loading=true to check auth state
  error: null,
};

// Token payload type
interface GoogleAuthTokens {
  idToken: string | null;
  accessToken: string | null;
}

/**
 * ✅ NEW: Check auth state on app start
 * This restores the user session if they're already logged in
 */
export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.log('🔍 Checking authentication state...');
      const auth = getAuthInstance();

      return new Promise<UserProfile | null>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          unsubscribe(); // Unsubscribe after first check

          if (firebaseUser) {
            console.log('✅ User already logged in:', firebaseUser.email);

            try {
              // Get user profile from Firestore
              const userProfile = await getUserProfile(firebaseUser.uid);

              if (!userProfile) {
                console.warn('⚠️ User profile not found');
                resolve(null);
                return;
              }

              // Load user data (favorites, basket)
              try {
                console.log('📥 Loading user data from Firestore...');
                const { favorites, basket } = await getAllUserData(userProfile.uid);

                if (favorites) {
                  console.log('📦 Restoring favorites:', favorites.storeIds.length, 'stores');
                  dispatch(hydrateFavorites(favorites));
                }

                if (basket && basket.length > 0) {
                  console.log('🛒 Restoring basket:', basket.length, 'items');
                  const total = basket.reduce((sum, item) => {
                    if (item.type === 'offer' && item.offer) {
                      return sum + (item.offer.offerPrice * item.quantity);
                    }
                    return sum;
                  }, 0);
                  dispatch(hydrateBasket({ items: basket, total }));
                }

                console.log('✅ User data restored successfully');
              } catch (dataError) {
                console.warn('⚠️ Could not load user data:', dataError);
                // Don't fail auth check if data loading fails
              }

              resolve(userProfile);
            } catch (error) {
              console.error('❌ Error getting user profile:', error);
              resolve(null);
            }
          } else {
            console.log('ℹ️ No user logged in');
            resolve(null);
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Error checking auth state:', error);
      return rejectWithValue(error.message || 'Failed to check auth state');
    }
  }
);

/**
 * Async thunk for Google Sign-In
 */
export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (tokens: GoogleAuthTokens, { dispatch, rejectWithValue }) => {
    try {
      const { idToken, accessToken } = tokens;

      console.log('=== AUTH SLICE DEBUG ===');
      console.log('Received idToken:', idToken ? 'present' : 'null');
      console.log('Received accessToken:', accessToken ? 'present' : 'null');

      const userProfile = await signInWithGoogleToken(idToken, accessToken);

      if (!userProfile) {
        return rejectWithValue('Sign-in cancelled or failed');
      }

      console.log('✅ [authSlice] User profile obtained:', userProfile.email);

      // Load user data from Firestore
      try {
        console.log('🔥 [authSlice] Loading user data from Firestore...');
        const { favorites, basket } = await getAllUserData(userProfile.uid);

        console.log('📊 [authSlice] Loaded data:', {
          favorites: favorites ? 'yes' : 'no',
          basketItems: basket.length,
        });

        if (favorites) {
          console.log('🔄 [authSlice] Hydrating favorites:', favorites);
          dispatch(hydrateFavorites(favorites));
        }

        if (basket && basket.length > 0) {
          console.log('🔄 [authSlice] Hydrating basket:', basket.length, 'items');
          const total = basket.reduce((sum, item) => {
            if (item.type === 'offer' && item.offer) {
              return sum + (item.offer.offerPrice * item.quantity);
            }
            return sum;
          }, 0);

          dispatch(hydrateBasket({ items: basket, total }));
          console.log('✅ [authSlice] Basket hydrated with total:', total);
        } else {
          console.log('ℹ️ [authSlice] No basket items to restore');
        }
      } catch (dataError: any) {
        console.error('⚠️ [authSlice] Could not load user data:', dataError);
        // Don't fail the sign-in if data loading fails
      }

      return userProfile;
    } catch (error: any) {
      console.error('❌ Auth slice error:', error);
      return rejectWithValue(error.message || 'Failed to sign in');
    }
  }
);

/**
 * Async thunk for Sign Out with data sync
 */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { getState, rejectWithValue }) => {
    try {
      console.log('🔵 [authSlice] Starting sign out...');

      const state = getState() as RootState;
      const { user } = state.auth;

      // Sync data to Firestore before signing out (if user exists)
      if (user) {
        try {
          console.log('💾 [authSlice] Syncing user data to Firestore before sign out...');
          await syncAllUserData(
            user.uid,
            state.favorites,
            state.basket.items
          );
          console.log('✅ [authSlice] User data synced');
        } catch (syncError) {
          console.warn('⚠️ [authSlice] Failed to sync data before sign out:', syncError);
          // Continue with sign out even if sync fails
        }
      }

      await authSignOut();
      console.log('✅ [authSlice] Firebase sign out complete');
    } catch (error: any) {
      console.error('❌ [authSlice] Sign out error:', error);
      return rejectWithValue(error.message || 'Failed to sign out');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isAdmin = action.payload.isAdmin;
      state.loading = false;
      state.error = null;
    },
    clearUser: (state) => {
      console.log('🗑️ [authSlice] Clearing user state');
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.loading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Check auth state (on app start)
      .addCase(checkAuthState.pending, (state) => {
        state.loading = true;
        console.log('⏳ Checking auth state...');
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.isAdmin = action.payload.isAdmin;
          console.log('✅ Auth state restored:', action.payload.email);
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.isAdmin = false;
          console.log('ℹ️ No authenticated user found');
        }
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        console.error('❌ Failed to check auth state:', action.payload);
      })
      // Sign in with Google
      .addCase(signInWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.isAdmin;
        state.error = null;
        console.log('✅ [authSlice] User signed in:', action.payload.email);
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('❌ [authSlice] Sign in failed:', action.payload);
      })
      // Sign out
      .addCase(signOut.pending, (state) => {
        state.loading = true;
        console.log('⏳ [authSlice] Sign out pending...');
      })
      .addCase(signOut.fulfilled, (state) => {
        console.log('✅ [authSlice] Sign out fulfilled - clearing state');
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        console.error('❌ [authSlice] Sign out rejected:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
        // Still clear user even if sign out failed
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
      });
  },
});

export const { setUser, clearUser, setError, clearError } = authSlice.actions;
export default authSlice.reducer;