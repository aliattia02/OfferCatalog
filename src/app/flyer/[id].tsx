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
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Button } from '../../components/common';
import { OfferCard, PDFPageViewer, CataloguePDFViewer, SavePageButton } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useLocalized } from '../../hooks';
import { addToBasket, addPageToBasket, addPdfPageToBasket } from '../../store/slices/basketSlice';
// Use the NEW catalogue registry instead of old offers.ts
import { getCatalogueById } from '../../data/catalogueRegistry';
import { getOfferById } from '../../data/offers';
import type { Offer } from '../../types';

const { width } = Dimensions.get('window');

export default function FlyerDetailScreen() {
  const { id } = useLocalSearchParams<{ id:  string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { getTitle, getName } = useLocalized();

  const [currentPage, setCurrentPage] = useState(0);
  const [showPDF, setShowPDF] = useState(false);
  const [showPDFPageViewer, setShowPDFPageViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Use ref for debug info to avoid re-renders
  const debugInfoRef = useRef<string[]>([]);

  const catalogue = getCatalogueById(id);
  const stores = useAppSelector(state => state.stores. stores);
  const basketItems = useAppSelector(state => state. basket.items);

  // Try to find store, or create a placeholder based on catalogue data
  const store = stores.find(s => s.id === catalogue?. storeId) || (catalogue ?  {
    id: catalogue.storeId,
    nameAr: catalogue.titleAr. replace('عروض ', ''),
    nameEn: catalogue. titleEn.replace(' Offers', ''),
    logo: `https://placehold.co/100x100/e63946/ffffff?text=${catalogue.storeId}`,
    branches: [],
  } : null);

  // Debug log function that doesn't cause re-renders
  const addDebugLog = (message: string) => {
    const logEntry = `${new Date().toLocaleTimeString()}: ${message}`;
    debugInfoRef.current = [...debugInfoRef. current, logEntry];
    console.log('[PDF Debug]', message);
  };

  // DEBUG: Log catalogue data on mount (only once)
  useEffect(() => {
    console.log('=== FLYER DETAIL DEBUG ===');
    console.log('Catalogue ID:', id);
    console.log('Catalogue found:', catalogue ?  'YES' : 'NO');
    if (catalogue) {
      console.log('Catalogue data:', catalogue);
      console.log('PDF URL from catalogue:', catalogue.pdfUrl);
    }
    console. log('Platform:', Platform.OS);
    console.log('========================');
  }, [id]); // Only run when id changes

  // Check if current page is saved (for image pages)
  const isPageSaved = useMemo(() => {
    if (!catalogue || !catalogue.pages || catalogue.pages.length === 0) return false;
    return basketItems.some(
      item =>
        item.type === 'page' &&
        item.cataloguePage?.catalogueId === catalogue.id &&
        item.cataloguePage?.pageNumber === currentPage + 1
    );
  }, [basketItems, catalogue?.id, currentPage]);

  // Get saved PDF page numbers for this catalogue
  const savedPdfPageNumbers = useMemo(() => {
    if (!catalogue) return [];
    return basketItems
      .filter(item => 
        item.type === 'pdf-page' && 
        item.pdfPage?.catalogueId === catalogue.id
      )
      .map(item => item.pdfPage!.pageNumber);
  }, [basketItems, catalogue?.id]);

  // Load PDF URL on mount
  useEffect(() => {
    if (catalogue?. pdfUrl) {
      loadPdfUrl();
    }
  }, [catalogue?.pdfUrl]);

  const loadPdfUrl = async () => {
    if (! catalogue?.pdfUrl) {
      addDebugLog('❌ loadPdfUrl called but no PDF URL');
      return;
    }

    setLoadingPdf(true);
    addDebugLog(`🔄 Loading PDF:  ${catalogue.pdfUrl}`);

    try {
      if (Platform.OS === 'web') {
        addDebugLog('🌐 Web platform detected');

        const testUrl = catalogue.pdfUrl;
        addDebugLog(`Testing URL: ${testUrl}`);

        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          addDebugLog(`Fetch response status: ${response. status}`);

          if (response. ok) {
            setPdfUrl(testUrl);
            addDebugLog('✅ PDF URL set successfully');
          } else {
            addDebugLog(`❌ PDF not accessible:  ${response.status}`);
            // Still set the URL, let the viewer handle the error
            setPdfUrl(testUrl);
          }
        } catch (fetchError:  any) {
          addDebugLog(`⚠️ Fetch warning: ${fetchError. message}`);
          // Still set the URL for the viewer
          setPdfUrl(testUrl);
        }
      } else {
        addDebugLog('📱 Native platform detected');
        setPdfUrl(catalogue. pdfUrl);
        addDebugLog('✅ PDF URL set');
      }
    } catch (error:  any) {
      addDebugLog(`❌ Error in loadPdfUrl:  ${error.message}`);
      console.error('Error loading PDF:', error);
    } finally {
      setLoadingPdf(false);
      addDebugLog('🏁 loadPdfUrl completed');
    }
  };

  const showDebugInfo = () => {
    Alert.alert(
      'معلومات التصحيح',
      debugInfoRef.current. join('\n') || 'لا توجد سجلات',
      [{ text: 'موافق' }]
    );
  };

  // Handle case where catalogue is not found
  if (! catalogue) {
    return (
      <View style={styles. errorContainer}>
        <Ionicons name="document-text-outline" size={64} color={colors. gray[300]} />
        <Text style={styles. errorText}>الكتالوج غير موجود</Text>
        <Text style={styles.errorSubtext}>ID: {id}</Text>
        <Button title="العودة" onPress={() => router.back()} />
      </View>
    );
  }

  // Handle case where store is not found (shouldn't happen with our fix above)
  if (!store) {
    return (
      <View style={styles. errorContainer}>
        <Text style={styles.errorText}>المتجر غير موجود</Text>
        <Button title="العودة" onPress={() => router.back()} />
      </View>
    );
  }

  const hasPages = catalogue.pages && catalogue.pages.length > 0;
  const currentPageData = hasPages ?  catalogue.pages[currentPage] : null;
  const pageOffers = currentPageData?.offers
    ?  currentPageData.offers
        .map(offerId => getOfferById(offerId))
        .filter(Boolean) as Offer[]
    : [];

  const handleAddToBasket = (offer: Offer) => {
    dispatch(addToBasket({
      offer,
      storeName: store.nameAr,
    }));
  };

  const handleOfferPress = (offer:  Offer) => {
    router.push(`/offer/${offer. id}`);
  };

  const handleOpenPDF = () => {
    addDebugLog('🖱️ PDF button clicked');

    if (!catalogue.pdfUrl) {
      addDebugLog('❌ No PDF URL available');
      Alert.alert('خطأ', 'ملف PDF غير متوفر لهذا الكتالوج');
      return;
    }

    if (loadingPdf) {
      addDebugLog('⏳ Still loading PDF');
      Alert.alert('انتظر', 'جاري تحميل ملف PDF...');
      return;
    }

    // Use the catalogue URL directly if pdfUrl state hasn't been set yet
    const urlToUse = pdfUrl || catalogue.pdfUrl;
    addDebugLog(`✅ Opening PDF page viewer with URL: ${urlToUse}`);
    setPdfUrl(urlToUse);
    setShowPDFPageViewer(true);
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

  const handleSavePdfPage = (pageNumber: number, pageImageUri: string) => {
    dispatch(
      addPdfPageToBasket({
        catalogueId: catalogue.id,
        catalogueTitle: catalogue.titleAr,
        storeId: catalogue.storeId,
        storeName: store?.nameAr || '',
        pageNumber,
        pageImageUri,
      })
    );

    Alert.alert('تم الحفظ', `تم حفظ الصفحة ${pageNumber} في السلة`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: catalogue.titleAr || getTitle(catalogue),
          headerBackTitle: 'عودة',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {__DEV__ && (
                <TouchableOpacity
                  onPress={showDebugInfo}
                  style={styles.headerButton}
                >
                  <Ionicons name="bug-outline" size={20} color={colors. gray[600]} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleOpenPDF}
                style={styles.headerButton}
                disabled={loadingPdf}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={loadingPdf ? colors.gray[400] : colors.primary}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Debug Info Banner (visible in development) */}
        {__DEV__ && (
          <View style={styles. debugBanner}>
            <Text style={styles.debugText}>
              🐛 PDF:  {pdfUrl ?  '✅' : '⏳'} | ID: {catalogue.id}
            </Text>
            <Text style={styles.debugTextSmall}>
              Path: {catalogue.pdfUrl}
            </Text>
          </View>
        )}

        {/* Store Header */}
        <View style={styles. header}>
          <Image
            source={{ uri: store.logo }}
            style={styles.storeLogo}
            resizeMode="contain"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.catalogueTitle}>{catalogue.titleAr}</Text>
            <Text style={styles. validDate}>
              {t('flyers.validUntil')}: {catalogue.endDate}
            </Text>
          </View>
        </View>

        {/* Flyer Page Viewer - Only show if pages exist */}
        {hasPages ?  (
          <View style={styles.pageContainer}>
            <Image
              source={{ uri:  currentPageData?.imageUrl }}
              style={styles.pageImage}
              resizeMode="contain"
            />

            {/* Page Navigation */}
            <View style={styles.pageNavigation}>
              <TouchableOpacity
                style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
                onPress={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <Ionicons
                  name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
                  size={24}
                  color={currentPage === 0 ? colors.gray[400] : colors.white}
                />
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                {currentPage + 1} / {catalogue.pages. length}
              </Text>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  currentPage === catalogue. pages.length - 1 && styles. navButtonDisabled,
                ]}
                onPress={() => setCurrentPage(p => Math.min(catalogue. pages.length - 1, p + 1))}
                disabled={currentPage === catalogue.pages.length - 1}
              >
                <Ionicons
                  name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={24}
                  color={currentPage === catalogue.pages.length - 1 ? colors.gray[400] : colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* No pages - show PDF directly */
          <View style={styles.noPagesContainer}>
            <Ionicons name="document-text" size={64} color={colors.primary} />
            <Text style={styles. noPagesText}>
              هذا الكتالوج متوفر كملف PDF فقط
            </Text>
            <TouchableOpacity
              style={styles.viewPdfButton}
              onPress={handleOpenPDF}
              disabled={loadingPdf}
            >
              <Ionicons name="eye-outline" size={20} color={colors. white} />
              <Text style={styles.viewPdfButtonText}>
                {loadingPdf ?  'جاري التحميل...' : 'عرض الكتالوج PDF'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Save Page Button - Only show if pages exist */}
        {hasPages && (
          <View style={styles.savePageSection}>
            <SavePageButton
              isSaved={isPageSaved}
              onPress={handleSavePage}
            />
            {catalogue.pdfUrl && (
              <TouchableOpacity
                style={[
                  styles.pdfButton,
                  loadingPdf && styles.pdfButtonDisabled
                ]}
                onPress={handleOpenPDF}
                disabled={loadingPdf}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={loadingPdf ? colors.gray[400] : colors. primary}
                />
                <Text style={[
                  styles.pdfButtonText,
                  loadingPdf && styles.pdfButtonTextDisabled
                ]}>
                  {loadingPdf ?  'جاري التحميل.. .' : 'عرض PDF'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Offers on Current Page */}
        {pageOffers. length > 0 && (
          <View style={styles. offersSection}>
            <Text style={styles.sectionTitle}>عروض هذه الصفحة ({pageOffers.length})</Text>
            <View style={styles.offersGrid}>
              {pageOffers. map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onPress={() => handleOfferPress(offer)}
                  onAddToBasket={() => handleAddToBasket(offer)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles. bottomPadding} />
      </ScrollView>

      {/* PDF Viewer Modal - Old iframe version */}
      {/* Kept for backward compatibility but hidden by default */}
      {showPDF && false && (
        <CataloguePDFViewer
          visible={showPDF}
          pdfUrl={pdfUrl || catalogue.pdfUrl}
          catalogueTitle={catalogue.titleAr}
          onClose={() => {
            addDebugLog('🔒 Closing PDF modal');
            setShowPDF(false);
          }}
        />
      )}

      {/* New PDF Page Viewer Modal */}
      {showPDFPageViewer && (
        <PDFPageViewer
          visible={showPDFPageViewer}
          pdfUrl={pdfUrl || catalogue.pdfUrl}
          catalogueTitle={catalogue.titleAr}
          catalogueId={catalogue.id}
          storeId={catalogue.storeId}
          storeName={store?.nameAr || ''}
          onClose={() => {
            addDebugLog('🔒 Closing PDF page viewer');
            setShowPDFPageViewer(false);
          }}
          onSavePage={handleSavePdfPage}
          savedPageNumbers={savedPdfPageNumbers}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container:  {
    flex:  1,
    backgroundColor: colors.backgroundSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent:  'center',
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
  headerButton: {
    padding: spacing.sm,
  },
  debugBanner: {
    backgroundColor: colors. warning,
    padding:  spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors. gray[300],
  },
  debugText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  debugTextSmall: {
    fontSize: typography.fontSize. xs,
    color:  colors.textSecondary,
    marginTop: spacing. xs,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems:  'center',
    backgroundColor: colors.white,
    padding:  spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  storeLogo:  {
    width:  50,
    height:  50,
    borderRadius: borderRadius.md,
    backgroundColor:  colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing. md,
    marginLeft: I18nManager.isRTL ? spacing.md :  0,
  },
  headerInfo: {
    flex: 1,
  },
  catalogueTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  validDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  pageContainer: {
    backgroundColor: colors. gray[900],
    margin: spacing. md,
    borderRadius: borderRadius. lg,
    overflow: 'hidden',
  },
  pageImage: {
    width: '100%',
    height: 400,
    backgroundColor: colors. gray[200],
  },
  pageNavigation: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor:  'rgba(0,0,0,0.7)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors. primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors. gray[600],
  },
  pageIndicator: {
    color: colors. white,
    fontSize: typography.fontSize. md,
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
    fontSize: typography. fontSize.md,
    color:  colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  viewPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  viewPdfButtonText: {
    color: colors.white,
    fontSize:  typography.fontSize.md,
    fontWeight: '600',
  },
  savePageSection: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    paddingHorizontal:  spacing.md,
    paddingVertical:  spacing.sm,
    gap: spacing.sm,
  },
  pdfButton:  {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing. sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor:  colors.primary,
  },
  pdfButtonDisabled: {
    borderColor: colors.gray[300],
  },
  pdfButtonText: {
    fontSize: typography.fontSize. md,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  pdfButtonTextDisabled: {
    color: colors.gray[400],
  },
  offersSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing. md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  offersGrid: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bottomPadding: {
    height: spacing.xl,
  },
});