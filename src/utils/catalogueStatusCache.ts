// src/utils/catalogueStatusCache.ts - Cached catalogue status calculation

type CatalogueStatus = 'active' | 'upcoming' | 'expired';

interface CacheEntry {
  status: CatalogueStatus;
  expiry: number;
}

// Cache status calculations for 1 minute
const CACHE_TTL = 60 * 1000;
const statusCache = new Map<string, CacheEntry>();

/**
 * Normalize date string to YYYY-MM-DD format
 */
const normalizeDate = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1]. padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

/**
 * Calculate catalogue status (internal)
 */
const calculateStatus = (startDate: string, endDate: string): CatalogueStatus => {
  try {
    const now = new Date();
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    const start = new Date(normalizedStart);
    const end = new Date(normalizedEnd);

    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('❌ Invalid date format:', { startDate, endDate });
      return 'expired';
    }

    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  } catch (error) {
    console.error('❌ Error calculating catalogue status:', error);
    return 'expired';
  }
};

/**
 * Get catalogue status with caching
 * Caches results for 1 minute to avoid recalculating on every render
 */
export const getCatalogueStatusCached = (
  catalogueId: string,
  startDate: string,
  endDate:  string
): CatalogueStatus => {
  const cacheKey = `${catalogueId}_${startDate}_${endDate}`;
  const cached = statusCache. get(cacheKey);
  const now = Date.now();

  // Return cached value if still valid
  if (cached && cached.expiry > now) {
    return cached. status;
  }

  // Calculate and cache
  const status = calculateStatus(startDate, endDate);
  statusCache. set(cacheKey, { status, expiry:  now + CACHE_TTL });

  return status;
};

/**
 * Clear the status cache
 * Call this on refresh or when date changes
 */
export const clearStatusCache = (): void => {
  statusCache.clear();
  console.log('🧹 Catalogue status cache cleared');
};

/**
 * Get cache stats for debugging
 */
export const getStatusCacheStats = (): { size: number; keys: string[] } => {
  return {
    size:  statusCache.size,
    keys: Array.from(statusCache.keys()),
  };
};

export default {
  getCatalogueStatusCached,
  clearStatusCache,
  getStatusCacheStats,
};