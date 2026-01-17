// src/utils/catalogueStatusCache.ts
import { getCatalogueStatus, CatalogueStatus } from './catalogueUtils';

interface CacheEntry {
  status: CatalogueStatus;
  expiry: number;
}

/**
 * Cache for catalogue status calculations
 * Reduces unnecessary Date object creation on every render
 */
class CatalogueStatusCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 60000; // 1 minute

  /**
   * Get cached status or calculate and cache it
   */
  getCachedStatus(catalogueId: string, startDate: string, endDate: string): CatalogueStatus {
    const cacheKey = `${catalogueId}_${startDate}_${endDate}`;
    const cached = this.cache.get(cacheKey);

    // Return cached value if still valid
    if (cached && cached.expiry > Date.now()) {
      return cached.status;
    }

    // Calculate new status
    const status = getCatalogueStatus(startDate, endDate);

    // Cache it
    this.cache.set(cacheKey, {
      status,
      expiry: Date.now() + this.CACHE_DURATION,
    });

    // Clean old entries periodically (every 100 calculations)
    if (this.cache.size > 100) {
      this.cleanExpiredEntries();
    }

    return status;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiry > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }
}

// Export singleton instance
export const catalogueStatusCache = new CatalogueStatusCache();

/**
 * Helper function to get cached catalogue status
 */
export const getCatalogueStatusCached = (
  catalogueId: string,
  startDate: string,
  endDate: string
): CatalogueStatus => {
  return catalogueStatusCache.getCachedStatus(catalogueId, startDate, endDate);
};

export default catalogueStatusCache;
