// src/services/cacheService.ts - UPDATED WITH NEW CACHE KEYS
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number; // Track cache hits
}

interface CacheStats {
  hits: number;
  misses: number;
  invalidations: number;
  totalReads: number;
}

export const CACHE_KEYS = {
  // Offers
  OFFERS_ALL: 'cache_offers_all',
  OFFERS_ACTIVE: 'cache_offers_active',
  OFFERS_STATS: 'cache_offers_stats',

  // Catalogues
  CATALOGUES: 'cache_catalogues',
  CATALOGUES_ACTIVE: 'cache_catalogues_active',

  // User-specific (should be invalidated on sign-out)
  USER_FAVORITES: 'cache_user_favorites',
  USER_BASKET: 'cache_user_basket',

  // Search
  SEARCH_RESULTS: 'cache_search_results',
} as const;

// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  OFFERS: 10 * 60 * 1000,        // 10 minutes
  CATALOGUES: 15 * 60 * 1000,    // 15 minutes
  STATS: 5 * 60 * 1000,          // 5 minutes
  USER_DATA: 5 * 60 * 1000,      // 5 minutes
  SEARCH: 5 * 60 * 1000,         // 5 minutes
} as const;

class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    totalReads: 0,
  };

  /**
   * Set cache with automatic expiration
   */
  async set<T>(key: string, data: T, durationMs: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + durationMs,
        hits: 0,
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
      console.log(`💾 Cache SET: ${key} (expires in ${(durationMs / 60000).toFixed(1)}min)`);
    } catch (error) {
      console.error(`❌ Cache SET error for ${key}:`, error);
    }
  }

  /**
   * Get cache if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    this.stats.totalReads++;

    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) {
        this.stats.misses++;
        console.log(`📦 Cache MISS: ${key} (not found)`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      if (now > entry.expiresAt) {
        this.stats.misses++;
        const ageMin = ((now - entry.timestamp) / 60000).toFixed(1);
        console.log(`📦 Cache EXPIRED: ${key} (age: ${ageMin}min)`);
        await AsyncStorage.removeItem(key);
        return null;
      }

      // Update hit count
      entry.hits++;
      await AsyncStorage.setItem(key, JSON.stringify(entry));

      this.stats.hits++;
      const ageMin = ((now - entry.timestamp) / 60000).toFixed(1);
      const ttlMin = ((entry.expiresAt - now) / 60000).toFixed(1);
      console.log(`📦 Cache HIT: ${key} (age: ${ageMin}min, ttl: ${ttlMin}min, hits: ${entry.hits})`);

      return entry.data;
    } catch (error) {
      this.stats.misses++;
      console.error(`❌ Cache GET error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Invalidate (clear) specific cache
   */
  async invalidate(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      this.stats.invalidations++;
      console.log(`🗑️ Cache INVALIDATED: ${key}`);
    } catch (error) {
      console.error(`❌ Cache INVALIDATE error for ${key}:`, error);
    }
  }

  /**
   * Invalidate multiple caches at once
   */
  async invalidateMultiple(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.invalidate(key)));
    console.log(`🗑️ Invalidated ${keys.length} caches`);
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS);
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
      this.stats.invalidations += keys.length;
      console.log('🗑️ All caches cleared');
    } catch (error) {
      console.error('❌ Error clearing all caches:', error);
    }
  }

  /**
   * Clear user-specific caches (call on sign-out)
   */
  async clearUserCaches(): Promise<void> {
    const userKeys = [
      CACHE_KEYS.USER_FAVORITES,
      CACHE_KEYS.USER_BASKET,
    ];
    await this.invalidateMultiple(userKeys);
    console.log('🗑️ User caches cleared');
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup(): Promise<number> {
    try {
      const keys = Object.values(CACHE_KEYS);
      const now = Date.now();
      let cleaned = 0;

      for (const key of keys) {
        try {
          const item = await AsyncStorage.getItem(key);
          if (item) {
            const entry: CacheEntry<any> = JSON.parse(item);
            if (now > entry.expiresAt) {
              await AsyncStorage.removeItem(key);
              cleaned++;
            }
          }
        } catch {
          // Skip invalid entries
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
      }

      return cleaned;
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: string } {
    const hitRate = this.stats.totalReads > 0
      ? (this.stats.hits / this.stats.totalReads * 100).toFixed(1)
      : '0.0';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      totalReads: 0,
    };
    console.log('📊 Cache statistics reset');
  }

  /**
   * Get cache info for debugging
   */
  async getCacheInfo(): Promise<{
    key: string;
    size: number;
    ageMin: number;
    ttlMin: number;
    hits: number;
    expired: boolean;
  }[]> {
    const info: any[] = [];
    const now = Date.now();

    for (const key of Object.values(CACHE_KEYS)) {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const entry: CacheEntry<any> = JSON.parse(item);
          info.push({
            key,
            size: new Blob([item]).size,
            ageMin: ((now - entry.timestamp) / 60000).toFixed(1),
            ttlMin: ((entry.expiresAt - now) / 60000).toFixed(1),
            hits: entry.hits || 0,
            expired: now > entry.expiresAt,
          });
        }
      } catch (error) {
        // Skip invalid entries
      }
    }

    return info;
  }

  /**
   * Prewarm cache - fetch and cache data proactively
   */
  async prewarm(
    fetchFn: () => Promise<any>,
    cacheKey: string,
    duration: number
  ): Promise<void> {
    try {
      console.log(`🔥 Prewarming cache: ${cacheKey}`);
      const data = await fetchFn();
      await this.set(cacheKey, data, duration);
      console.log(`✅ Cache prewarmed: ${cacheKey}`);
    } catch (error) {
      console.error(`❌ Prewarm failed for ${cacheKey}:`, error);
    }
  }

  /**
   * Log detailed cache statistics
   */
  async logDetailedStats(): Promise<void> {
    console.log('\n📊 ===== CACHE STATISTICS =====');

    const stats = this.getStats();
    console.log('Overall Stats:');
    console.log(`  Total Reads: ${stats.totalReads}`);
    console.log(`  Hits: ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Hit Rate: ${stats.hitRate}`);
    console.log(`  Invalidations: ${stats.invalidations}`);

    const cacheInfo = await this.getCacheInfo();
    console.log('\nCache Details:');
    for (const info of cacheInfo) {
      const status = info.expired ? '❌ EXPIRED' : '✅ VALID';
      console.log(`  ${status} ${info.key}:`);
      console.log(`    Age: ${info.ageMin}min, TTL: ${info.ttlMin}min`);
      console.log(`    Size: ${(info.size / 1024).toFixed(2)} KB, Hits: ${info.hits}`);
    }
    console.log('===========================\n');
  }
}

export const cacheService = new CacheService();

// Export singleton instance
export default cacheService;