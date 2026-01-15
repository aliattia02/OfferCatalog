// app/_layout.tsx - UPDATED WITH AUTH STATE CHECK ON STARTUP
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
import { onAuthChange } from '../services/authService';
import { setUser, clearUser, checkAuthState } from '../store/slices/authSlice';
import { startBackgroundSync, stopBackgroundSync } from '../services/backgroundSync';
import { cacheService } from '../services/cacheService';

import '../i18n';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const prepare = async () => {
      try {
        console.log('🚀 Starting app initialization...');

        // Initialize i18n
        await initI18n();
        console.log('✅ i18n initialized');

        // Initialize Firebase (now async with persistence)
        await initializeFirebase();
        console.log('✅ Firebase initialized with persistence');

        // ✅ CRITICAL: Check if user is already logged in
        console.log('🔍 Checking for existing auth session...');
        await store.dispatch(checkAuthState()).unwrap();
        console.log('✅ Auth state check complete');

        // Clean up expired cache entries on startup
        const cleaned = await cacheService.cleanup();
        if (cleaned > 0) {
          console.log(`🧹 Cleaned ${cleaned} expired cache entries on startup`);
        }

        // Listen to auth state changes (for future changes)
        const unsubscribe = onAuthChange((user) => {
          console.log('🔄 Auth state changed:', user ? user.email : 'Not logged in');

          if (user) {
            store.dispatch(setUser(user));
          } else {
            store.dispatch(clearUser());
            // Clear user-specific caches on sign-out
            cacheService.clearUserCaches();
          }
        });

        // Start background sync service
        console.log('🚀 Starting background sync service...');
        startBackgroundSync();
        console.log('✅ Background sync service started');

        setIsReady(true);
        console.log('✅ App initialization complete');

        // Cleanup
        return () => {
          console.log('🛑 Cleaning up...');
          unsubscribe();
          stopBackgroundSync();
        };
      } catch (error: any) {
        console.error('❌ Error initializing app:', error);
        setInitError(error.message || 'Failed to initialize app');
        setIsReady(true); // Still show the app
      }
    };

    prepare();
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
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen
            name="flyer/[id]"
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'عودة',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="store/[id]"
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'عودة',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="offer/[id]"
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'عودة',
              presentation: 'card',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </Provider>
  );
}

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