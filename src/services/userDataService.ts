// src/services/userDataService.ts - ✅ UPDATED WITH LOCATION SYNC
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getDbInstance } from '../config/firebase';
import { BasketItem, FavoritesState } from '../types';

/**
 * Sync user favorites to Firestore
 * @param uid User ID
 * @param favorites Favorites state
 */
export const syncFavoritesToFirestore = async (
  uid: string,
  favorites: FavoritesState
): Promise<void> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      favorites: {
        subcategoryIds: favorites.subcategoryIds,
        storeIds: favorites.storeIds,
      },
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Favorites synced to Firestore');
  } catch (error) {
    console.error('❌ Error syncing favorites to Firestore:', error);
    throw error;
  }
};

/**
 * Get user favorites from Firestore
 * @param uid User ID
 * @returns FavoritesState or null
 */
export const getFavoritesFromFirestore = async (
  uid: string
): Promise<FavoritesState | null> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().favorites) {
      const data = userSnap.data().favorites;
      return {
        subcategoryIds: data.subcategoryIds || [],
        storeIds: data.storeIds || [],
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting favorites from Firestore:', error);
    return null;
  }
};

/**
 * Sync user basket to Firestore
 * @param uid User ID
 * @param basketItems Basket items
 */
export const syncBasketToFirestore = async (
  uid: string,
  basketItems: BasketItem[]
): Promise<void> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      basket: basketItems,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Basket synced to Firestore');
  } catch (error) {
    console.error('❌ Error syncing basket to Firestore:', error);
    throw error;
  }
};

/**
 * Get user basket from Firestore
 * @param uid User ID
 * @returns Array of BasketItems or empty array
 */
export const getBasketFromFirestore = async (
  uid: string
): Promise<BasketItem[]> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().basket) {
      return userSnap.data().basket as BasketItem[];
    }

    return [];
  } catch (error) {
    console.error('❌ Error getting basket from Firestore:', error);
    return [];
  }
};

/**
 * Clear user basket in Firestore
 * @param uid User ID
 */
export const clearBasketInFirestore = async (uid: string): Promise<void> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      basket: [],
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Basket cleared in Firestore');
  } catch (error) {
    console.error('❌ Error clearing basket in Firestore:', error);
    throw error;
  }
};

// ============================================
// ✅ NEW: LOCATION SYNC FUNCTIONS
// ============================================

/**
 * Sync user location to Firestore
 * @param uid User ID
 * @param governorate Governorate ID
 * @param city City ID (optional)
 */
export const syncLocationToFirestore = async (
  uid: string,
  governorate: string | null,
  city: string | null = null
): Promise<void> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      location: {
        governorate,
        city,
      },
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Location synced to Firestore:', { governorate, city });
  } catch (error) {
    console.error('❌ Error syncing location to Firestore:', error);
    throw error;
  }
};

/**
 * Get user location from Firestore
 * @param uid User ID
 * @returns Location object or null
 */
export const getLocationFromFirestore = async (
  uid: string
): Promise<{ governorate: string | null; city: string | null } | null> => {
  try {
    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().location) {
      const data = userSnap.data().location;
      return {
        governorate: data.governorate || null,
        city: data.city || null,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting location from Firestore:', error);
    return null;
  }
};

// ============================================
// COMBINED SYNC FUNCTIONS
// ============================================

/**
 * Sync all user data to Firestore
 * @param uid User ID
 * @param favorites Favorites state
 * @param basketItems Basket items
 */
export const syncAllUserData = async (
  uid: string,
  favorites: FavoritesState,
  basketItems: BasketItem[]
): Promise<void> => {
  try {
    await Promise.all([
      syncFavoritesToFirestore(uid, favorites),
      syncBasketToFirestore(uid, basketItems),
    ]);

    console.log('✅ All user data synced to Firestore');
  } catch (error) {
    console.error('❌ Error syncing all user data:', error);
    throw error;
  }
};

/**
 * Get all user data from Firestore
 * @param uid User ID
 * @returns Object containing favorites and basket
 */
export const getAllUserData = async (
  uid: string
): Promise<{ favorites: FavoritesState | null; basket: BasketItem[] }> => {
  try {
    const [favorites, basket] = await Promise.all([
      getFavoritesFromFirestore(uid),
      getBasketFromFirestore(uid),
    ]);

    return { favorites, basket };
  } catch (error) {
    console.error('❌ Error getting all user data:', error);
    return {
      favorites: null,
      basket: [],
    };
  }
};