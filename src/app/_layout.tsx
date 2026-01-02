import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { I18nManager, View, ActivityIndicator, StyleSheet } from 'react-native';
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

  useEffect(() => {
    const prepare = async () => {
      try {
        // Initialize i18n
        await initI18n();
        
        // Initialize Firebase
        initializeFirebase();
        
        // Listen to auth state changes
        const unsubscribe = onAuthChange((user) => {
          store.dispatch(setUser(user));
        });
        
        setIsReady(true);
        
        // Cleanup
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
