// src/config/sentry.ts - PRODUCTION OPTIMIZED with Enhanced Monitoring
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================================================
// SAMPLING CONFIGURATION - Adjust these to control Sentry quota usage
// ============================================================================
const SAMPLING_CONFIG = {
  // Performance Monitoring (Traces)
  // 0.1 = 10% of transactions (recommended for free tier)
  // 0.5 = 50% of transactions (moderate usage)
  // 1.0 = 100% of transactions (high usage, not recommended for free tier)
  tracesSampleRate: 0.3,

  // Profiling (CPU/Memory profiles)
  // Should typically be same or lower than traces
  profilesSampleRate: 0.3,

  // Mobile Replay Sessions
  // 0.1 = 10% of sessions recorded
  // Note: Replays consume significant quota
  replaysSessionSampleRate: 0.3,

  // Mobile Replay on Error
  // 1.0 = Always record when error occurs (recommended)
  replaysOnErrorSampleRate: 1.0,
};

// Get Sentry DSN from app.json extra config
const SENTRY_DSN =
  Constants.expoConfig?.extra?.SENTRY_DSN ||
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  'https://4455e821d6409f1900afefae1c7ecf2c@o4510741401436160.ingest.de.sentry.io/4510741488664656';

// Track if Sentry was successfully initialized
let sentryInitialized = false;

/**
 * Initialize Sentry for crash reporting and performance monitoring
 * Production-optimized configuration
 */
export const initializeSentry = () => {
  try {
    if (!SENTRY_DSN) {
      console.warn('⚠️ Sentry DSN not configured. Crash reporting disabled.');
      return;
    }

    console.log('🚀 Initializing Sentry for production...');

    Sentry.init({
      dsn: SENTRY_DSN,

      // 🎯 PRODUCTION: Enable only in production, disable in dev to avoid noise
      enabled: !__DEV__,

      // Environment
      environment: __DEV__ ? 'development' : 'production',

      // Release tracking
      release: `${Constants.expoConfig?.slug}@${Constants.expoConfig?.version}`,
      dist: Constants.expoConfig?.version,

      // 🎯 PRODUCTION: Performance monitoring - Configurable sampling
      // Adjust SAMPLING_CONFIG.tracesSampleRate to control quota usage
      tracesSampleRate: SAMPLING_CONFIG.tracesSampleRate,

      // 🎯 PRODUCTION: Profiling - Configurable sampling
      // Adjust SAMPLING_CONFIG.profilesSampleRate to control quota usage
      profilesSampleRate: SAMPLING_CONFIG.profilesSampleRate,

      // Debug mode - DISABLED even in dev to suppress Sentry's internal [TouchEvents] log spam
      debug: false,

      // Native crash reporting
      enableNative: true,
      enableNativeCrashHandling: true,

      // Auto session tracking
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,

      // 🎯 PRODUCTION: Enhanced network monitoring
      enableCaptureFailedRequests: true,

      // 🎯 PRODUCTION: Max breadcrumbs for better context
      maxBreadcrumbs: 100,

      // 🎯 PRODUCTION: Attach screenshots on errors (mobile only)
      attachScreenshot: Platform.OS !== 'web',

      // 🎯 PRODUCTION: Attach view hierarchy (helps debug UI issues)
      attachViewHierarchy: true,

      // Add platform and version context to all events
      beforeSend(event, hint) {
        try {
          // Enrich event with additional context
          event.tags = {
            ...event.tags,
            platform: Platform.OS,
            appVersion: Constants.expoConfig?.version,
            expoVersion: Constants.expoConfig?.sdkVersion,
          };

          // Add device context
          event.contexts = {
            ...event.contexts,
            device: {
              ...event.contexts?.device,
              screen_width: Platform.select({
                web: typeof window !== 'undefined' ? window.innerWidth : undefined,
                default: undefined,
              }),
              screen_height: Platform.select({
                web: typeof window !== 'undefined' ? window.innerHeight : undefined,
                default: undefined,
              }),
            },
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

      // 🎯 PRODUCTION: Comprehensive integrations
      integrations: [
        // React Native Tracing with all features enabled
        Sentry.reactNativeTracingIntegration({
          // Automatic instrumentation
          enableNativeFramesTracking: true,
          enableStallTracking: true,
          enableAppStartTracking: true,
          enableUserInteractionTracing: false, // ❌ DISABLED - spams logs on every tap

          // HTTP tracking
          traceFetch: true,
          traceXHR: true,

          // Navigation tracking
          routingInstrumentation: Sentry.reactNavigationIntegration(),

          // Timeouts
          idleTimeout: 1000,
          finalTimeout: 30000,
        }),

        // HTTP Client integration with comprehensive monitoring
        Sentry.httpClientIntegration({
          failedRequestStatusCodes: [400, 599],
          failedRequestTargets: [/.*/],
        }),

        // 🎯 NEW: Mobile Replay (for production debugging)
        // Only available on mobile, helps reproduce issues
        ...(Platform.OS !== 'web' ? [
          Sentry.mobileReplayIntegration({
            maskAllText: true,
            maskAllImages: true,
            maskAllVectors: true,
          }),
        ] : []),
      ],

      // 🎯 PRODUCTION: Mobile Replay sampling rates
      replaysSessionSampleRate: SAMPLING_CONFIG.replaysSessionSampleRate,
      replaysOnErrorSampleRate: SAMPLING_CONFIG.replaysOnErrorSampleRate,
    });

    sentryInitialized = true;
    console.log('✅ Sentry initialized successfully');
    console.log('🔍 Environment:', __DEV__ ? 'development' : 'production');
    console.log(`📊 Tracing: ${(SAMPLING_CONFIG.tracesSampleRate * 100).toFixed(0)}% sampling`);
    console.log(`🎯 Profiling: ${(SAMPLING_CONFIG.profilesSampleRate * 100).toFixed(0)}% sampling`);
    console.log(`🎬 Replay: ${(SAMPLING_CONFIG.replaysSessionSampleRate * 100).toFixed(0)}% sessions, ${(SAMPLING_CONFIG.replaysOnErrorSampleRate * 100).toFixed(0)}% on errors`);
    console.log('📸 Screenshots: ', Platform.OS !== 'web' ? 'ENABLED' : 'DISABLED');
    console.log('🔑 DSN:', SENTRY_DSN.substring(0, 50) + '...');
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
    if (!isSentryAvailable()) return;

    Sentry.setUser({
      id: user.uid,
      email: user.email || undefined,
      username: user.email?.split('@')[0] || undefined,
    });

    Sentry.setTag('is_admin', user.isAdmin.toString());

    console.log('✅ [Sentry] User context set:', user.email);
  } catch (error) {
    console.error('Sentry setSentryUser error:', error);
  }
};

/**
 * Clear user context
 */
export const clearSentryUser = () => {
  try {
    if (!isSentryAvailable()) return;

    Sentry.setUser(null);
    console.log('✅ [Sentry] User context cleared');
  } catch (error) {
    console.error('Sentry clearSentryUser error:', error);
  }
};

/**
 * Capture error with context
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  try {
    console.error('🔴 [Sentry] Error captured:', error.message);
    if (context) {
      console.error('🔴 [Sentry] Context:', context);
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
 * 🎯 PRODUCTION: Start a performance span
 * Use this for tracking specific operations
 */
export const startSpan = <T>(
  context: {
    name: string;
    op: string;
    attributes?: Record<string, any>;
  },
  callback: (span: Sentry.Span) => T
): T => {
  if (!isSentryAvailable()) {
    // If Sentry not available, just run the callback
    return callback(null as any);
  }

  return Sentry.startSpan(context, callback);
};

/**
 * 🎯 PRODUCTION: Start an inactive span (for manual control)
 */
export const startInactiveSpan = (context: {
  name: string;
  op: string;
  attributes?: Record<string, any>;
}): ReturnType<typeof Sentry.startInactiveSpan> | null => {
  if (!isSentryAvailable()) {
    return null;
  }

  return Sentry.startInactiveSpan(context);
};

/**
 * 🎯 PRODUCTION: Measure function execution time
 */
export const measureAsync = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> => {
  return startSpan(
    {
      name: operationName,
      op: 'function',
      attributes,
    },
    async () => {
      return await operation();
    }
  );
};

/**
 * 🎯 PRODUCTION: Measure synchronous function execution time
 */
export const measure = <T>(
  operationName: string,
  operation: () => T,
  attributes?: Record<string, any>
): T => {
  return startSpan(
    {
      name: operationName,
      op: 'function',
      attributes,
    },
    () => {
      return operation();
    }
  );
};

/**
 * 🎯 PRODUCTION: Track API calls
 */
export const trackAPICall = async <T>(
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  return measureAsync(
    `API ${method} ${endpoint}`,
    apiCall,
    {
      endpoint,
      method,
      api: true,
    }
  );
};

/**
 * 🎯 PRODUCTION: Track database operations
 */
export const trackDBOperation = async <T>(
  operation: string,
  collection: string,
  dbCall: () => Promise<T>
): Promise<T> => {
  return measureAsync(
    `DB ${operation} ${collection}`,
    dbCall,
    {
      operation,
      collection,
      database: true,
    }
  );
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

/**
 * 🎯 PRODUCTION: Performance monitoring helpers
 */
export const Performance = {
  startSpan,
  startInactiveSpan,
  measureAsync,
  measure,
  trackAPICall,
  trackDBOperation,
};

// Export Sentry for advanced usage
export { Sentry };