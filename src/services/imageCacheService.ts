// src/services/imageCacheService.ts - FIXED: Web platform support + fallback
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
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max cache
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

class ImageCacheService {
  private metadata: Map<string, CachedImage> = new Map();
  private initialized = false;
  private cacheDir: string | null = null;
  private isWebPlatform = Platform.OS === 'web';
  private cacheSupported = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // ✅ Check if FileSystem is available (not on web)
      if (this.isWebPlatform || !FileSystem.documentDirectory) {
        console.warn('⚠️ Image cache: FileSystem not available, caching disabled (platform: web)');
        this.cacheSupported = false;
        this.initialized = true;
        return;
      }

      this.cacheSupported = true;
      this.cacheDir = `${FileSystem.documentDirectory}${CACHE_DIR_NAME}/`;

      // Check if directory exists
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

      // Clean up expired cache in background
      this.cleanupExpiredCache();
    } catch (error) {
      console.error('❌ Failed to initialize image cache:', error);
      this.cacheSupported = false;
      this.initialized = true; // Mark as initialized to prevent retry loops
    }
  }

  /**
   * Get cached image path or download and cache
   */
  async getCachedImage(
    url: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    try {
      await this.init();

      // If caching not supported, return original URL
      if (!this.cacheSupported) {
        return url;
      }

      // Check if already cached
      const cached = this.metadata.get(url);
      if (cached) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(cached.localPath);
          if (fileInfo.exists) {
            // Check if expired
            if (Date.now() - cached.cachedAt < CACHE_DURATION) {
              return cached.localPath;
            } else {
              await this.removeFromCache(url);
            }
          }
        } catch (error) {
          console.error('Error checking cached file:', error);
        }
      }

      // Download and cache
      return await this.downloadAndCache(url, priority);
    } catch (error) {
      console.error('❌ Image cache error:', error);
      // Always return original URL as fallback
      return url;
    }
  }

  /**
   * Download image using FileSystem API
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
      await this.saveMetadata();

      await this.enforceMaxCacheSize();

      return localPath;
    } catch (error) {
      console.error(`❌ Failed to cache image:`, error);
      return url;
    }
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
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      console.log('🗑️ Image cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredCache(): Promise<void> {
    if (!this.cacheSupported) return;

    const now = Date.now();
    let cleaned = 0;

    for (const [url, cached] of this.metadata.entries()) {
      if (now - cached.cachedAt > CACHE_DURATION) {
        await this.removeFromCache(url);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired images from cache`);
    }
  }

  /**
   * Enforce maximum cache size by removing oldest low-priority items
   */
  private async enforceMaxCacheSize(): Promise<void> {
    if (!this.cacheSupported) return;

    const totalSize = Array.from(this.metadata.values())
      .reduce((sum, item) => sum + item.size, 0);

    if (totalSize <= MAX_CACHE_SIZE) return;

    const sortedEntries = Array.from(this.metadata.entries())
      .sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a[1].cachedAt - b[1].cachedAt;
      });

    let currentSize = totalSize;
    for (const [url, cached] of sortedEntries) {
      if (currentSize <= MAX_CACHE_SIZE) break;
      if (cached.priority === 'high') break;

      await this.removeFromCache(url);
      currentSize -= cached.size;
    }
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
    };
  }

  /**
   * Prefetch images for basket items
   */
  async prefetchBasketImages(imageUrls: string[]): Promise<void> {
    if (!this.cacheSupported) {
      console.log('⚠️ Image prefetch skipped: caching not supported');
      return;
    }

    console.log(`🔥 Prefetching ${imageUrls.length} basket images...`);

    await Promise.all(
      imageUrls.map(url =>
        this.getCachedImage(url, 'high').catch(err => {
          console.error(`Failed to prefetch ${url}:`, err);
        })
      )
    );

    console.log('✅ Basket images prefetched');
  }

  /**
   * Check if caching is supported
   */
  isCacheSupported(): boolean {
    return this.cacheSupported;
  }
}

export const imageCacheService = new ImageCacheService();
export default imageCacheService;