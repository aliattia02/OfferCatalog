import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  I18nManager,
  Alert,
  ActivityIndicator,
  PanResponder,
  Modal,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Button } from '../../components/common';
import { SavePageButton } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useLocalized } from '../../hooks';
import { addToBasket, addPageToBasket } from '../../store/slices/basketSlice';
import { getCatalogueById } from '../../data/catalogueRegistry';
import { getOffersByCatalogue } from '../../services/offerService';
import { formatCurrency, calculateDiscount } from '../../utils/helpers';
import type { OfferWithCatalogue } from '../../services/offerService';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

export default function FlyerDetailScreen() {
  const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { getTitle, getName } = useLocalized();

  const [currentPage, setCurrentPage] = useState(0);
  const [catalogueOffers, setCatalogueOffers] = useState<OfferWithCatalogue[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [fullScreenImage, setFullScreenImage] = useState(false);

  // Use ref to track current page for PanResponder
  const currentPageRef = useRef(0);

  const catalogue = getCatalogueById(id);
  const stores = useAppSelector(state => state.stores.stores);
  const basketItems = useAppSelector(state => state.basket.items);

  const store = stores.find(s => s.id === catalogue?.storeId) || (catalogue ? {
    id: catalogue.storeId,
    nameAr: catalogue.titleAr.replace('عروض ', ''),
    nameEn: catalogue.titleEn.replace(' Offers', ''),
    logo: `https://placehold.co/100x100/e63946/ffffff?text=${catalogue.storeId}`,
    branches: [],
  } : null);

  const totalPages = catalogue?.pages?.length || 0;

  // Set initial page from URL parameter
  useEffect(() => {
    if (page) {
      const pageNumber = parseInt(page, 10);
      if (!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= totalPages) {
        const pageIndex = pageNumber - 1; // Convert to 0-based index
        setCurrentPage(pageIndex);
        console.log(`📄 [FlyerDetail] Navigated to page ${pageNumber} (index ${pageIndex})`);
      }
    }
  }, [page, totalPages]);

  // Update ref whenever currentPage changes
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Zoom state for FULLSCREEN view only
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  // Load real offers from Firestore
  useEffect(() => {
    const loadOffers = async () => {
      if (!catalogue?.id) {
        setLoadingOffers(false);
        return;
      }

      try {
        setLoadingOffers(true);
        const offers = await getOffersByCatalogue(catalogue.id);
        setCatalogueOffers(offers);
      } catch (error) {
        console.error('Error loading catalogue offers:', error);
      } finally {
        setLoadingOffers(false);
      }
    };

    loadOffers();
  }, [catalogue?.id]);

  // Reset fullscreen zoom when page changes or modal closes
  useEffect(() => {
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  }, [currentPage, fullScreenImage]);

  // Calculate distance between two touches
  const distance = (touches: any[]) => {
    const [touch1, touch2] = touches;
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // NORMAL VIEW: Swipe only (NO pinch-to-zoom)
  const normalViewPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal swipes, not taps
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const isRTL = I18nManager.isRTL;

        const page = currentPageRef.current;
        const maxPages = totalPages;

        const isFastSwipe = Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD;
        const isLongSwipe = Math.abs(dx) > SWIPE_THRESHOLD;

        if (isFastSwipe || isLongSwipe) {
          let newPage = page;

          if (isRTL) {
            if (dx > 0 && page > 0) {
              newPage = page - 1;
            } else if (dx < 0 && page < maxPages - 1) {
              newPage = page + 1;
            }
          } else {
            if (dx > 0 && page > 0) {
              newPage = page - 1;
            } else if (dx < 0 && page < maxPages - 1) {
              newPage = page + 1;
            }
          }

          if (newPage !== page) {
            setCurrentPage(newPage);
          }
        }
      },
    })
  ).current;

  // FULLSCREEN: Pinch to zoom + Swipe
  const fullScreenPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          lastScale.current = scale._value;
        } else if (evt.nativeEvent.touches.length === 1) {
          lastTranslateX.current = translateX._value;
          lastTranslateY.current = translateY._value;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          const currentDistance = distance(touches);
          const newScale = Math.max(1, Math.min(lastScale.current * (currentDistance / 200), 4));
          scale.setValue(newScale);
        } else if (touches.length === 1 && lastScale.current > 1) {
          translateX.setValue(lastTranslateX.current + gestureState.dx);
          translateY.setValue(lastTranslateY.current + gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentScale = scale._value;
        const { dx, vx } = gestureState;
        const isRTL = I18nManager.isRTL;

        const page = currentPageRef.current;
        const maxPages = totalPages;

        const isFastSwipe = Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD;
        const isLongSwipe = Math.abs(dx) > SWIPE_THRESHOLD;

        if (currentScale <= 1.1 && (isFastSwipe || isLongSwipe)) {
          scale.setValue(1);
          translateX.setValue(0);
          translateY.setValue(0);
          lastScale.current = 1;
          lastTranslateX.current = 0;
          lastTranslateY.current = 0;

          let newPage = page;

          if (isRTL) {
            if (dx > 0 && page > 0) {
              newPage = page - 1;
            } else if (dx < 0 && page < maxPages - 1) {
              newPage = page + 1;
            }
          } else {
            if (dx > 0 && page > 0) {
              newPage = page - 1;
            } else if (dx < 0 && page < maxPages - 1) {
              newPage = page + 1;
            }
          }

          if (newPage !== page) {
            setCurrentPage(newPage);
          }
        } else {
          lastScale.current = currentScale;
          lastTranslateX.current = translateX._value;
          lastTranslateY.current = translateY._value;
        }
      },
    })
  ).current;

  const pageOffers = useMemo(() => {
    return catalogueOffers.filter(
      offer => offer.pageNumber === currentPage + 1
    );
  }, [catalogueOffers, currentPage]);

  const isPageSaved = useMemo(() => {
    if (!catalogue || !catalogue.pages || catalogue.pages.length === 0) return false;
    return basketItems.some(
      item =>
        item.type === 'page' &&
        item.cataloguePage?.catalogueId === catalogue.id &&
        item.cataloguePage?.pageNumber === currentPage + 1
    );
  }, [basketItems, catalogue?.id, currentPage]);

  if (!catalogue) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={64} color={colors.gray[300]} />
        <Text style={styles.errorText}>الكتالوج غير موجود</Text>
        <Text style={styles.errorSubtext}>ID: {id}</Text>
        <Button title="العودة" onPress={() => router.back()} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>المتجر غير موجود</Text>
        <Button title="العودة" onPress={() => router.back()} />
      </View>
    );
  }

  const hasPages = catalogue.pages && catalogue.pages.length > 0;
  const currentPageData = hasPages ? catalogue.pages[currentPage] : null;

  const handleAddToBasket = (offer: OfferWithCatalogue) => {
    dispatch(addToBasket({
      offer,
      storeName: store.nameAr,
    }));
  };

  const handleOfferPress = (offer: OfferWithCatalogue) => {
    router.push(`/offer/${offer.id}`);
  };

  const handleSavePage = () => {
    if (!currentPageData) {
      Alert.alert('خطأ', 'لا توجد صفحة للحفظ');
      return;
    }

    if (isPageSaved) {
      Alert.alert('تنبيه', 'تم حفظ هذه الصفحة مسبقاً');
      return;
    }

    dispatch(
      addPageToBasket({
        catalogue,
        page: currentPageData,
        storeName: store.nameAr,
        offers: pageOffers,
      })
    );

    Alert.alert('نجح', 'تم حفظ الصفحة في السلة');
  };

  const handleNavPress = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderOfferThumbnail = (offer: OfferWithCatalogue) => {
    const discount = offer.originalPrice
      ? calculateDiscount(offer.originalPrice, offer.offerPrice)
      : 0;

    return (
      <TouchableOpacity
        key={offer.id}
        style={styles.offerThumbnail}
        onPress={() => handleOfferPress(offer)}
        activeOpacity={0.7}
      >
        <View style={styles.thumbnailImageContainer}>
          <Image
            source={{ uri: offer.imageUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          {discount > 0 && (
            <View style={styles.thumbnailDiscountBadge}>
              <Text style={styles.thumbnailDiscountText}>{discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.thumbnailContent}>
          <Text style={styles.thumbnailName} numberOfLines={2}>
            {offer.nameAr}
          </Text>

          <View style={styles.thumbnailPriceRow}>
            <Text style={styles.thumbnailOfferPrice}>
              {formatCurrency(offer.offerPrice)}
            </Text>
            {offer.originalPrice && (
              <Text style={styles.thumbnailOriginalPrice}>
                {formatCurrency(offer.originalPrice)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.thumbnailAddButton}
            onPress={() => handleAddToBasket(offer)}
          >
            <Ionicons name="add" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: catalogue.titleAr || getTitle(catalogue),
          headerBackTitle: 'عودة',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {hasPages ? (
          <View style={styles.pageContainer}>
            <View {...normalViewPan.panHandlers} style={styles.swipeContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setFullScreenImage(true)}
              >
                <Image
                  source={{ uri: currentPageData?.imageUrl }}
                  style={styles.pageImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.pageNavigationCenter}>
              <View style={styles.navControls}>
                <TouchableOpacity
                  style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
                  onPress={() => handleNavPress('prev')}
                  disabled={currentPage === 0}
                >
                  <Ionicons
                    name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"}
                    size={24}
                    color={currentPage === 0 ? colors.gray[400] : colors.white}
                  />
                </TouchableOpacity>

                <View style={styles.pageIndicatorBadge}>
                  <Text style={styles.pageIndicator}>
                    {currentPage + 1} / {catalogue.pages.length}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentPage === catalogue.pages.length - 1 && styles.navButtonDisabled,
                  ]}
                  onPress={() => handleNavPress('next')}
                  disabled={currentPage === catalogue.pages.length - 1}
                >
                  <Ionicons
                    name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
                    size={24}
                    color={currentPage === catalogue.pages.length - 1 ? colors.gray[400] : colors.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noPagesContainer}>
            <Ionicons name="document-text" size={64} color={colors.primary} />
            <Text style={styles.noPagesText}>
              لا توجد صور لهذا الكتالوج
            </Text>
          </View>
        )}

        {hasPages && (
          <View style={styles.savePageSection}>
            <SavePageButton
              isSaved={isPageSaved}
              onPress={handleSavePage}
            />
          </View>
        )}

        {loadingOffers ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>جاري تحميل العروض...</Text>
          </View>
        ) : pageOffers.length > 0 ? (
          <View style={styles.offersSection}>
            <View style={styles.thumbnailsGrid}>
              {pageOffers.map(renderOfferThumbnail)}
            </View>
          </View>
        ) : hasPages ? (
          <View style={styles.noOffersContainer}>
            <Ionicons name="pricetags-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.noOffersText}> يمكنك اضافة الصفحه بكاملها الي السله - لا توجد عروض مسجله </Text>
          </View>
        ) : null}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fullscreen Modal with Pinch-to-Zoom */}
      <Modal
        visible={fullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(false)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullScreenImage(false)}
          >
            <Ionicons name="close" size={32} color={colors.white} />
          </TouchableOpacity>

          <View
            style={styles.fullScreenImageWrapper}
            {...fullScreenPan.panHandlers}
          >
            <Animated.View
              style={{
                transform: [
                  { scale: scale },
                  { translateX: translateX },
                  { translateY: translateY },
                ],
              }}
            >
              <Image
                source={{ uri: currentPageData?.imageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.zoomIndicator,
              {
                opacity: scale.interpolate({
                  inputRange: [1, 2],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Ionicons name="expand" size={20} color={colors.white} />
            <Animated.Text style={styles.zoomText}>
              {scale.interpolate({
                inputRange: [1, 4],
                outputRange: ['1x', '4x'],
              })}
            </Animated.Text>
          </Animated.View>

          <View style={styles.fullScreenNav}>
            <TouchableOpacity
              style={[styles.fullScreenNavButton, currentPage === 0 && styles.navButtonDisabled]}
              onPress={() => handleNavPress('prev')}
              disabled={currentPage === 0}
            >
              <Ionicons
                name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"}
                size={28}
                color={colors.white}
              />
            </TouchableOpacity>

            <View style={styles.fullScreenPageIndicator}>
              <Text style={styles.fullScreenPageText}>
                {currentPage + 1} / {totalPages}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.fullScreenNavButton,
                currentPage === totalPages - 1 && styles.navButtonDisabled,
              ]}
              onPress={() => handleNavPress('next')}
              disabled={currentPage === totalPages - 1}
            >
              <Ionicons
                name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
                size={28}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  pageContainer: {
    backgroundColor: colors.gray[900],
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  swipeContainer: {
    overflow: 'hidden',
  },
  pageImage: {
    width: '100%',
    height: 480,
    backgroundColor: colors.gray[200],
  },
  pageNavigationCenter: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(230, 57, 70, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pageIndicatorBadge: {
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pageIndicator: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  noPagesContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  noPagesText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  savePageSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingSection: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  offersSection: {
    padding: spacing.md,
  },
  thumbnailsGrid: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  offerThumbnail: {
    width: '23.5%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailImageContainer: {
    position: 'relative',
    height: 80,
    backgroundColor: colors.gray[100],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailDiscountBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: I18nManager.isRTL ? undefined : spacing.xs,
    right: I18nManager.isRTL ? spacing.xs : undefined,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  thumbnailDiscountText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  thumbnailContent: {
    padding: spacing.xs,
  },
  thumbnailName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    minHeight: 28,
  },
  thumbnailPriceRow: {
    flexDirection: 'column',
    alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
    marginBottom: spacing.xs,
    gap: 2,
  },
  thumbnailOfferPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
  thumbnailOriginalPrice: {
    fontSize: 9,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  thumbnailAddButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noOffersContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  noOffersText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: spacing.xl,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: I18nManager.isRTL ? undefined : 20,
    left: I18nManager.isRTL ? 20 : undefined,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
  },
  fullScreenImageWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
  zoomIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  zoomText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  fullScreenNav: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  fullScreenNavButton: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(230, 57, 70, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  fullScreenPageIndicator: {
    backgroundColor: 'rgba(100, 100, 100, 0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  fullScreenPageText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
});