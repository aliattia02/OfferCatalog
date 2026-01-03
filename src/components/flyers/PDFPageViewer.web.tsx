import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { PDFThumbnailStrip } from './PDFThumbnailStrip';

// Import pdfjs-dist for web
let pdfjsLib: any = null;
if (typeof window !== 'undefined') {
  pdfjsLib = require('pdfjs-dist');
  // Set worker source to CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFPageViewerProps {
  pdfUrl: string;
  catalogueTitle: string;
  catalogueId: string;
  storeId: string;
  storeName: string;
  visible: boolean;
  onClose: () => void;
  onSavePage: (pageNumber: number, pageImageUri: string) => void;
  savedPageNumbers?: number[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH - spacing.md * 2;

export const PDFPageViewer: React.FC<PDFPageViewerProps> = ({
  pdfUrl,
  catalogueTitle,
  catalogueId,
  storeId,
  storeName,
  visible,
  onClose,
  onSavePage,
  savedPageNumbers = [],
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<{ [key: number]: string }>({});
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const pdfDocRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    if (visible && pdfUrl && pdfjsLib) {
      loadPDF();
    }

    return () => {
      // Cleanup
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [visible, pdfUrl]);

  // Render current page when it changes
  useEffect(() => {
    if (pdfDocRef.current && !renderedPages[currentPage + 1]) {
      renderPage(currentPage + 1);
    }
  }, [currentPage, pdfDocRef.current]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);

      // Render first page
      await renderPage(1);

      // Generate thumbnails for first few pages
      generateThumbnails(pdf);

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError(err.message || 'فشل تحميل ملف PDF');
      setLoading(false);
    }
  };

  const renderPage = async (pageNumber: number) => {
    if (!pdfDocRef.current || renderedPages[pageNumber]) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.error('Failed to get 2D context from canvas');
        return null;
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      setRenderedPages(prev => ({
        ...prev,
        [pageNumber]: dataUrl,
      }));

      return dataUrl;
    } catch (err) {
      console.error(`Error rendering page ${pageNumber}:`, err);
      return null;
    }
  };

  const generateThumbnails = async (pdf: any) => {
    // Generate thumbnails for first 10 pages
    const maxThumbnails = Math.min(10, pdf.numPages);

    for (let i = 1; i <= maxThumbnails; i++) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Lower scale for thumbnails

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          console.error('Failed to get 2D context for thumbnail canvas');
          continue;
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        setThumbnails(prev => ({
          ...prev,
          [i]: dataUrl,
        }));
      } catch (err) {
        console.error(`Error generating thumbnail for page ${i}:`, err);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSavePage = async () => {
    const pageNumber = currentPage + 1;
    const pageImageUri = renderedPages[pageNumber];

    if (!pageImageUri) {
      Alert.alert('خطأ', 'لم يتم تحميل الصفحة بعد');
      return;
    }

    if (savedPageNumbers.includes(pageNumber)) {
      Alert.alert('تنبيه', 'تم حفظ هذه الصفحة مسبقاً');
      return;
    }

    onSavePage(pageNumber, pageImageUri);
  };

  const isPageSaved = savedPageNumbers.includes(currentPage + 1);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>
              {catalogueTitle}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>جاري تحميل الكتالوج...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPDF}>
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && totalPages > 0 && (
          <>
            {/* Page Display */}
            <ScrollView
              style={styles.pageContainer}
              contentContainerStyle={styles.pageContent}
            >
              {renderedPages[currentPage + 1] ? (
                <img
                  src={renderedPages[currentPage + 1]}
                  style={{
                    width: PAGE_WIDTH,
                    maxHeight: SCREEN_HEIGHT * 0.6,
                    objectFit: 'contain',
                  }}
                  alt={`Page ${currentPage + 1}`}
                />
              ) : (
                <View style={styles.pageLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.pageLoadingText}>
                    جاري تحميل الصفحة {currentPage + 1}...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Navigation Controls */}
            <View style={styles.navigationContainer}>
              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentPage === 0 && styles.navButtonDisabled,
                  ]}
                  onPress={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
                    size={24}
                    color={currentPage === 0 ? colors.gray[400] : colors.white}
                  />
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                  {currentPage + 1} / {totalPages}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentPage === totalPages - 1 && styles.navButtonDisabled,
                  ]}
                  onPress={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={24}
                    color={currentPage === totalPages - 1 ? colors.gray[400] : colors.white}
                  />
                </TouchableOpacity>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isPageSaved && styles.saveButtonSaved,
                ]}
                onPress={handleSavePage}
                disabled={isPageSaved}
              >
                <Ionicons
                  name={isPageSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isPageSaved ? colors.white : colors.primary}
                />
                <Text style={[
                  styles.saveButtonText,
                  isPageSaved && styles.saveButtonTextSaved,
                ]}>
                  {isPageSaved ? 'تم الحفظ' : 'حفظ الصفحة'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Thumbnail Strip */}
            <PDFThumbnailStrip
              totalPages={totalPages}
              currentPage={currentPage}
              onPageSelect={setCurrentPage}
              thumbnails={thumbnails}
              savedPageNumbers={savedPageNumbers}
            />
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  placeholder: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pageLoadingContainer: {
    width: PAGE_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
  },
  pageLoadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  navigationContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  navigationButtons: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  pageIndicator: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  saveButtonSaved: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  saveButtonTextSaved: {
    color: colors.white,
  },
});

export default PDFPageViewer;
