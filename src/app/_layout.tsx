// src/app/_layout.tsx - FIXED: Delayed background sync for faster first load
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import store from '../store';
import { initI18n } from '../i18n';
import { colors } from '../constants/theme';
import { initializeFirebase } from '../config/firebase';
import { initializeSentry, setSentryUser, clearSentryUser } from '../config/sentry';
import { onAuthChange } from '../services/authService';
import { setUser, clearUser, checkAuthState } from '../store/slices/authSlice';
import { startBackgroundSync, stopBackgroundSync } from '../services/backgroundSync';
import { cacheService } from '../services/cacheService';

import '../i18n';

// ✅ Initialize Sentry FIRST (synchronous)
try {
  initializeSentry();
} catch (error) {
  console.error('❌ Sentry initialization error:', error);
}

// ✅ Delay (ms) before starting background sync after app is ready.
// This prevents background Firebase reads from competing with auth +
// first-render during startup, which was the main cause of slow load times.
const BACKGROUND_SYNC_DELAY_MS = 3000;

function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let syncDelayTimer: NodeJS.Timeout | null = null;
    let authChangeTimeout: NodeJS.Timeout | null = null;
    let lastAuthState: any = null;
    let unsubscribeAuth: (() => void) | null = null;

    const prepare = async () => {
      try {
        // 1. i18n (fast, synchronous-ish)
        await initI18n();

        // 2. Firebase (async, sets up persistence)
        await initializeFirebase();

        // 3. Restore existing auth session from persisted state
        await store.dispatch(checkAuthState()).unwrap();

        // 4. Clean expired cache entries (lightweight scan)
        const cleaned = await cacheService.cleanup();
        if (cleaned > 0 && __DEV__) {
          console.log(`🧹 Cleaned ${cleaned} expired cache entries on startup`);
        }

        // 5. Listen to live auth state changes (debounced)
        unsubscribeAuth = onAuthChange((user) => {
          if (__DEV__) {
            console.log('🔄 Auth state changed:', user ? user.email : 'Not logged in');
          }

          if (authChangeTimeout) clearTimeout(authChangeTimeout);

          authChangeTimeout = setTimeout(() => {
            const currentState = user ? user.uid : null;
            if (currentState === lastAuthState) return;
            lastAuthState = currentState;

            if (user) {
              store.dispatch(setUser(user));
              setSentryUser({ uid: user.uid, email: user.email, isAdmin: user.isAdmin });
            } else {
              const state = store.getState();
              if (!state.auth.loading) {
                store.dispatch(clearUser());
                cacheService.clearUserCaches();
                clearSentryUser();
              }
            }
          }, 500);
        });

        // 6. Mark app as ready — show UI immediately
        setIsReady(true);

        // 7. ✅ FIX: Delay background sync so it doesn't compete with
        //    auth state resolution + first render + Redux hydration.
        //    The home screen will load from cache while sync warms up.
        syncDelayTimer = setTimeout(() => {
          if (__DEV__) console.log('🚀 Starting background sync service (delayed)...');
          startBackgroundSync();
          if (__DEV__) console.log('✅ Background sync service started');
        }, BACKGROUND_SYNC_DELAY_MS);

      } catch (error: any) {
        if (__DEV__) console.error('❌ Error initializing app:', error);

        try {
          const Sentry = require('@sentry/react-native');
          Sentry.captureException(error, {
            tags: { initialization: true },
            contexts: { initialization: { step: 'app_startup', error_message: error.message } },
          });
        } catch {}

        setInitError(error.message || 'Failed to initialize app');
        setIsReady(true);
      }
    };

    prepare();

    return () => {
      if (syncDelayTimer) clearTimeout(syncDelayTimer);
      if (authChangeTimeout) clearTimeout(authChangeTimeout);
      if (unsubscribeAuth) unsubscribeAuth();
      stopBackgroundSync();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل التطبيق...</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>⚠️ {initError}</Text>
        <Text style={styles.errorSubtext}>سيتم المحاولة مجددًا...</Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen
            name="flyer/[id]"
            options={{ headerShown: true, title: '', headerBackTitle: 'عودة', presentation: 'card' }}
          />
          <Stack.Screen
            name="store/[id]"
            options={{ headerShown: true, title: '', headerBackTitle: 'عودة', presentation: 'card' }}
          />
          <Stack.Screen
            name="offer/[id]"
            options={{ headerShown: true, title: '', headerBackTitle: 'عودة', presentation: 'card' }}
          />
        </Stack>
      </SafeAreaProvider>
    </Provider>
  );
}

// Wrap with Sentry error boundary
let ExportedComponent = RootLayout;
try {
  const Sentry = require('@sentry/react-native');
  if (Sentry?.wrap) {
    ExportedComponent = Sentry.wrap(RootLayout);
    if (__DEV__) console.log('✅ Root component wrapped with Sentry error boundary');
  }
} catch (error) {
  if (__DEV__) console.warn('⚠️ Could not wrap component with Sentry:', error);
}

export default ExportedComponent;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});