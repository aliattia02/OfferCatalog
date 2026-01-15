// src/services/catalogueService.ts - CATALOGUE CACHING SERVICE
import { cacheService, CACHE_KEYS, CACHE_DURATIONS } from './cacheService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Catalogue } from '../types';

/**
 * Get all catalogues - CACHED
 * @param forceRefresh - Force fetch from Firebase
 * @returns Array of catalogues
 */
export async function getAllCatalogues(
  forceRefresh: boolean = false
): Promise<Catalogue[]> {
  // Try cache first
  if (!forceRefresh) {
    const cached = await cacheService.get<Catalogue[]>(CACHE_KEYS.CATALOGUES);
    if (cached) {
      console.log(`📦 Using cached catalogues (${cached.length} items)`);
      return cached;
    }
  }

  console.log('🔥 Firebase: Fetching all catalogues...');
  
  try {
    const cataloguesRef = collection(db, 'catalogues');
    const q = query(cataloguesRef, orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    
    const catalogues: Catalogue[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Catalogue));

    // Cache the result
    await cacheService.set(
      CACHE_KEYS.CATALOGUES,
      catalogues,
      CACHE_DURATIONS.CATALOGUES
    );

    console.log(`✅ Fetched and cached ${catalogues.length} catalogues`);
    return catalogues;
  } catch (error) {
    console.error('❌ Error fetching catalogues:', error);
    throw error;
  }
}

/**
 * Get active catalogues - CACHED
 * Filters catalogues where endDate >= today
 */
export async function getActiveCatalogues(
  forceRefresh: boolean = false
): Promise<Catalogue[]> {
  const allCatalogues = await getAllCatalogues(forceRefresh);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return allCatalogues.filter(catalogue => {
    const endDate = new Date(catalogue.endDate);
    endDate.setHours(23, 59, 59, 999);
    return endDate >= today;
  });
}

/**
 * Get catalogue by ID from cache or Firebase
 */
export async function getCatalogueById(
  catalogueId: string,
  forceRefresh: boolean = false
): Promise<Catalogue | null> {
  const catalogues = await getAllCatalogues(forceRefresh);
  return catalogues.find(c => c.id === catalogueId) || null;
}

/**
 * Get catalogues by store - filters from cache
 */
export async function getCataloguesByStore(
  storeId: string,
  forceRefresh: boolean = false
): Promise<Catalogue[]> {
  const catalogues = await getAllCatalogues(forceRefresh);
  return catalogues.filter(c => c.storeId === storeId);
}

/**
 * Get catalogues by category - filters from cache
 */
export async function getCataloguesByCategory(
  categoryId: string,
  forceRefresh: boolean = false
): Promise<Catalogue[]> {
  const catalogues = await getAllCatalogues(forceRefresh);
  return catalogues.filter(c => c.categoryId === categoryId);
}

/**
 * Invalidate catalogue cache
 * Call this after creating/updating/deleting catalogues
 */
export async function invalidateCatalogueCache(): Promise<void> {
  await cacheService.invalidate(CACHE_KEYS.CATALOGUES);
  console.log('🗑️ Catalogue cache invalidated');
}

/**
 * Prefetch catalogues in background
 * Useful for app initialization
 */
export async function prefetchCatalogues(): Promise<void> {
  try {
    await getAllCatalogues(true);
    console.log('✅ Catalogues prefetched successfully');
  } catch (error) {
    console.error('❌ Error prefetching catalogues:', error);
  }
}