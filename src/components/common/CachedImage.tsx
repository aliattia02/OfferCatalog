// src/components/common/CachedImage.tsx
import React from 'react';
import { Image, ImageProps } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

interface CachedImageProps {
  source: string | number | { uri: string };
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: string;
  placeholderContentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  alt?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

/**
 * CachedImage component using expo-image for better performance
 * - Automatic memory and disk caching
 * - Progressive loading with placeholder
 * - Better memory management
 * - Faster image loading on subsequent visits
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  placeholderContentFit = 'cover',
  transition = 200,
  alt,
  resizeMode,
}) => {
  // Convert source to proper format for expo-image
  const imageSource = typeof source === 'string' ? { uri: source } : source;
  
  // Map resizeMode to contentFit if provided (for backwards compatibility)
  const finalContentFit = resizeMode ? resizeMode as any : contentFit;

  // Default blurhash placeholder if none provided
  const defaultPlaceholder = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

  return (
    <Image
      source={imageSource}
      style={style}
      contentFit={finalContentFit}
      placeholder={placeholder || defaultPlaceholder}
      placeholderContentFit={placeholderContentFit}
      transition={transition}
      cachePolicy="memory-disk"
      alt={alt}
    />
  );
};

export default CachedImage;
