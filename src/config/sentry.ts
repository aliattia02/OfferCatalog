// src/config/sentry.ts - FIXED FOR TESTING
import * as Sentry from 'sentry-expo';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get Sentry DSN from multiple sources (fallback chain)
const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  Constants.expoConfig?.extra?.SENTRY_DSN ||
  'https://f5adc24cef5aa1f3347d425833d760ef@o4510741401436160.ingest.de.sentry.io/4510741403926608';

/**
 * Initialize Sentry for crash reporting and performance monitoring
 */
export const initializeSentry = () => {
  try {
    if (!SENTRY_DSN) {
      console.warn('⚠️ Sentry DSN not configured. Crash reporting disabled.');
      return;
    }

    Sentry.init({
      dsn: SENTRY_DSN,

      // ✅ CHANGED: Enable in BOTH dev and production for testing
      enabled: true, // Was: !__DEV__

      // Environment - mark as 'development' when in __DEV__
      environment: __DEV__ ? 'development' : 'production',

      // Release tracking
      release: `${Constants.expoConfig?.slug}@${Constants.expoConfig?.version}`,
      dist: Constants.expoConfig?.version,

      // Performance monitoring
      enableInExpoDevelopment: true, // ✅ CHANGED: Was false
      tracesSampleRate: 1.0,

      // ✅ Debug mode for testing
      debug: __DEV__, // Shows Sentry logs in console

      // Additional context
      beforeSend(event, hint) {
        try {
          // Add platform info
          event.tags = {
            ...event.tags,
            platform: Platform.OS,
            appVersion: Constants.expoConfig?.version,
          };

          // ✅ Log in dev mode
          if (__DEV__) {
            console.log('📤 [Sentry] Sending event:', event);
            console.log('📤 [Sentry] Hint:', hint);
          }

          return event;
        } catch (error) {
          console.error('Sentry beforeSend error:', error);
          return event;
        }
      },
    });

    console.log('✅ Sentry initialized successfully');
    console.log('📍 Environment:', __DEV__ ? 'development' : 'production');
    console.log('📍 DSN:', SENTRY_DSN.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Sentry initialization failed:', error);
    // Don't throw - let app continue without Sentry
  }
};

/**
 * Safe wrapper to check if Sentry is available
 */
const isSentryAvailable = (): boolean => {
  return !!Sentry?.Native && !!SENTRY_DSN; // ✅ CHANGED: Removed __DEV__ check
};

/**
 * Set current screen for better crash context
 */
export const setScreen = (screenName: string) => {
  try {
    if (!isSentryAvailable()) {
      if (__DEV__) {
        console.log(`📱 [Sentry] Screen: ${screenName}`);
      }
      return;
    }

    Sentry.Native.setContext('screen', {
      name: screenName,
      timestamp: new Date().toISOString(),
    });

    Sentry.Native.setTag('screen', screenName);
    addBreadcrumb(`Screen: ${screenName}`, 'navigation', { screen: screenName });

    if (__DEV__) {
      console.log(`📱 [Sentry] Screen set: ${screenName}`);
    }
  } catch (error) {
    console.error('Sentry setScreen error:', error);
  }
};

/**
 * Set user context for better crash reports
 */
export const setSentryUser = (user: { uid: string; email: string | null; isAdmin: boolean }) => {
  try {
    if (!isSentryAvailable()) {
      if (__DEV__) {
        console.log('✅ [Sentry] User context set:', user.email);
      }
      return;
    }

    Sentry.Native.setUser({
      id: user.uid,
      email: user.email || undefined,
      username: user.email?.split('@')[0] || undefined,
    });

    Sentry.Native.setTag('is_admin', user.isAdmin.toString());
    console.log('✅ [Sentry] User context set:', user.email);
  } catch (error) {
    console.error('Sentry setSentryUser error:', error);
  }
};

/**
 * Clear user context on logout
 */
export const clearSentryUser = () => {
  try {
    if (!isSentryAvailable()) {
      if (__DEV__) {
        console.log('✅ [Sentry] User context cleared');
      }
      return;
    }

    Sentry.Native.setUser(null);
    console.log('✅ [Sentry] User context cleared');
  } catch (error) {
    console.error('Sentry clearSentryUser error:', error);
  }
};

/**
 * Manually capture error with context
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  try {
    if (__DEV__) {
      console.error('🔴 [Sentry] Error captured:', error.message);
      console.error('🔴 [Sentry] Context:', context);
    }

    if (!isSentryAvailable()) {
      console.log('⚠️ Sentry not available, error not sent');
      return;
    }

    Sentry.Native.captureException(error, {
      contexts: {
        custom: context || {},
      },
      tags: {
        captured_manually: 'true',
      },
    });

    console.log('✅ [Sentry] Error sent to dashboard');
  } catch (err) {
    console.error('⚠️ Failed to capture error in Sentry:', err);
  }
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message: string, category: string = 'custom', data?: Record<string, any>) => {
  try {
    if (__DEV__) {
      console.log(`🍞 [Breadcrumb] ${category}: ${message}`, data || '');
    }

    if (!isSentryAvailable()) return;

    Sentry.Native.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  } catch (error) {
    // Silent fail - breadcrumbs are not critical
  }
};

/**
 * 🧪 TEST FUNCTION - Capture a test error
 */
export const testSentryError = () => {
  try {
    console.log('🧪 [Sentry] Testing error capture...');

    addBreadcrumb('User clicked test error button', 'user_action');

    const testError = new Error('🧪 Sentry Test Error from HomeScreen');

    // Capture the error instead of throwing it
    captureError(testError, {
      test: true,
      screen: 'HomeScreen',
      timestamp: new Date().toISOString(),
    });

    console.log('✅ [Sentry] Test error sent!');

    // Return success message
    return 'Test error sent to Sentry! Check your dashboard.';
  } catch (error) {
    console.error('❌ [Sentry] Failed to send test error:', error);
    return 'Failed to send test error. Check console.';
  }
};