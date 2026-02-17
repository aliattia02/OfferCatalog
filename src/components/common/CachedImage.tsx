// src/components/common/CachedImage.tsx - PERFORMANCE OPTIMIZED
import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  View,
  ActivityIndicator,
  StyleSheet,
  ImageSourcePropType,
  Animated,
  Platform,
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
  onLoadStart?: () => void;
  onError?: (error?: any) => void;
  enableCache?: boolean;
  cachePriority?: 'high' | 'normal' | 'low';
  enableProgressiveLoading?: boolean;
  blurRadius?: number;
}

/**
 * ✅ PERFORMANCE OPTIMIZED CachedImage
 * - Eliminated duplicate onLoad calls
 * - Better state management
 * - Progressive blur-up loading
 * - Optimized re-renders with memo
 */
const CachedImageComponent: React.FC<CachedImageProps> = ({
  source,
  style,
  resizeMode,
  contentFit,
  placeholder,
  showLoader = true,
  onLoad,
  onLoadStart,
  onError,
  enableCache = true,
  cachePriority = 'normal',
  enableProgressiveLoading = true,
  blurRadius = 8, // Reduced from 10 for better performance
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cachedSource, setCachedSource] = useState<string | ImageSourcePropType | null>(null);
  const [imageOpacity] = useState(new Animated.Value(0));

  // ✅ Track if component is mounted
  const isMounted = useRef(true);
  const hasCalledOnLoad = useRef(false);
  const previousSource = useRef<string>('');

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
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const imageUrl = typeof source === 'string' ? source : (source as { uri: string })?.uri;

    // ✅ Only reload if source actually changed
    if (imageUrl === previousSource.current) {
      return;
    }

    previousSource.current = imageUrl;
    hasCalledOnLoad.current = false;

    loadImage();
  }, [source]);

  const loadImage = async () => {
    if (!source) {
      if (isMounted.current) {
        setError(true);
        setLoading(false);
      }
      return;
    }

    // Reset state for new image
    if (isMounted.current) {
      setLoading(true);
      setError(false);
      imageOpacity.setValue(0);
    }

    // Handle require() imports (local assets)
    if (typeof source !== 'string' && typeof source !== 'object') {
      if (isMounted.current) {
        setCachedSource(source);
        setLoading(false);
      }
      return;
    }

    // Handle URI objects
    const imageUrl = typeof source === 'string' ? source : (source as { uri: string }).uri;

    if (!imageUrl) {
      if (isMounted.current) {
        setError(true);
        setLoading(false);
      }
      return;
    }

    // Call onLoadStart callback
    onLoadStart?.();

    // Try to get cached version
    if (enableCache && imageUrl.startsWith('http')) {
      try {
        const cachedPath = await imageCacheService.getCachedImage(imageUrl, cachePriority);

        if (!isMounted.current) return;

        if (cachedPath.startsWith('file://')) {
          setCachedSource({ uri: cachedPath });
        } else {
          setCachedSource({ uri: imageUrl });
        }
      } catch (err) {
        console.error('❌ Image cache error:', err);
        if (isMounted.current) {
          setCachedSource({ uri: imageUrl });
        }
      }
    } else {
      if (isMounted.current) {
        setCachedSource({ uri: imageUrl });
      }
    }
  };

  const handleLoad = () => {
    // ✅ CRITICAL: Prevent duplicate onLoad calls
    if (hasCalledOnLoad.current) {
      return;
    }

    hasCalledOnLoad.current = true;

    if (!isMounted.current) return;

    setLoading(false);

    // ⚡ Mark as preloaded so FlyerDetail gets instant cache hits
    const imageUrl = typeof source === 'string' ? source : (source as { uri: string })?.uri;
    if (imageUrl) {
      imageCacheService.markPreloaded(imageUrl);
    }

    // Fade in the full image
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 250, // Reduced from 300ms for snappier feel
      useNativeDriver: true,
    }).start();

    onLoad?.();
  };

  const handleError = (e?: any) => {
    if (!isMounted.current) return;

    setLoading(false);
    setError(true);
    onError?.(e);
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

  const calculatedResizeMode = getResizeMode();

  return (
    <View style={[styles.container, style]}>
      {/* ✅ Progressive Loading: Show blurred placeholder while loading */}
      {enableProgressiveLoading && loading && Platform.OS !== 'web' && (
        <Image
          source={cachedSource}
          style={[styles.image, style, styles.blurredImage]}
          resizeMode={calculatedResizeMode}
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
        resizeMode={calculatedResizeMode}
        onLoad={handleLoad}
        onError={handleError}
        fadeDuration={0} // Disable default fade to use our own
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

// ✅ Memoize to prevent unnecessary re-renders
export const CachedImage = memo(CachedImageComponent, (prevProps, nextProps) => {
  // Custom comparison for source prop
  const prevSource = typeof prevProps.source === 'string'
    ? prevProps.source
    : (prevProps.source as { uri: string })?.uri;
  const nextSource = typeof nextProps.source === 'string'
    ? nextProps.source
    : (nextProps.source as { uri: string })?.uri;

  return (
    prevSource === nextSource &&
    prevProps.cachePriority === nextProps.cachePriority &&
    prevProps.enableCache === nextProps.enableCache &&
    prevProps.showLoader === nextProps.showLoader
  );
});

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
    backgroundColor: 'transparent',
  },
  placeholder: {
    backgroundColor: colors.gray[100],
  },
});

export default CachedImage;