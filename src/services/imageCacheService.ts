// src/services/imageCacheService.ts - PERFORMANCE OPTIMIZED
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface CachedImage {
  url: string;
  localPath: string;
  cachedAt: number;
  size: number;
  priority: 'high' | 'normal' | 'low';
}

const CACHE_DIR_NAME = 'image-cache';
const CACHE_METADATA_KEY = '@image_cache_metadata';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB (increased from 50MB)
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

class ImageCacheService {
  private metadata: Map<string, CachedImage> = new Map();
  private initialized = false;
  private cacheDir: string | null = null;
  private isWebPlatform = Platform.OS === 'web';
  private cacheSupported = false;

  // ✅ NEW: Track in-flight downloads to prevent duplicates
  private downloadingUrls = new Map<string, Promise<string>>();

  // ✅ NEW: Memory cache for instant lookups
  private memoryCache = new Map<string, string>();
  private maxMemoryCacheSize = 50; // Keep 50 recent lookups in memory

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      if (this.isWebPlatform || !FileSystem.documentDirectory) {
        console.warn('⚠️ Image cache: FileSystem not available, caching disabled (platform: web)');
        this.cacheSupported = false;
        this.initialized = true;
        return;
      }

      this.cacheSupported = true;
      this.cacheDir = `${FileSystem.documentDirectory}${CACHE_DIR_NAME}/`;

      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
        console.log('📁 Created image cache directory:', this.cacheDir);
      }

      // Load metadata
      const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (metadataJson) {
        const metadataArray: CachedImage[] = JSON.parse(metadataJson);
        this.metadata = new Map(metadataArray.map(item => [item.url, item]));
        console.log(`📦 Loaded ${this.metadata.size} cached images`);
      }

      this.initialized = true;

      // Clean up expired cache in background (non-blocking)
      setTimeout(() => this.cleanupExpiredCache(), 1000);
    } catch (error) {
      console.error('❌ Failed to initialize image cache:', error);
      this.cacheSupported = false;
      this.initialized = true;
    }
  }

  /**
   * ✅ OPTIMIZED: Get cached image with memory cache and deduplication
   */
  async getCachedImage(
    url: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    try {
      await this.init();

      if (!this.cacheSupported) {
        return url;
      }

      // ✅ Check memory cache first (instant lookup)
      const memCached = this.memoryCache.get(url);
      if (memCached) {
        return memCached;
      }

      // ✅ Check if already downloading this URL
      const existingDownload = this.downloadingUrls.get(url);
      if (existingDownload) {
        return await existingDownload;
      }

      // Check if already cached on disk
      const cached = this.metadata.get(url);
      if (cached) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(cached.localPath);
          if (fileInfo.exists) {
            // Check if expired
            if (Date.now() - cached.cachedAt < CACHE_DURATION) {
              this.addToMemoryCache(url, cached.localPath);
              return cached.localPath;
            } else {
              await this.removeFromCache(url);
            }
          }
        } catch (error) {
          console.error('Error checking cached file:', error);
        }
      }

      // Download and cache (with deduplication)
      const downloadPromise = this.downloadAndCache(url, priority);
      this.downloadingUrls.set(url, downloadPromise);

      try {
        const result = await downloadPromise;
        this.addToMemoryCache(url, result);
        return result;
      } finally {
        this.downloadingUrls.delete(url);
      }
    } catch (error) {
      console.error('❌ Image cache error:', error);
      return url;
    }
  }

  /**
   * ✅ NEW: Memory cache management
   */
  private addToMemoryCache(url: string, path: string): void {
    // LRU eviction: remove oldest entry if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    this.memoryCache.set(url, path);
  }

  /**
   * ✅ OPTIMIZED: Download with better error handling
   */
  private async downloadAndCache(
    url: string,
    priority: 'high' | 'normal' | 'low'
  ): Promise<string> {
    if (!this.cacheSupported || !this.cacheDir) {
      return url;
    }

    try {
      const filename = this.getFilenameFromUrl(url);
      const localPath = `${this.cacheDir}${filename}`;

      // Check if file already exists (race condition protection)
      const existingFile = await FileSystem.getInfoAsync(localPath);
      if (existingFile.exists) {
        return localPath;
      }

      const downloadResult = await FileSystem.downloadAsync(url, localPath);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      const cachedImage: CachedImage = {
        url,
        localPath,
        cachedAt: Date.now(),
        size,
        priority,
      };

      this.metadata.set(url, cachedImage);

      // ✅ Save metadata asynchronously (non-blocking)
      this.saveMetadataAsync();

      // ✅ Enforce cache size in background
      setTimeout(() => this.enforceMaxCacheSize(), 0);

      return localPath;
    } catch (error) {
      console.error(`❌ Failed to cache image:`, error);
      return url;
    }
  }

  /**
   * ✅ NEW: Non-blocking metadata save
   */
  private saveMetadataAsync(): void {
    setTimeout(() => this.saveMetadata(), 0);
  }

  /**
   * Remove image from cache
   */
  async removeFromCache(url: string): Promise<void> {
    if (!this.cacheSupported) return;

    const cached = this.metadata.get(url);
    if (!cached) return;

    try {
      const fileInfo = await FileSystem.getInfoAsync(cached.localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cached.localPath, { idempotent: true });
      }
      this.metadata.delete(url);
      this.memoryCache.delete(url);
      await this.saveMetadata();
    } catch (error) {
      console.error('❌ Failed to remove from cache:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    if (!this.cacheSupported || !this.cacheDir) return;

    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
      this.metadata.clear();
      this.memoryCache.clear();
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      console.log('🗑️ Image cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * ✅ OPTIMIZED: Non-blocking cleanup
   */
  private async cleanupExpiredCache(): Promise<void> {
    if (!this.cacheSupported) return;

    const now = Date.now();
    let cleaned = 0;

    const expiredUrls: string[] = [];
    for (const [url, cached] of this.metadata.entries()) {
      if (now - cached.cachedAt > CACHE_DURATION) {
        expiredUrls.push(url);
      }
    }

    // Remove expired items asynchronously
    for (const url of expiredUrls) {
      try {
        await this.removeFromCache(url);
        cleaned++;
      } catch (error) {
        console.error(`Failed to remove expired cache for ${url}:`, error);
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired images from cache`);
    }
  }

  /**
   * ✅ OPTIMIZED: Smarter cache size enforcement
   */
  private async enforceMaxCacheSize(): Promise<void> {
    if (!this.cacheSupported) return;

    const totalSize = Array.from(this.metadata.values())
      .reduce((sum, item) => sum + item.size, 0);

    if (totalSize <= MAX_CACHE_SIZE) return;

    console.log(`⚠️ Cache size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds limit, cleaning...`);

    // Sort by priority (low first) and age (oldest first)
    const sortedEntries = Array.from(this.metadata.entries())
      .sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a[1].cachedAt - b[1].cachedAt;
      });

    let currentSize = totalSize;
    let removed = 0;

    for (const [url, cached] of sortedEntries) {
      if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Clean to 80% capacity
      if (cached.priority === 'high') break; // Never remove high priority

      await this.removeFromCache(url);
      currentSize -= cached.size;
      removed++;
    }

    console.log(`✅ Removed ${removed} cached images, new size: ${(currentSize / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Save metadata to AsyncStorage
   */
  private async saveMetadata(): Promise<void> {
    try {
      const metadataArray = Array.from(this.metadata.values());
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadataArray));
    } catch (error) {
      console.error('❌ Failed to save cache metadata:', error);
    }
  }

  /**
   * Generate filename from URL
   */
  private getFilenameFromUrl(url: string): string {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const cleanName = lastPart.split('?')[0];

    if (cleanName.length > 50 || !/^[a-zA-Z0-9._-]+$/.test(cleanName)) {
      const hash = this.simpleHash(url);
      const ext = cleanName.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[0] || '.jpg';
      return `img_${hash}${ext}`;
    }

    return cleanName;
  }

  /**
   * Simple hash function for generating filenames
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    itemCount: number;
    totalSize: number;
    totalSizeMB: string;
    highPriority: number;
    normalPriority: number;
    lowPriority: number;
    supported: boolean;
    memoryCache: number;
  }> {
    await this.init();

    if (!this.cacheSupported) {
      return {
        itemCount: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        highPriority: 0,
        normalPriority: 0,
        lowPriority: 0,
        supported: false,
        memoryCache: 0,
      };
    }

    const items = Array.from(this.metadata.values());
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    return {
      itemCount: items.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      highPriority: items.filter(i => i.priority === 'high').length,
      normalPriority: items.filter(i => i.priority === 'normal').length,
      lowPriority: items.filter(i => i.priority === 'low').length,
      supported: true,
      memoryCache: this.memoryCache.size,
    };
  }

  /**
   * ✅ OPTIMIZED: Batch prefetch with concurrency control
   */
  async prefetchBasketImages(imageUrls: string[]): Promise<void> {
    if (!this.cacheSupported) {
      console.log('⚠️ Image prefetch skipped: caching not supported');
      return;
    }

    console.log(`🔥 Prefetching ${imageUrls.length} basket images...`);

    // Limit concurrent downloads to 3
    const concurrencyLimit = 3;
    const chunks: string[][] = [];

    for (let i = 0; i < imageUrls.length; i += concurrencyLimit) {
      chunks.push(imageUrls.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(url =>
          this.getCachedImage(url, 'high').catch(err => {
            console.error(`Failed to prefetch ${url}:`, err);
          })
        )
      );
    }

    console.log('✅ Basket images prefetched');
  }

  /**
   * Check if caching is supported
   */
  isCacheSupported(): boolean {
    return this.cacheSupported;
  }

  /**
   * ✅ NEW: Clear memory cache
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }
}

export const imageCacheService = new ImageCacheService();
export default imageCacheService;