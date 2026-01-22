// src/config/sentry.ts - FIXED: For Sentry v8+
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get Sentry DSN from app.json extra config
const SENTRY_DSN =
  Constants.expoConfig?.extra?.SENTRY_DSN ||
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  'https://4455e821d6409f1900afefae1c7ecf2c@o4510741401436160.ingest.de.sentry.io/4510741488664656';

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

    console.log('🚀 Initializing Sentry...');

    Sentry.init({
      dsn: SENTRY_DSN,

      // Enable in BOTH dev and production for testing
      enabled: true,

      // Environment
      environment: __DEV__ ? 'development' : 'production',

      // Release tracking
      release: `${Constants.expoConfig?.slug}@${Constants.expoConfig?.version}`,
      dist: Constants.expoConfig?.version,

      // 🔥 Performance monitoring - 100% in dev, 20% in prod
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,

      // Debug mode
      debug: __DEV__,

      // Native crash reporting
      enableNative: true,
      enableNativeCrashHandling: true,

      // Auto session tracking
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,

      // Network breadcrumbs
      enableCaptureFailedRequests: true,

      // Add platform context
      beforeSend(event, hint) {
        try {
          event.tags = {
            ...event.tags,
            platform: Platform.OS,
            appVersion: Constants.expoConfig?.version,
          };

          if (__DEV__) {
            console.log('📤 [Sentry] Sending event:', event.event_id);
          }

          return event;
        } catch (error) {
          console.error('Sentry beforeSend error:', error);
          return event;
        }
      },

      // 🔥 Integrations for Sentry v8+
      integrations: [
        // React Native Tracing
        Sentry.reactNativeTracingIntegration({
          // Automatic instrumentation
          enableNativeFramesTracking: true,
          enableStallTracking: true,
          enableAppStartTracking: true,
          enableUserInteractionTracing: true,

          // HTTP tracking
          traceFetch: true,
          traceXHR: true,

          // Timeouts
          idleTimeout: 1000,
          finalTimeout: 30000,
        }),

        // HTTP Client integration
        Sentry.httpClientIntegration({
          failedRequestStatusCodes: [400, 599],
          failedRequestTargets: [/.*/],
        }),
      ],
    });

    sentryInitialized = true;
    console.log('✅ Sentry initialized successfully');
    console.log('📍 Environment:', __DEV__ ? 'development' : 'production');
    console.log('📍 Tracing enabled: YES');
    console.log('📍 Sample Rate:', __DEV__ ? '100%' : '20%');
    console.log('📍 DSN:', SENTRY_DSN.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Sentry initialization failed:', error);
    sentryInitialized = false;
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

    if (!isSentryAvailable()) return;

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
 * Set user context
 */
export const setSentryUser = (user: { uid: string; email: string | null; isAdmin: boolean }) => {
  try {
    if (__DEV__) {
      console.log('✅ [Sentry] User context set:', user.email);
    }

    if (!isSentryAvailable()) return;

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
 * Clear user context
 */
export const clearSentryUser = () => {
  try {
    if (__DEV__) {
      console.log('✅ [Sentry] User context cleared');
    }

    if (!isSentryAvailable()) return;
    Sentry.setUser(null);
  } catch (error) {
    console.error('Sentry clearSentryUser error:', error);
  }
};

/**
 * Capture error with context
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
 * Capture a message
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  try {
    if (__DEV__) {
      console.log(`📝 [Sentry] Message: ${message}`);
    }

    if (!isSentryAvailable()) return;
    Sentry.captureMessage(message, level);
  } catch (error) {
    console.error('Sentry captureMessage error:', error);
  }
};

/**
 * Add breadcrumb
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
 * 🧪 TEST: Capture a test error
 */
export const testSentryError = () => {
  try {
    console.log('🧪 [Sentry] Testing error capture...');

    addBreadcrumb('User clicked test error button', 'user_action');

    const testError = new Error('🧪 Sentry Test Error from HomeScreen');

    captureError(testError, {
      test: true,
      screen: 'HomeScreen',
      timestamp: new Date().toISOString(),
    });

    console.log('✅ [Sentry] Test error sent!');
    return 'Test error sent to Sentry! Check your dashboard.';
  } catch (error) {
    console.error('❌ [Sentry] Failed to send test error:', error);
    return 'Failed to send test error. Check console.';
  }
};

/**
 * 🧪 TEST: Test tracing with Sentry v8 API
 */
export const testSentryTracing = async () => {
  try {
    console.log('🧪 [Sentry] Testing tracing...');

    if (!isSentryAvailable()) {
      return 'Tracing not available - Sentry not initialized';
    }

    // 🔥 Use Sentry.startSpan for v8+
    const result = await Sentry.startSpan(
      {
        name: 'test.transaction',
        op: 'test',
        attributes: {
          testData: 'test value',
          manual: 'true',
        },
      },
      async (span) => {
        // Child span 1: Fetch
        await Sentry.startSpan(
          {
            name: 'Fetch test data',
            op: 'test.fetch',
            attributes: {
              records: 42,
            },
          },
          async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        );

        // Child span 2: Process
        await Sentry.startSpan(
          {
            name: 'Process test data',
            op: 'test.process',
            attributes: {
              processed: true,
            },
          },
          async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        );

        return 'Transaction completed';
      }
    );

    console.log('✅ [Sentry] Test transaction sent!');
    return 'Test transaction sent! Check your Performance tab in Sentry.';
  } catch (error) {
    console.error('❌ [Sentry] Tracing test failed:', error);
    return `Failed to test tracing: ${error instanceof Error ? error.message : 'Unknown error'}`;
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