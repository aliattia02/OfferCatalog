// src/services/imageCompressionService.ts
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
 * Default compression settings optimized for catalogue images
 * These settings typically achieve 70-80% size reduction with minimal quality loss
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,      // Good for mobile viewing
  maxHeight: 1600,     // Portrait catalogue pages
  quality: 0.75,       // 75% quality - great balance
  format: 'jpeg',      // Best compression for photos
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
    
    console.log('🖼️  Compressing image:', imageUri.substring(0, 50) + '...');
    console.log('   Settings:', opts);

    // Get original file size
    let originalSize: number | undefined;
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      originalSize = blob.size;
    } catch (e) {
      console.warn('   Could not determine original size');
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
      console.warn('   Could not determine compressed size');
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
    // Return original URI if compression fails
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
  onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> => {
  console.log(`🖼️  Compressing ${imageUris.length} images...`);
  
  const results: CompressionResult[] = [];
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  for (let i = 0; i < imageUris.length; i++) {
    if (onProgress) {
      onProgress(i + 1, imageUris.length);
    }

    const result = await compressImage(imageUris[i], options);
    results.push(result);

    if (result.originalSize) totalOriginalSize += result.originalSize;
    if (result.compressedSize) totalCompressedSize += result.compressedSize;
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

/**
 * Compress a data URL (base64 image)
 * Useful for PDF page conversion
 */
export const compressDataUrl = async (
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> => {
  try {
    console.log('🖼️  Compressing data URL...');
    
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
      
      // Calculate size reduction
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
 * Get optimal compression settings based on image type
 */
export const getOptimalSettings = (
  imageType: 'cover' | 'page' | 'thumbnail'
): CompressionOptions => {
  switch (imageType) {
    case 'cover':
      // Higher quality for cover images
      return {
        maxWidth: 800,
        maxHeight: 1200,
        quality: 0.80,
        format: 'jpeg',
      };
    
    case 'page':
      // Balanced settings for catalogue pages
      return {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 0.75,
        format: 'jpeg',
      };
    
    case 'thumbnail':
      // Smaller size for thumbnails
      return {
        maxWidth: 400,
        maxHeight: 600,
        quality: 0.70,
        format: 'jpeg',
      };
    
    default:
      return DEFAULT_OPTIONS;
  }
};

/**
 * Estimate storage savings
 */
export const estimateStorageSavings = (
  imageCount: number,
  avgImageSizeMB: number = 2
): { before: string; after: string; saved: string; percentage: string } => {
  const beforeMB = imageCount * avgImageSizeMB;
  const afterMB = beforeMB * 0.25; // Assume 75% compression
  const savedMB = beforeMB - afterMB;
  const percentage = ((savedMB / beforeMB) * 100).toFixed(0);

  return {
    before: `${beforeMB.toFixed(1)}MB`,
    after: `${afterMB.toFixed(1)}MB`,
    saved: `${savedMB.toFixed(1)}MB`,
    percentage: `${percentage}%`,
  };
};