// src/config/sentry.ts - FIXED: Using @sentry/react-native directly
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get Sentry DSN from multiple sources (fallback chain)
const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  Constants.expoConfig?.extra?.SENTRY_DSN ||
  'https://f5adc24cef5aa1f3347d425833d760ef@o4510741401436160.ingest.de.sentry.io/4510741403926608';

// Track if Sentry was successfully initialized
let sentryInitialized = false;

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

      // Enable in BOTH dev and production for testing
      enabled: true,

      // Environment - mark as 'development' when in __DEV__
      environment: __DEV__ ? 'development' : 'production',

      // Release tracking
      release: `${Constants.expoConfig?.slug}@${Constants.expoConfig?.version}`,
      dist: Constants.expoConfig?.version,

      // Performance monitoring
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,

      // Debug mode for testing
      debug: __DEV__,

      // Enable native crash reporting
      enableNative: true,

      // Auto session tracking
      enableAutoSessionTracking: true,

      // Session timeout
      sessionTrackingIntervalMillis: 30000,

      // Additional context
      beforeSend(event, hint) {
        try {
          // Add platform info
          event.tags = {
            ...event.tags,
            platform: Platform.OS,
            appVersion: Constants.expoConfig?.version,
          };

          // Log in dev mode
          if (__DEV__) {
            console.log('📤 [Sentry] Sending event:', event.event_id);
          }

          return event;
        } catch (error) {
          console.error('Sentry beforeSend error:', error);
          return event;
        }
      },

      // Integrations
      integrations: [
        Sentry.reactNativeTracingIntegration(),
      ],
    });

    sentryInitialized = true;
    console.log('✅ Sentry initialized successfully');
    console.log('📍 Environment:', __DEV__ ? 'development' : 'production');
    console.log('📍 DSN:', SENTRY_DSN.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Sentry initialization failed:', error);
    sentryInitialized = false;
    // Don't throw - let app continue without Sentry
  }
};

/**
 * Safe wrapper to check if Sentry is available
 */
const isSentryAvailable = (): boolean => {
  return sentryInitialized && !!SENTRY_DSN;
};

/**
 * Set current screen for better crash context
 */
export const setScreen = (screenName: string) => {
  try {
    if (__DEV__) {
      console.log(`📱 [Sentry] Screen set: ${screenName}`);
    }

    if (!isSentryAvailable()) {
      return;
    }

    Sentry.setContext('screen', {
      name: screenName,
      timestamp: new Date().toISOString(),
    });

    Sentry.setTag('screen', screenName);
    addBreadcrumb(`Screen: ${screenName}`, 'navigation', { screen: screenName });
  } catch (error) {
    console.error('Sentry setScreen error:', error);
  }
};

/**
 * Set user context for better crash reports
 */
export const setSentryUser = (user: { uid: string; email: string | null; isAdmin: boolean }) => {
  try {
    if (__DEV__) {
      console.log('✅ [Sentry] User context set:', user.email);
    }

    if (!isSentryAvailable()) {
      return;
    }

    Sentry.setUser({
      id: user.uid,
      email: user.email || undefined,
      username: user.email?.split('@')[0] || undefined,
    });

    Sentry.setTag('is_admin', user.isAdmin.toString());
  } catch (error) {
    console.error('Sentry setSentryUser error:', error);
  }
};

/**
 * Clear user context on logout
 */
export const clearSentryUser = () => {
  try {
    if (__DEV__) {
      console.log('✅ [Sentry] User context cleared');
    }

    if (!isSentryAvailable()) {
      return;
    }

    Sentry.setUser(null);
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
      if (context) {
        console.error('🔴 [Sentry] Context:', context);
      }
    }

    if (!isSentryAvailable()) {
      console.log('⚠️ Sentry not available, error logged locally only');
      return;
    }

    Sentry.captureException(error, {
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
 * Capture a message (not an error)
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  try {
    if (__DEV__) {
      console.log(`📝 [Sentry] Message: ${message}`);
    }

    if (!isSentryAvailable()) {
      return;
    }

    Sentry.captureMessage(message, level);
  } catch (error) {
    console.error('Sentry captureMessage error:', error);
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

    Sentry.addBreadcrumb({
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
 * Set custom tag
 */
export const setTag = (key: string, value: string) => {
  try {
    if (!isSentryAvailable()) return;
    Sentry.setTag(key, value);
  } catch (error) {
    console.error('Sentry setTag error:', error);
  }
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, any>) => {
  try {
    if (!isSentryAvailable()) return;
    Sentry.setContext(name, context);
  } catch (error) {
    console.error('Sentry setContext error:', error);
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

/**
 * Wrap component with Sentry error boundary
 */
export const wrap = Sentry.wrap;

/**
 * Log screen view for analytics
 */
export const logScreenView = (screenName: string) => {
  setScreen(screenName);
};