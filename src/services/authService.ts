// src/services/authService.ts - PRODUCTION READY WITH WHITELIST
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthInstance, getDbInstance } from '../config/firebase';
import { UserProfile } from '../types';

// ============================================
// ADMIN CONFIGURATION - PRODUCTION READY
// ============================================

/**
 * ADMIN WHITELIST
 * ONLY these specific emails will have admin access
 * All other users will be regular users with NO admin privileges
 */
const ADMIN_EMAILS = [
  'aliattia2@gmail.com',
  'aliattia02@gmail.com',
  'asmaahassan9496@gmail.com',
  'aliattia2de@gmail.com'
];

/**
 * Check if an email should have admin access
 * Returns true ONLY if email is in the ADMIN_EMAILS whitelist
 */
const isAdminEmail = (email: string | null): boolean => {
  if (!email) return false;

  const emailLower = email.toLowerCase().trim();

  // Check exact match in whitelist
  return ADMIN_EMAILS.some(adminEmail =>
    adminEmail.toLowerCase().trim() === emailLower
  );
};

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign in with Google using ID token and/or Access token
 */
export const signInWithGoogleToken = async (
  idToken: string | null,
  accessToken: string | null
): Promise<UserProfile | null> => {
  try {
    const auth = getAuthInstance();

    console.log('=== AUTH SERVICE ===');
    console.log('Signing in...');

    if (!idToken && !accessToken) {
      throw new Error('No authentication token provided');
    }

    // Create Firebase credential
    const credential = GoogleAuthProvider.credential(idToken, accessToken);

    // Sign in to Firebase
    const userCredential: UserCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    console.log('✅ Firebase sign-in successful:', user.email);

    // Wait for Firestore to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get or create user profile
    const userProfile = await getOrCreateUserProfile(user);

    // Log admin status
    if (userProfile.isAdmin) {
      console.log('⭐ Admin user logged in:', user.email);
    } else {
      console.log('👤 Regular user logged in:', user.email);
    }

    return userProfile;
  } catch (error: any) {
    console.error('❌ Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const auth = getAuthInstance();
    await firebaseSignOut(auth);
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
};

/**
 * Get or create user profile in Firestore
 * Admin status is ONLY granted to emails in ADMIN_EMAILS whitelist
 */
export const getOrCreateUserProfile = async (
  user: FirebaseUser
): Promise<UserProfile> => {
  const maxRetries = 5;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${maxRetries}: Getting user profile`);

      const db = getDbInstance();
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // Determine admin status based on email whitelist
      const shouldBeAdmin = isAdminEmail(user.email);

      if (userSnap.exists()) {
        console.log('✅ User profile found');

        const userData = userSnap.data();

        // Update last login and sync admin status
        const updateData: any = {
          lastLoginAt: serverTimestamp()
        };

        // Sync admin status with whitelist
        if (shouldBeAdmin !== userData.isAdmin) {
          updateData.isAdmin = shouldBeAdmin;

          if (shouldBeAdmin) {
            console.log('⭐ User promoted to admin (whitelist match)');
          } else {
            console.log('⚠️ Admin privileges removed (not in whitelist)');
          }
        }

        await setDoc(userRef, updateData, { merge: true });

        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: shouldBeAdmin, // Always use whitelist status
          createdAt: userData.createdAt,
          lastLoginAt: serverTimestamp(),
        };
      } else {
        console.log('📝 Creating new user profile');

        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: shouldBeAdmin, // Set admin status based on whitelist
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };

        await setDoc(userRef, newProfile);

        if (shouldBeAdmin) {
          console.log('⭐ New admin user created');
        } else {
          console.log('✅ New regular user created');
        }

        return newProfile;
      }
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to get/create user profile');
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      // Always verify admin status against whitelist
      const shouldBeAdmin = isAdminEmail(userData.email);

      return {
        uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        isAdmin: shouldBeAdmin, // Use whitelist, not stored value
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback: (user: UserProfile | null) => void) => {
  const auth = getAuthInstance();

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        callback(userProfile);
      } catch (error) {
        console.error('❌ Error in auth change listener:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Check if current user is admin (utility function)
 */
export const checkIsAdmin = (email: string | null): boolean => {
  return isAdminEmail(email);
};