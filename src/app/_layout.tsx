import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { I18nManager, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import store from '../store';
import { initI18n } from '../i18n';
import { colors } from '../constants/theme';
import { initializeFirebase } from '../config/firebase';
import { onAuthChange } from '../services/authService';
import { setUser } from '../store/slices/authSlice';

// Import i18next for translation hook
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

        // Initialize Firebase (now async)
        await initializeFirebase();
        console.log('✅ Firebase initialized');

        // Listen to auth state changes
        const unsubscribe = onAuthChange((user) => {
          console.log('👤 Auth state changed:', user ?  user.email : 'Not logged in');
          store.dispatch(setUser(user));
        });

        setIsReady(true);
        console.log('✅ App initialization complete');

        // Cleanup
        return () => {
          unsubscribe();
        };
      } catch (error:  any) {
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
        <Text style={styles. errorText}>⚠️ {initError}</Text>
        <Text style={styles.errorSubtext}>سيتم المحاولة مجدداً... </Text>
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
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen
            name="flyer/[id]"
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'عودة',
            }}
          />
          <Stack.Screen
            name="store/[id]"
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'عودة',
            }}
          />
          <Stack.Screen
            name="offer/[id]"
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'عودة',
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
    justifyContent:  'center',
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
    color:  colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors. textSecondary,
    textAlign: 'center',
  },
});