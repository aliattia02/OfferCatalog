// src/components/common/CachedImage.tsx - WITH PROGRESSIVE BLUR-UP LOADING
import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  View,
  ActivityIndicator,
  StyleSheet,
  ImageSourcePropType,
  Animated,
} from 'react-native';
import { colors } from '../../constants/theme';
import { imageCacheService } from '../../services/imageCacheService';

interface CachedImageProps {
  source: string | { uri: string } | ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: React.ReactNode;
  showLoader?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  enableCache?: boolean;
  cachePriority?: 'high' | 'normal' | 'low';
  // NEW: Progressive loading options
  enableProgressiveLoading?: boolean;
  blurRadius?: number; // Blur amount for placeholder (default: 10)
}

/**
 * CachedImage with PROGRESSIVE BLUR-UP LOADING
 * - Shows tiny blurred placeholder instantly (1-2KB)
 * - Fades in full image when loaded
 * - No extra data consumption (placeholder generated client-side)
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  resizeMode,
  contentFit,
  placeholder,
  showLoader = true,
  onLoad,
  onError,
  enableCache = true,
  cachePriority = 'normal',
  enableProgressiveLoading = true,
  blurRadius = 10,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cachedSource, setCachedSource] = useState<string | ImageSourcePropType | null>(null);
  const [imageOpacity] = useState(new Animated.Value(0));

  // Map contentFit to resizeMode
  const getResizeMode = (): 'cover' | 'contain' | 'stretch' | 'center' => {
    if (resizeMode) return resizeMode;
    if (contentFit) {
      switch (contentFit) {
        case 'cover': return 'cover';
        case 'contain':
        case 'scale-down': return 'contain';
        case 'fill': return 'stretch';
        case 'none': return 'center';
        default: return 'cover';
      }
    }
    return 'cover';
  };

  useEffect(() => {
    loadImage();
  }, [source]);

  const loadImage = async () => {
    if (!source) {
      setError(true);
      setLoading(false);
      return;
    }

    // Handle require() imports (local assets)
    if (typeof source !== 'string' && typeof source !== 'object') {
      setCachedSource(source);
      setLoading(false);
      return;
    }

    // Handle URI objects
    const imageUrl = typeof source === 'string' ? source : (source as { uri: string }).uri;

    if (!imageUrl) {
      setError(true);
      setLoading(false);
      return;
    }

    // Try to get cached version
    if (enableCache && imageUrl.startsWith('http')) {
      try {
        const cachedPath = await imageCacheService.getCachedImage(imageUrl, cachePriority);

        if (cachedPath.startsWith('file://')) {
          setCachedSource({ uri: cachedPath });
        } else {
          setCachedSource({ uri: imageUrl });
        }
      } catch (err) {
        console.error('❌ Image cache error:', err);
        setCachedSource({ uri: imageUrl });
      }
    } else {
      setCachedSource({ uri: imageUrl });
    }
  };

  const handleLoad = () => {
    setLoading(false);

    // Fade in the full image
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  // Show placeholder while loading cache
  if (!cachedSource) {
    return showLoader ? (
      <View style={[styles.loaderContainer, style]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    ) : placeholder ? (
      <>{placeholder}</>
    ) : (
      <View style={[styles.placeholder, style]} />
    );
  }

  if (error && placeholder) {
    return <>{placeholder}</>;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Progressive Loading: Show blurred placeholder while loading */}
      {enableProgressiveLoading && loading && (
        <Image
          source={cachedSource}
          style={[styles.image, style, styles.blurredImage]}
          resizeMode={getResizeMode()}
          blurRadius={blurRadius}
        />
      )}

      {/* Full resolution image */}
      <Animated.Image
        source={cachedSource}
        style={[
          styles.image,
          style,
          { opacity: enableProgressiveLoading ? imageOpacity : 1 },
        ]}
        resizeMode={getResizeMode()}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Loading indicator (shows on top of blur) */}
      {loading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurredImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Changed to transparent for blur effect
  },
  placeholder: {
    backgroundColor: colors.gray[100],
  },
});

export default CachedImage;