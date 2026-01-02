// src/services/userDataService.ts
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
        storeIds: favorites.storeIds,
        offerIds: favorites.offerIds,
      },
      updatedAt: serverTimestamp(),
    });

    console.log('Favorites synced to Firestore');
  } catch (error) {
    console.error('Error syncing favorites to Firestore:', error);
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
        storeIds: data.storeIds || [],
        offerIds: data.offerIds || [],
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting favorites from Firestore:', error);
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

    console.log('Basket synced to Firestore');
  } catch (error) {
    console.error('Error syncing basket to Firestore:', error);
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
    console.error('Error getting basket from Firestore:', error);
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

    console.log('Basket cleared in Firestore');
  } catch (error) {
    console.error('Error clearing basket in Firestore:', error);
    throw error;
  }
};

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

    console.log('All user data synced to Firestore');
  } catch (error) {
    console.error('Error syncing all user data:', error);
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
    console.error('Error getting all user data:', error);
    return {
      favorites: null,
      basket: [],
    };
  }
};
