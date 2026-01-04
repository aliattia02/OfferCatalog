// src/services/authService.ts
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

/**
 * Sign in with Google using ID token and/or Access token
 */
export const signInWithGoogleToken = async (
  idToken: string | null,
  accessToken: string | null
): Promise<UserProfile | null> => {
  try {
    const auth = getAuthInstance();

    console.log('=== AUTH SERVICE DEBUG ===');
    console.log('ID Token:', idToken ?  'present' : 'null');
    console.log('Access Token:', accessToken ? 'present' : 'null');

    if (!idToken && !accessToken) {
      throw new Error('No authentication token provided');
    }

    // Create Firebase credential
    const credential = GoogleAuthProvider.credential(idToken, accessToken);

    // Sign in to Firebase
    const userCredential: UserCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    console.log('✅ Firebase sign-in successful:', user. email);

    // Wait a bit for Firestore to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get or create user profile
    const userProfile = await getOrCreateUserProfile(user);

    return userProfile;
  } catch (error:  any) {
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
 */
export const getOrCreateUserProfile = async (
  user: FirebaseUser
): Promise<UserProfile> => {
  const maxRetries = 5;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${maxRetries}:  Getting user profile`);

      const db = getDbInstance();
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log('✅ User profile found');

        // Update last login
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });

        const userData = userSnap.data();
        return {
          uid:  user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: userData. isAdmin || false,
          createdAt:  userData.createdAt,
          lastLoginAt: serverTimestamp(),
        };
      } else {
        console.log('📝 Creating new user profile');

        const newProfile:  UserProfile = {
          uid:  user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: false,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };

        await setDoc(userRef, newProfile);
        console.log('✅ User profile created');

        return newProfile;
      }
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
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
export const getUserProfile = async (uid:  string): Promise<UserProfile | null> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap. exists()) {
      const userData = userSnap.data();
      return {
        uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        isAdmin: userData.isAdmin || false,
        createdAt: userData. createdAt,
        lastLoginAt: userData.lastLoginAt,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null; // Don't throw, just return null
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