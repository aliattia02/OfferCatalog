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
 * @param idToken Google ID token (optional)
 * @param accessToken Google Access token (optional)
 * @returns UserProfile or null if sign-in failed
 */
export const signInWithGoogleToken = async (
  idToken:  string | null,
  accessToken:  string | null
): Promise<UserProfile | null> => {
  try {
    const auth = getAuthInstance();

    console.log('=== AUTH SERVICE DEBUG ===');
    console.log('ID Token:', idToken ?  'present' : 'null');
    console.log('Access Token:', accessToken ? 'present' : 'null');

    if (! idToken && !accessToken) {
      throw new Error('No authentication token provided');
    }

    // Create Firebase credential - GoogleAuthProvider. credential accepts both
    // credential(idToken, accessToken) - either can be null but not both
    const credential = GoogleAuthProvider.credential(idToken, accessToken);

    // Sign in to Firebase
    const userCredential:  UserCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    console.log('Firebase sign-in successful:', user. email);

    // Get or create user profile in Firestore
    const userProfile = await getOrCreateUserProfile(user);

    return userProfile;
  } catch (error) {
    console.error('Error signing in with Google:', error);
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
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get or create user profile in Firestore
 * @param user Firebase User object
 * @returns UserProfile
 */
export const getOrCreateUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update last login time
      await setDoc(
        userRef,
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: userSnap.data().isAdmin || false,
        createdAt: userSnap.data().createdAt,
        lastLoginAt: serverTimestamp(),
      };
    } else {
      // Create new user profile
      const newProfile: UserProfile = {
        uid: user.uid,
        email:  user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    console. error('Error getting or creating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 * @param uid User ID
 * @returns UserProfile or null
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid,
        email: data.email,
        displayName: data. displayName,
        photoURL: data. photoURL,
        isAdmin: data. isAdmin || false,
        createdAt: data. createdAt,
        lastLoginAt:  data.lastLoginAt,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Listen to auth state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthChange = (
  callback: (user: UserProfile | null) => void
): (() => void) => {
  const auth = getAuthInstance();

  return onAuthStateChanged(auth, async (user:  FirebaseUser | null) => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      callback(profile);
    } else {
      callback(null);
    }
  });
};

/**
 * Check if user is admin
 * @param uid User ID
 * @returns true if user is admin
 */
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(uid);
    return profile?. isAdmin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};