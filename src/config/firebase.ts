// src/config/firebase.ts - FIXED: Platform-specific App IDs + proper Analytics initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Analytics } from 'firebase/analytics';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For React Native persistence
import { getReactNativePersistence } from 'firebase/auth';

// ✅ CRITICAL FIX: Get platform-specific App ID with better fallback
const getAppId = () => {
  const extra = Constants.expoConfig?.extra;

  if (Platform.OS === 'web') {
    return extra?.EXPO_PUBLIC_FIREBASE_APP_ID_WEB ||
           process.env.EXPO_PUBLIC_FIREBASE_APP_ID_WEB;
  } else if (Platform.OS === 'android') {
    return extra?.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID ||
           process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID;
  } else if (Platform.OS === 'ios') {
    // Add iOS App ID when available
    return extra?.EXPO_PUBLIC_FIREBASE_APP_ID_IOS ||
           process.env.EXPO_PUBLIC_FIREBASE_APP_ID_IOS ||
           // Fallback to Android ID for iOS if iOS not configured
           extra?.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID ||
           process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID;
  }
  return undefined;
};

// Helper to get env value with fallback
const getEnvValue = (key: string) => {
  return Constants.expoConfig?.extra?.[key] || process.env[key];
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: getEnvValue('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvValue('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvValue('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvValue('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvValue('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getAppId(),
  measurementId: getEnvValue('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'),
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize Firebase app and services with proper persistence
 */
export const initializeFirebase = async (): Promise<{
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  analytics: Analytics | null;
}> => {
  // If already initializing, wait for it to complete
  if (isInitializing && initializationPromise) {
    await initializationPromise;
    return { app: app!, auth: auth!, db: db!, storage: storage!, analytics };
  }

  // If already initialized, return existing instances
  if (app && auth && db && storage) {
    console.log('✅ Firebase already initialized, returning existing instances');
    return { app, auth, db, storage, analytics };
  }

  // Start initialization
  isInitializing = true;

  initializationPromise = (async () => {
    try {
      console.log('🚀 Initializing Firebase...');
      console.log('📱 Platform:', Platform.OS);

      // ✅ ENHANCED VALIDATION: Check all required fields
      const missingFields = [];
      if (!firebaseConfig.apiKey) missingFields.push('apiKey');
      if (!firebaseConfig.authDomain) missingFields.push('authDomain');
      if (!firebaseConfig.projectId) missingFields.push('projectId');
      if (!firebaseConfig.storageBucket) missingFields.push('storageBucket');
      if (!firebaseConfig.messagingSenderId) missingFields.push('messagingSenderId');
      if (!firebaseConfig.appId) missingFields.push('appId');

      if (missingFields.length > 0) {
        const errorMsg = `❌ Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`;
        console.error(errorMsg);
        console.error('🔍 Debug Info:', {
          platform: Platform.OS,
          hasExtra: !!Constants.expoConfig?.extra,
          extraKeys: Constants.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : [],
          processEnvKeys: Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_')),
        });
        throw new Error(errorMsg);
      }

      console.log('✅ Firebase Config loaded:', {
        projectId: firebaseConfig.projectId,
        appId: firebaseConfig.appId?.substring(0, 20) + '...',
        platform: Platform.OS,
        hasApiKey: !!firebaseConfig.apiKey,
        hasMeasurementId: !!firebaseConfig.measurementId,
      });

      // Initialize Firebase App
      const existingApps = getApps();
      if (existingApps.length === 0) {
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase app initialized');
      } else {
        app = existingApps[0];
        console.log('✅ Using existing Firebase app');
      }

      // Initialize Auth differently for web vs native
      if (!auth) {
        if (Platform.OS === 'web') {
          try {
            auth = getAuth(app);
            console.log('✅ Firebase Auth initialized for web');
          } catch (error: any) {
            console.error('❌ Error initializing web auth:', error);
            throw error;
          }
        } else {
          try {
            auth = initializeAuth(app, {
              persistence: getReactNativePersistence(AsyncStorage)
            });
            console.log('✅ Firebase Auth initialized for React Native with AsyncStorage persistence');
          } catch (error: any) {
            console.warn('⚠️ initializeAuth failed, falling back to getAuth:', error.message);
            auth = getAuth(app);
          }
        }
      }

      // Initialize Firestore with platform-specific settings
      if (!db) {
        if (Platform.OS === 'web') {
          try {
            db = initializeFirestore(app, {
              localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
              })
            });
            console.log('✅ Firestore initialized for web with persistent cache');
          } catch (error: any) {
            console.warn('⚠️ Persistent cache initialization failed, using default:', error.message);
            db = getFirestore(app);
          }
        } else {
          db = getFirestore(app);
          console.log('✅ Firestore initialized for native');
        }
      }

      // Initialize Storage
      if (!storage) {
        storage = getStorage(app);
        console.log('✅ Firebase Storage initialized');
      }

      // Initialize Analytics - WEB ONLY with proper checks
      if (Platform.OS === 'web') {
        if (!firebaseConfig.measurementId) {
          console.warn('⚠️ Firebase measurementId not found, Analytics disabled');
        } else {
          try {
            const { getAnalytics, isSupported } = await import('firebase/analytics');
            const supported = await isSupported();
            if (supported) {
              analytics = getAnalytics(app);
              console.log('✅ Firebase Analytics initialized for web');
            } else {
              console.log('⚠️ Firebase Analytics not supported in this environment');
            }
          } catch (error: any) {
            console.warn('⚠️ Firebase Analytics initialization failed:', error.message);
          }
        }
      } else {
        console.log('📱 Native platform - Analytics handled by Firebase SDK');
      }

      console.log('✅ All Firebase services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
      app = null;
      auth = null;
      db = null;
      storage = null;
      analytics = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  await initializationPromise;
  return { app: app!, auth: auth!, db: db!, storage: storage!, analytics };
};

/**
 * Get Firebase Auth instance
 */
export const getAuthInstance = (): Auth => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase first.');
  }
  return auth;
};

/**
 * Get Firestore instance
 */
export const getDbInstance = (): Firestore => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase first.');
  }
  return db;
};

/**
 * Get Firebase Storage instance
 */
export const getStorageInstance = (): FirebaseStorage => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Call initializeFirebase first.');
  }
  return storage;
};

/**
 * Get Firebase Analytics instance (web only)
 */
export const getAnalyticsInstance = (): Analytics | null => {
  return analytics;
};

// Export instances (will be null until initialized)
export { auth, db, storage, app, analytics };