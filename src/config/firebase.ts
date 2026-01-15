// src/config/firebase.ts - UPDATED WITH AUTH PERSISTENCE
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
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
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For React Native persistence
import { getReactNativePersistence } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
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
}> => {
  // If already initializing, wait for it to complete
  if (isInitializing && initializationPromise) {
    await initializationPromise;
    return { app: app!, auth: auth!, db: db!, storage: storage! };
  }

  // If already initialized, return existing instances
  if (app && auth && db && storage) {
    console.log('✅ Firebase already initialized, returning existing instances');
    return { app, auth, db, storage };
  }

  // Start initialization
  isInitializing = true;

  initializationPromise = (async () => {
    try {
      console.log('🚀 Initializing Firebase...');

      // Initialize Firebase App
      const existingApps = getApps();
      if (existingApps.length === 0) {
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase app initialized');
      } else {
        app = existingApps[0];
        console.log('✅ Using existing Firebase app');
      }

      // ✅ Initialize Auth with platform-specific persistence
      if (!auth) {
        if (Platform.OS === 'web') {
          // Web: Use initializeAuth with browser persistence
          try {
            auth = initializeAuth(app, {
              persistence: [
                indexedDBLocalPersistence,
                browserLocalPersistence,
                browserSessionPersistence
              ],
            });
            console.log('✅ Firebase Auth initialized for web with local persistence');
          } catch (error: any) {
            // Fallback to default auth if persistence fails
            console.warn('⚠️ Custom persistence failed, using default auth:', error.message);
            auth = getAuth(app);
          }
        } else {
          // React Native: Use AsyncStorage persistence
          auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
          console.log('✅ Firebase Auth initialized for React Native with AsyncStorage persistence');
        }
      }

      // Initialize Firestore with platform-specific settings
      if (!db) {
        if (Platform.OS === 'web') {
          try {
            // For web: Use persistent cache with multi-tab support
            db = initializeFirestore(app, {
              localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
              })
            });
            console.log('✅ Firestore initialized for web with persistent cache');
          } catch (error: any) {
            // If persistent cache fails, try without it
            console.warn('⚠️ Persistent cache initialization failed, using default:', error.message);
            db = getFirestore(app);
          }
        } else {
          // For native: Use default Firestore
          db = getFirestore(app);
          console.log('✅ Firestore initialized for native');
        }
      }

      // Initialize Storage
      if (!storage) {
        storage = getStorage(app);
        console.log('✅ Firebase Storage initialized');
      }

      console.log('✅ All Firebase services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
      // Reset state on error
      app = null;
      auth = null;
      db = null;
      storage = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  await initializationPromise;
  return { app: app!, auth: auth!, db: db!, storage: storage! };
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

// Export instances (will be null until initialized)
export { auth, db, storage, app };