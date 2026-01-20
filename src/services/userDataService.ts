// src/services/userDataService.ts - ✅ COMPLETE WITH SENTRY TRACKING
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDbInstance } from '../config/firebase';
import { BasketItem, FavoritesState } from '../types';
import { addBreadcrumb, captureError } from '../config/sentry'; // ✅ NEW

/**
 * Sync user favorites to Firestore
 */
export const syncFavoritesToFirestore = async (
  uid: string,
  favorites: FavoritesState
): Promise<void> => {
  try {
    addBreadcrumb('Syncing favorites to Firestore', 'data', {
      subcategoryCount: favorites.subcategoryIds.length,
      storeCount: favorites.storeIds.length,
    });

    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      favorites: {
        subcategoryIds: favorites.subcategoryIds,
        storeIds: favorites.storeIds,
      },
      updatedAt: serverTimestamp(),
    });

    console.log('✅ [userDataService] Favorites synced to Firestore');

    addBreadcrumb('Favorites synced successfully', 'data');
  } catch (error) {
    console.error('❌ [userDataService] Error syncing favorites to Firestore:', error);

    captureError(error as Error, {
      context: 'Sync favorites to Firestore',
      userId: uid,
      subcategoryCount: favorites.subcategoryIds.length,
      storeCount: favorites.storeIds.length,
    });

    throw error;
  }
};

/**
 * Get user favorites from Firestore
 */
export const getFavoritesFromFirestore = async (
  uid: string
): Promise<FavoritesState | null> => {
  try {
    addBreadcrumb('Fetching favorites from Firestore', 'data', { userId: uid });

    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().favorites) {
      const data = userSnap.data().favorites;

      addBreadcrumb('Favorites fetched successfully', 'data', {
        subcategoryCount: data.subcategoryIds?.length || 0,
        storeCount: data.storeIds?.length || 0,
      });

      return {
        subcategoryIds: data.subcategoryIds || [],
        storeIds: data.storeIds || [],
      };
    }

    addBreadcrumb('No favorites found', 'data');
    return null;
  } catch (error) {
    console.error('❌ [userDataService] Error getting favorites from Firestore:', error);

    captureError(error as Error, {
      context: 'Get favorites from Firestore',
      userId: uid,
    });

    return null;
  }
};

/**
 * Sync user basket to Firestore
 */
export const syncBasketToFirestore = async (
  uid: string,
  basketItems: BasketItem[]
): Promise<void> => {
  try {
    addBreadcrumb('Syncing basket to Firestore', 'data', {
      itemCount: basketItems.length,
    });

    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      basket: basketItems,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ [userDataService] Basket synced to Firestore');

    addBreadcrumb('Basket synced successfully', 'data', {
      itemCount: basketItems.length,
    });
  } catch (error) {
    console.error('❌ [userDataService] Error syncing basket to Firestore:', error);

    captureError(error as Error, {
      context: 'Sync basket to Firestore',
      userId: uid,
      itemCount: basketItems.length,
    });

    throw error;
  }
};

/**
 * Get user basket from Firestore
 */
export const getBasketFromFirestore = async (
  uid: string
): Promise<BasketItem[]> => {
  try {
    addBreadcrumb('Fetching basket from Firestore', 'data', { userId: uid });

    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().basket) {
      const basketItems = userSnap.data().basket as BasketItem[];

      addBreadcrumb('Basket fetched successfully', 'data', {
        itemCount: basketItems.length,
      });

      return basketItems;
    }

    addBreadcrumb('No basket items found', 'data');
    return [];
  } catch (error) {
    console.error('❌ [userDataService] Error getting basket from Firestore:', error);

    captureError(error as Error, {
      context: 'Get basket from Firestore',
      userId: uid,
    });

    return [];
  }
};

/**
 * Clear user basket in Firestore
 */
export const clearBasketInFirestore = async (uid: string): Promise<void> => {
  try {
    addBreadcrumb('Clearing basket in Firestore', 'data', { userId: uid });

    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      basket: [],
      updatedAt: serverTimestamp(),
    });

    console.log('✅ [userDataService] Basket cleared in Firestore');

    addBreadcrumb('Basket cleared successfully', 'data');
  } catch (error) {
    console.error('❌ [userDataService] Error clearing basket in Firestore:', error);

    captureError(error as Error, {
      context: 'Clear basket in Firestore',
      userId: uid,
    });

    throw error;
  }
};

// ============================================
// LOCATION & PHONE SYNC FUNCTIONS
// ============================================

/**
 * Sync user location WITH phone number to Firestore
 * FIXED: Handles null values properly and creates document if needed
 */
export const syncLocationToFirestore = async (
  uid: string,
  governorate: string | null,
  city: string | null = null,
  phoneNumber?: string | null
): Promise<void> => {
  try {
    addBreadcrumb('Syncing location to Firestore', 'data', {
      userId: uid,
      governorate,
      city,
      hasPhoneNumber: phoneNumber !== undefined && phoneNumber !== null,
    });

    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    // Check if document exists
    const userSnap = await getDoc(userRef);

    const locationData = {
      governorate: governorate,
      city: city,
    };

    const updateData: any = {
      location: locationData,
      updatedAt: serverTimestamp(),
    };

    // Only update phone if provided (not undefined)
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber;
    }

    if (userSnap.exists()) {
      // Update existing document
      await updateDoc(userRef, updateData);
      console.log('✅ [userDataService] Location updated in Firestore:', locationData);
    } else {
      // Create new document with location
      await setDoc(userRef, {
        ...updateData,
        createdAt: serverTimestamp(),
      });
      console.log('✅ [userDataService] Location created in Firestore:', locationData);
    }

    addBreadcrumb('Location synced successfully', 'data', {
      governorate,
      city,
    });
  } catch (error) {
    console.error('❌ [userDataService] Error syncing location to Firestore:', error);

    captureError(error as Error, {
      context: 'Sync location to Firestore',
      userId: uid,
      governorate,
      city,
    });

    throw error;
  }
};

/**
 * Get user location from Firestore
 */
export const getLocationFromFirestore = async (
  uid: string
): Promise<{ governorate: string | null; city: string | null } | null> => {
  try {
    addBreadcrumb('Fetching location from Firestore', 'data', { userId: uid });

    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().location) {
      const data = userSnap.data().location;

      const location = {
        governorate: data.governorate || null,
        city: data.city || null,
      };

      addBreadcrumb('Location fetched successfully', 'data', {
        governorate: location.governorate,
        city: location.city,
      });

      return location;
    }

    addBreadcrumb('No location found', 'data');
    return null;
  } catch (error) {
    console.error('❌ [userDataService] Error getting location from Firestore:', error);

    captureError(error as Error, {
      context: 'Get location from Firestore',
      userId: uid,
    });

    return null;
  }
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (
  uid: string,
  data: {
    displayName?: string | null;
    phoneNumber?: string | null;
  }
): Promise<void> => {
  try {
    addBreadcrumb('Updating user profile', 'data', {
      userId: uid,
      hasDisplayName: !!data.displayName,
      hasPhoneNumber: !!data.phoneNumber,
    });

    const db = getDbInstance();
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ [userDataService] User profile updated in Firestore');

    addBreadcrumb('User profile updated successfully', 'data');
  } catch (error) {
    console.error('❌ [userDataService] Error updating user profile:', error);

    captureError(error as Error, {
      context: 'Update user profile',
      userId: uid,
    });

    throw error;
  }
};

// ============================================
// COMBINED SYNC FUNCTIONS
// ============================================

/**
 * Sync all user data to Firestore
 */
export const syncAllUserData = async (
  uid: string,
  favorites: FavoritesState,
  basketItems: BasketItem[]
): Promise<void> => {
  try {
    addBreadcrumb('Syncing all user data', 'data', {
      userId: uid,
      favoriteCount: favorites.subcategoryIds.length + favorites.storeIds.length,
      basketCount: basketItems.length,
    });

    await Promise.all([
      syncFavoritesToFirestore(uid, favorites),
      syncBasketToFirestore(uid, basketItems),
    ]);

    console.log('✅ [userDataService] All user data synced to Firestore');

    addBreadcrumb('All user data synced successfully', 'data');
  } catch (error) {
    console.error('❌ [userDataService] Error syncing all user data:', error);

    captureError(error as Error, {
      context: 'Sync all user data',
      userId: uid,
    });

    throw error;
  }
};

/**
 * Get all user data from Firestore
 */
export const getAllUserData = async (
  uid: string
): Promise<{ favorites: FavoritesState | null; basket: BasketItem[] }> => {
  try {
    addBreadcrumb('Fetching all user data', 'data', { userId: uid });

    const [favorites, basket] = await Promise.all([
      getFavoritesFromFirestore(uid),
      getBasketFromFirestore(uid),
    ]);

    addBreadcrumb('All user data fetched successfully', 'data', {
      hasFavorites: !!favorites,
      basketCount: basket.length,
    });

    return { favorites, basket };
  } catch (error) {
    console.error('❌ [userDataService] Error getting all user data:', error);

    captureError(error as Error, {
      context: 'Get all user data',
      userId: uid,
    });

    return {
      favorites: null,
      basket: [],
    };
  }
};