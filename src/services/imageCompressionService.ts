// src/services/imageCompressionService.ts - ULTRA-OPTIMIZED VERSION
// Target: <20KB per page for faster loading
import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

/**
 * ULTRA-OPTIMIZED compression settings
 * Aggressively reduced quality and dimensions for <20KB target
 * Quality reduced to 0.35-0.45 range (90-95% compression)
 * Dimensions reduced by ~30% for even faster loading
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 900,       // REDUCED from 1200 (25% smaller)
  maxHeight: 1200,     // REDUCED from 1600 (25% smaller)
  quality: 0.40,       // REDUCED from 0.60 (more aggressive)
  format: 'jpeg',
};

/**
 * Compress a single image
 */
export const compressImage = async (
  imageUri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    console.log('🖼️ Compressing image:', imageUri.substring(0, 50) + '...');
    console.log('   Settings:', opts);

    // Get original file size
    let originalSize: number | undefined;
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      originalSize = blob.size;
      console.log(`   📏 Original size: ${(originalSize / 1024).toFixed(1)}KB`);
    } catch (e) {
      console.warn('   ⚠️ Could not determine original size');
    }

    // Compress the image
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: opts.maxWidth,
            height: opts.maxHeight,
          },
        },
      ],
      {
        compress: opts.quality,
        format: opts.format === 'png'
          ? ImageManipulator.SaveFormat.PNG
          : ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Get compressed file size
    let compressedSize: number | undefined;
    let compressionRatio: number | undefined;
    try {
      const response = await fetch(result.uri);
      const blob = await response.blob();
      compressedSize = blob.size;

      if (originalSize) {
        compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
        console.log(`   ✅ Compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB`);
        console.log(`   📉 Reduction: ${compressionRatio.toFixed(1)}%`);
      }
    } catch (e) {
      console.warn('   ⚠️ Could not determine compressed size');
    }

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    return {
      uri: imageUri,
      width: 0,
      height: 0,
    };
  }
};

/**
 * Compress multiple images with progress tracking
 */
export const compressMultipleImages = async (
  imageUris: string[],
  options: CompressionOptions = {},
  onProgress?: (current: number, total: number, stats?: CompressionStats) => void
): Promise<CompressionResult[]> => {
  console.log(`🖼️ Compressing ${imageUris.length} images...`);

  const results: CompressionResult[] = [];
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  for (let i = 0; i < imageUris.length; i++) {
    const result = await compressImage(imageUris[i], options);
    results.push(result);

    if (result.originalSize) totalOriginalSize += result.originalSize;
    if (result.compressedSize) totalCompressedSize += result.compressedSize;

    if (onProgress) {
      const stats: CompressionStats = {
        totalOriginalMB: totalOriginalSize / 1024 / 1024,
        totalCompressedMB: totalCompressedSize / 1024 / 1024,
        savedMB: (totalOriginalSize - totalCompressedSize) / 1024 / 1024,
        compressionRatio: totalOriginalSize > 0
          ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100
          : 0,
      };
      onProgress(i + 1, imageUris.length, stats);
    }
  }

  if (totalOriginalSize > 0 && totalCompressedSize > 0) {
    const totalRatio = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;
    console.log(`📊 Total compression summary:`);
    console.log(`   Original: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Compressed: ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Saved: ${totalRatio.toFixed(1)}% (${((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2)}MB)`);
  }

  return results;
};

export interface CompressionStats {
  totalOriginalMB: number;
  totalCompressedMB: number;
  savedMB: number;
  compressionRatio: number;
}

/**
 * Compress a data URL (base64 image)
 */
export const compressDataUrl = async (
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> => {
  try {
    console.log('🖼️ Compressing data URL...');

    const opts = { ...DEFAULT_OPTIONS, ...options };

    const result = await ImageManipulator.manipulateAsync(
      dataUrl,
      [
        {
          resize: {
            width: opts.maxWidth,
            height: opts.maxHeight,
          },
        },
      ],
      {
        compress: opts.quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (result.base64) {
      const compressedDataUrl = `data:image/jpeg;base64,${result.base64}`;

      const originalSize = dataUrl.length;
      const compressedSize = compressedDataUrl.length;
      const reduction = ((originalSize - compressedSize) / originalSize) * 100;

      console.log(`   ✅ Data URL compressed: ${reduction.toFixed(1)}% smaller`);

      return compressedDataUrl;
    }

    return dataUrl;
  } catch (error) {
    console.error('❌ Data URL compression failed:', error);
    return dataUrl;
  }
};

/**
 * ULTRA-OPTIMIZED settings for <20KB target per page
 * Dimensions reduced by ~30%, quality reduced to 0.35-0.45
 */
export const getOptimalSettings = (
  imageType: 'cover' | 'page' | 'thumbnail' | 'offer'
): CompressionOptions => {
  switch (imageType) {
    case 'cover':
      return {
        maxWidth: 600,       // REDUCED from 800 (25% smaller)
        maxHeight: 900,      // REDUCED from 1200 (25% smaller)
        quality: 0.42,       // REDUCED from 0.65 (35% lower)
        format: 'jpeg',
      };

    case 'page':
      return {
        maxWidth: 900,       // REDUCED from 1200 (25% smaller)
        maxHeight: 1200,     // REDUCED from 1600 (25% smaller)
        quality: 0.38,       // REDUCED from 0.60 (37% lower) - AGGRESSIVE
        format: 'jpeg',
      };

    case 'thumbnail':
      return {
        maxWidth: 300,       // REDUCED from 400 (25% smaller)
        maxHeight: 450,      // REDUCED from 600 (25% smaller)
        quality: 0.35,       // REDUCED from 0.58 (40% lower)
        format: 'jpeg',
      };

    case 'offer':
      return {
        maxWidth: 450,       // REDUCED from 600 (25% smaller)
        maxHeight: 450,      // SAME
        quality: 0.40,       // REDUCED from 0.62 (35% lower)
        format: 'jpeg',
      };

    default:
      return DEFAULT_OPTIONS;
  }
};

/**
 * Generate tiny blur placeholder (for progressive loading)
 * This creates a 20x20 blurred version (~1-2KB)
 */
export const generateBlurPlaceholder = async (
  imageUri: string
): Promise<string | null> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 20 } }, // Tiny image
      ],
      {
        compress: 0.5,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (result.base64) {
      return `data:image/jpeg;base64,${result.base64}`;
    }

    return null;
  } catch (error) {
    console.error('Failed to generate blur placeholder:', error);
    return null;
  }
};

/**
 * Estimate storage savings with new ultra-compressed settings
 */
export const estimateStorageSavings = (
  imageCount: number,
  avgImageSizeMB: number = 2.5
): {
  before: string;
  after: string;
  saved: string;
  percentage: string;
  costSavings: string;
  bandwidthSavings: string;
  avgPageSizeKB: string;
} => {
  const beforeMB = imageCount * avgImageSizeMB;
  const afterMB = beforeMB * 0.08; // 92% compression (more aggressive)
  const savedMB = beforeMB - afterMB;
  const percentage = ((savedMB / beforeMB) * 100).toFixed(0);

  const savedGB = savedMB / 1024;
  const monthlySavings = savedGB * 0.026;

  const bandwidthSavedGB = (savedMB / 1024) * 10;
  const bandwidthSavings = bandwidthSavedGB * 0.12;

  // Calculate average page size
  const avgPageSizeKB = ((afterMB * 1024) / imageCount).toFixed(1);

  return {
    before: `${beforeMB.toFixed(1)}MB`,
    after: `${afterMB.toFixed(1)}MB`,
    saved: `${savedMB.toFixed(1)}MB`,
    percentage: `${percentage}%`,
    costSavings: `$${monthlySavings.toFixed(2)}/month`,
    bandwidthSavings: `$${bandwidthSavings.toFixed(2)}`,
    avgPageSizeKB: `~${avgPageSizeKB}KB/page`,
  };
};

/**
 * Batch compress images with detailed progress
 */
export const batchCompressImages = async (
  imageUris: string[],
  imageType: 'cover' | 'page' | 'thumbnail' | 'offer' = 'page',
  onProgress?: (progress: {
    current: number;
    total: number;
    percentage: number;
    currentImage: string;
    stats: CompressionStats;
  }) => void
): Promise<CompressionResult[]> => {
  const settings = getOptimalSettings(imageType);
  const results: CompressionResult[] = [];

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (let i = 0; i < imageUris.length; i++) {
    const result = await compressImage(imageUris[i], settings);
    results.push(result);

    if (result.originalSize) totalOriginal += result.originalSize;
    if (result.compressedSize) totalCompressed += result.compressedSize;

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: imageUris.length,
        percentage: ((i + 1) / imageUris.length) * 100,
        currentImage: imageUris[i].substring(imageUris[i].lastIndexOf('/') + 1),
        stats: {
          totalOriginalMB: totalOriginal / 1024 / 1024,
          totalCompressedMB: totalCompressed / 1024 / 1024,
          savedMB: (totalOriginal - totalCompressed) / 1024 / 1024,
          compressionRatio: totalOriginal > 0
            ? ((totalOriginal - totalCompressed) / totalOriginal) * 100
            : 0,
        },
      });
    }
  }

  return results;
};