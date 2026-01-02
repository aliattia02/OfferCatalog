<<<<<<< HEAD
import React, { useState, useMemo, useEffect } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  I18nManager,
<<<<<<< HEAD
  Alert,
  Platform,
=======
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Button } from '../../components/common';
<<<<<<< HEAD
import { OfferCard, CataloguePDFViewer, SavePageButton } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useLocalized } from '../../hooks';
import { addToBasket, addPageToBasket } from '../../store/slices/basketSlice';
=======
import { OfferCard } from '../../components/flyers';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useLocalized } from '../../hooks';
import { addToBasket } from '../../store/slices/basketSlice';
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
import { getCatalogueById, getOfferById } from '../../data/offers';
import type { Offer } from '../../types';

const { width } = Dimensions.get('window');

export default function FlyerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { getTitle, getName } = useLocalized();
  
  const [currentPage, setCurrentPage] = useState(0);
<<<<<<< HEAD
  const [showPDF, setShowPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const catalogue = getCatalogueById(id);
  const stores = useAppSelector(state => state.stores.stores);
  const basketItems = useAppSelector(state => state.basket.items);
  const store = stores.find(s => s.id === catalogue?.storeId);

  // DEBUG: Log catalogue data on mount
  useEffect(() => {
    console.log('=== FLYER DETAIL DEBUG ===');
    console.log('Catalogue ID:', id);
    console.log('Catalogue found:', catalogue);
    console.log('PDF URL from catalogue:', catalogue?.pdfUrl);
    console.log('Platform:', Platform.OS);
    console.log('========================');

    addDebugLog(`Catalogue ID: ${id}`);
    addDebugLog(`Platform: ${Platform.OS}`);
    addDebugLog(`PDF URL: ${catalogue?.pdfUrl || 'NOT SET'}`);
  }, [id, catalogue]);

  const addDebugLog = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log('[PDF Debug]', message);
  };

  // Check if current page is saved
  const isPageSaved = useMemo(() => {
    if (!catalogue) return false;
    return basketItems.some(
      item =>
        item.type === 'page' &&
        item.cataloguePage?.catalogueId === catalogue.id &&
        item.cataloguePage?.pageNumber === currentPage + 1
    );
  }, [basketItems, catalogue, currentPage]);

  // Load PDF URL on mount
  useEffect(() => {
    if (catalogue?.pdfUrl) {
      loadPdfUrl();
    } else {
      addDebugLog('❌ No PDF URL in catalogue');
    }
  }, [catalogue?.pdfUrl]);

  const loadPdfUrl = async () => {
    if (!catalogue?.pdfUrl) {
      addDebugLog('❌ loadPdfUrl called but no PDF URL');
      return;
    }

    setLoadingPdf(true);
    addDebugLog(`🔄 Loading PDF: ${catalogue.pdfUrl}`);

    try {
      if (Platform.OS === 'web') {
        addDebugLog('🌐 Web platform detected');

        // Test if PDF is accessible
        const testUrl = catalogue.pdfUrl;
        addDebugLog(`Testing URL: ${testUrl}`);

        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          addDebugLog(`Fetch response status: ${response.status}`);

          if (response.ok) {
            setPdfUrl(testUrl);
            addDebugLog('✅ PDF URL set successfully');
          } else {
            addDebugLog(`❌ PDF not accessible: ${response.status} ${response.statusText}`);
            Alert.alert(
              'خطأ في تحميل PDF',
              `رمز الخطأ: ${response.status}\nالملف: ${testUrl}\n\nتأكد من وجود الملف في المسار الصحيح.`,
              [
                { text: 'موافق' },
                { text: 'عرض معلومات التصحيح', onPress: showDebugInfo }
              ]
            );
          }
        } catch (fetchError: any) {
          addDebugLog(`❌ Fetch error: ${fetchError.message}`);
          Alert.alert(
            'خطأ في الاتصال',
            `لا يمكن الوصول إلى الملف\nالخطأ: ${fetchError.message}`,
            [
              { text: 'موافق' },
              { text: 'عرض معلومات التصحيح', onPress: showDebugInfo }
            ]
          );
        }
      } else {
        addDebugLog('📱 Native platform detected');

        if (catalogue.pdfUrl.startsWith('http')) {
          addDebugLog('Using remote URL');
          setPdfUrl(catalogue.pdfUrl);
          addDebugLog('✅ PDF URL set (remote)');
        } else {
          addDebugLog('⚠️ Local PDF - requires expo-asset processing');
          setPdfUrl(catalogue.pdfUrl);
          addDebugLog('✅ PDF URL set (local, may need processing)');
        }
      }
    } catch (error: any) {
      addDebugLog(`❌ Error in loadPdfUrl: ${error.message}`);
      console.error('Error loading PDF:', error);
      Alert.alert(
        'خطأ',
        `فشل تحميل ملف PDF\n${error.message}`,
        [
          { text: 'موافق' },
          { text: 'عرض معلومات التصحيح', onPress: showDebugInfo }
        ]
      );
    } finally {
      setLoadingPdf(false);
      addDebugLog('🏁 loadPdfUrl completed');
    }
  };

  const showDebugInfo = () => {
    Alert.alert(
      'معلومات التصحيح',
      debugInfo.join('\n'),
      [
        { text: 'نسخ', onPress: () => {
          // Copy to clipboard if possible
          console.log('Debug Info:', debugInfo.join('\n'));
        }},
        { text: 'موافق' }
      ]
    );
  };

=======
  
  const catalogue = getCatalogueById(id);
  const stores = useAppSelector(state => state.stores.stores);
  const store = stores.find(s => s.id === catalogue?.storeId);

>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
  if (!catalogue || !store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>الكتالوج غير موجود</Text>
        <Button title="العودة" onPress={() => router.back()} />
      </View>
    );
  }

  const currentPageData = catalogue.pages[currentPage];
<<<<<<< HEAD
  const pageOffers = currentPageData?.offers
    .map(offerId => getOfferById(offerId))
    .filter(Boolean) as Offer[];
=======
  const pageOffers = currentPageData?.offers.map(offerId => getOfferById(offerId)).filter(Boolean) as Offer[];
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537

  const handleAddToBasket = (offer: Offer) => {
    dispatch(addToBasket({
      offer,
      storeName: store.nameAr,
    }));
  };

  const handleOfferPress = (offer: Offer) => {
    router.push(`/offer/${offer.id}`);
  };

<<<<<<< HEAD
  const handleOpenPDF = () => {
    addDebugLog('🖱️ PDF button clicked');

    if (!catalogue.pdfUrl) {
      addDebugLog('❌ No PDF URL available');
      Alert.alert('خطأ', 'ملف PDF غير متوفر لهذا الكتالوج');
      return;
    }

    if (!pdfUrl && !loadingPdf) {
      addDebugLog('❌ PDF URL not loaded yet');
      Alert.alert(
        'خطأ',
        'فشل تحميل ملف PDF. يرجى المحاولة مرة أخرى',
        [
          { text: 'إعادة المحاولة', onPress: loadPdfUrl },
          { text: 'معلومات التصحيح', onPress: showDebugInfo },
          { text: 'إلغاء' }
        ]
      );
      return;
    }

    if (loadingPdf) {
      addDebugLog('⏳ Still loading PDF');
      Alert.alert('انتظر', 'جاري تحميل ملف PDF...');
      return;
    }

    addDebugLog(`✅ Opening PDF modal with URL: ${pdfUrl}`);
    setShowPDF(true);
  };

  const handleSavePage = () => {
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

=======
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: getTitle(catalogue),
          headerBackTitle: 'عودة',
<<<<<<< HEAD
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Debug button */}
              <TouchableOpacity
                onPress={showDebugInfo}
                style={styles.headerButton}
              >
                <Ionicons name="bug-outline" size={20} color={colors.gray[600]} />
              </TouchableOpacity>

              {/* PDF button */}
              <TouchableOpacity
                onPress={handleOpenPDF}
                style={styles.headerButton}
                disabled={loadingPdf || !pdfUrl}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={loadingPdf || !pdfUrl ? colors.gray[400] : colors.primary}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Debug Info Banner (visible in development) */}
        {__DEV__ && (
          <View style={styles.debugBanner}>
            <Text style={styles.debugText}>
              🐛 PDF: {pdfUrl ? '✅' : '❌'} | Loading: {loadingPdf ? '⏳' : '✅'}
            </Text>
            <Text style={styles.debugTextSmall}>
              Path: {catalogue.pdfUrl}
            </Text>
          </View>
        )}

=======
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
        {/* Store Header */}
        <View style={styles.header}>
          <Image source={{ uri: store.logo }} style={styles.storeLogo} resizeMode="contain" />
          <View style={styles.headerInfo}>
            <Text style={styles.catalogueTitle}>{getTitle(catalogue)}</Text>
            <Text style={styles.validDate}>
              {t('flyers.validUntil')}: {catalogue.endDate}
            </Text>
          </View>
        </View>

        {/* Flyer Page Viewer */}
        <View style={styles.pageContainer}>
          <Image
            source={{ uri: currentPageData?.imageUrl }}
            style={styles.pageImage}
            resizeMode="contain"
          />
<<<<<<< HEAD

=======
          
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
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
<<<<<<< HEAD

            <Text style={styles.pageIndicator}>
              {currentPage + 1} / {catalogue.pages.length}
            </Text>

=======
            
            <Text style={styles.pageIndicator}>
              {currentPage + 1} / {catalogue.pages.length}
            </Text>
            
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
            <TouchableOpacity
              style={[
                styles.navButton,
                currentPage === catalogue.pages.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={() => setCurrentPage(p => Math.min(catalogue.pages.length - 1, p + 1))}
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

<<<<<<< HEAD
        {/* Save Page Button */}
        <View style={styles.savePageSection}>
          <SavePageButton
            isSaved={isPageSaved}
            onPress={handleSavePage}
          />
          {catalogue.pdfUrl && (
            <TouchableOpacity
              style={[
                styles.pdfButton,
                (loadingPdf || !pdfUrl) && styles.pdfButtonDisabled
              ]}
              onPress={handleOpenPDF}
              disabled={loadingPdf || !pdfUrl}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={loadingPdf || !pdfUrl ? colors.gray[400] : colors.primary}
              />
              <Text style={[
                styles.pdfButtonText,
                (loadingPdf || !pdfUrl) && styles.pdfButtonTextDisabled
              ]}>
                {loadingPdf ? 'جاري التحميل...' : 'عرض PDF'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Offers on Current Page */}
        {pageOffers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.sectionTitle}>عروض هذه الصفحة ({pageOffers.length})</Text>
=======
        {/* Offers on Current Page */}
        {pageOffers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.sectionTitle}>عروض هذه الصفحة</Text>
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
            <View style={styles.offersGrid}>
              {pageOffers.map(offer => (
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

        <View style={styles.bottomPadding} />
      </ScrollView>
<<<<<<< HEAD

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <CataloguePDFViewer
          visible={showPDF}
          pdfUrl={pdfUrl}
          catalogueTitle={getTitle(catalogue)}
          onClose={() => {
            addDebugLog('🔒 Closing PDF modal');
            setShowPDF(false);
          }}
        />
      )}
=======
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
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
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
<<<<<<< HEAD
  headerButton: {
    padding: spacing.sm,
  },
  debugBanner: {
    backgroundColor: colors.warning,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  debugText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  debugTextSmall: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
=======
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
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
    backgroundColor: colors.gray[900],
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  pageImage: {
    width: '100%',
    height: 400,
    backgroundColor: colors.gray[200],
  },
  pageNavigation: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors.gray[600],
  },
  pageIndicator: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
<<<<<<< HEAD
  savePageSection: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pdfButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pdfButtonDisabled: {
    borderColor: colors.gray[300],
  },
  pdfButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  pdfButtonTextDisabled: {
    color: colors.gray[400],
  },
=======
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
  offersSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
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
<<<<<<< HEAD
});
=======
});
>>>>>>> 50d173479f0c2c25463a0dfa16210fb8bd07c537
