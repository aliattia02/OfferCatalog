// src/services/catalogueService.ts - ✅ COMPLETE WITH SENTRY TRACKING
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from './cacheService';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Catalogue } from '../types';
import { addBreadcrumb, captureError } from '../config/sentry'; // ✅ NEW

/**
 * Get all catalogues - CACHED
 * @param forceRefresh - Force fetch from Firebase
 * @returns Array of catalogues
 */
export async function getAllCatalogues(
  forceRefresh: boolean = false
): Promise<Catalogue[]> {
  return cacheService.fetchWithDeduplication(
    'get_all_catalogues',
    async () => {
      try {
        console.log('🔥 Firebase: Fetching all catalogues (limit: 50)...');

        // ✅ Track catalogue fetch attempt
        addBreadcrumb('Fetching catalogues from Firestore', 'data', {
          forceRefresh,
          timestamp: new Date().toISOString(),
        });

        const cataloguesRef = collection(db, 'catalogues');
        const q = query(
          cataloguesRef,
          orderBy('startDate', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);

        const catalogues: Catalogue[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Catalogue));

        console.log(`✅ Fetched ${catalogues.length} catalogues`);

        // ✅ Track successful fetch
        addBreadcrumb('Catalogues fetched successfully', 'data', {
          count: catalogues.length,
          forceRefresh,
        });

        return catalogues;
      } catch (error) {
        console.error('❌ Error fetching catalogues:', error);

        // ✅ Report catalogue fetch errors
        captureError(error as Error, {
          context: 'Fetching all catalogues',
          forceRefresh,
          operation: 'getAllCatalogues',
        });

        throw error;
      }
    },
    forceRefresh ? undefined : CACHE_KEYS.CATALOGUES,
    CACHE_DURATIONS.CATALOGUES
  );
}

/**
 * Get active catalogues - CACHED
 * Filters catalogues where endDate >= today
 */
export async function getActiveCatalogues(
  forceRefresh: boolean = false
): Promise<Catalogue[]> {
  try {
    addBreadcrumb('Filtering active catalogues', 'data');

    const allCatalogues = await getAllCatalogues(forceRefresh);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeCatalogues = allCatalogues.filter(catalogue => {
      const endDate = new Date(catalogue.endDate);
      endDate.setHours(23, 59, 59, 999);
      return endDate >= today;
    });

    addBreadcrumb('Active catalogues filtered', 'data', {
      total: allCatalogues.length,
      active: activeCatalogues.length,
    });

    return activeCatalogues;
  } catch (error) {
    console.error('❌ Error getting active catalogues:', error);

    captureError(error as Error, {
      context: 'Get active catalogues',
      forceRefresh,
    });

    throw error;
  }
}

/**
 * Get catalogue by ID from cache or Firebase
 */
export async function getCatalogueById(
  catalogueId: string,
  forceRefresh: boolean = false
): Promise<Catalogue | null> {
  try {
    addBreadcrumb('Fetching catalogue by ID', 'data', { catalogueId });

    const catalogues = await getAllCatalogues(forceRefresh);
    const catalogue = catalogues.find(c => c.id === catalogueId) || null;

    if (catalogue) {
      addBreadcrumb('Catalogue found', 'data', {
        catalogueId,
        title: catalogue.titleAr,
      });
    } else {
      addBreadcrumb('Catalogue not found', 'data', { catalogueId });
    }

    return catalogue;
  } catch (error) {
    console.error('❌ Error getting catalogue by ID:', error);

    captureError(error as Error, {
      context: 'Get catalogue by ID',
      catalogueId,
      forceRefresh,
    });

    return null;
  }
}

/**
 * Get catalogues by store - filters from cache
 */
export async function getCataloguesByStore(
  storeId: string,
  forceRefresh: boolean = false
): Promise<Catalogue[]> {
  try {
    addBreadcrumb('Fetching catalogues by store', 'data', { storeId });

    const catalogues = await getAllCatalogues(forceRefresh);
    const storeCatalogues = catalogues.filter(c => c.storeId === storeId);

    addBreadcrumb('Store catalogues filtered', 'data', {
      storeId,
      count: storeCatalogues.length,
    });

    return storeCatalogues;
  } catch (error) {
    console.error('❌ Error getting catalogues by store:', error);

    captureError(error as Error, {
      context: 'Get catalogues by store',
      storeId,
      forceRefresh,
    });

    throw error;
  }
}

/**
 * Get catalogues by category - filters from cache
 */
export async function getCataloguesByCategory(
  categoryId: string,
  forceRefresh: boolean = false
): Promise<Catalogue[]> {
  try {
    addBreadcrumb('Fetching catalogues by category', 'data', { categoryId });

    const catalogues = await getAllCatalogues(forceRefresh);
    const categoryCatalogues = catalogues.filter(c => c.categoryId === categoryId);

    addBreadcrumb('Category catalogues filtered', 'data', {
      categoryId,
      count: categoryCatalogues.length,
    });

    return categoryCatalogues;
  } catch (error) {
    console.error('❌ Error getting catalogues by category:', error);

    captureError(error as Error, {
      context: 'Get catalogues by category',
      categoryId,
      forceRefresh,
    });

    throw error;
  }
}

/**
 * Invalidate catalogue cache
 * Call this after creating/updating/deleting catalogues
 */
export async function invalidateCatalogueCache(): Promise<void> {
  try {
    await cacheService.invalidate(CACHE_KEYS.CATALOGUES);
    console.log('🗑️ Catalogue cache invalidated');

    addBreadcrumb('Catalogue cache invalidated', 'cache');
  } catch (error) {
    console.error('❌ Error invalidating catalogue cache:', error);

    captureError(error as Error, {
      context: 'Invalidate catalogue cache',
    });
  }
}

/**
 * Prefetch catalogues in background
 * Useful for app initialization
 */
export async function prefetchCatalogues(): Promise<void> {
  try {
    addBreadcrumb('Starting catalogue prefetch', 'data');

    await getAllCatalogues(true);

    console.log('✅ Catalogues prefetched successfully');

    addBreadcrumb('Catalogues prefetched successfully', 'data');
  } catch (error) {
    console.error('❌ Error prefetching catalogues:', error);

    // Don't report prefetch errors as they're not critical
    // Just log them
    addBreadcrumb('Catalogue prefetch failed', 'data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}