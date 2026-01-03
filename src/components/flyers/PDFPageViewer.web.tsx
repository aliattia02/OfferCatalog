import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as pdfjsLib from 'pdfjs-dist';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import type { PDFPageViewerProps, PageData } from '../../types';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PDFPageViewer: React.FC<PDFPageViewerProps> = ({
  pdfUrl,
  catalogueTitle,
  catalogueId,
  visible,
  onClose,
  onSavePage,
  savedPages = [],
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCache, setPageCache] = useState<Map<number, PageData>>(new Map());
  const [renderingPage, setRenderingPage] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  useEffect(() => {
    if (!visible || !pdfUrl) return;

    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        console.log('Loading PDF:', pdfUrl);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
        
        console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError(err.message || 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      // Cleanup
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [visible, pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !visible || currentPage < 1 || currentPage > totalPages) return;

    // Check if page is already cached
    if (pageCache.has(currentPage)) {
      return;
    }

    renderPage(currentPage);
  }, [pdfDoc, currentPage, visible, zoomLevel]);

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || renderingPage) return;

    setRenderingPage(true);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoomLevel });

      const canvas = canvasRef.current;
      if (!canvas) {
        setRenderingPage(false);
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        setRenderingPage(false);
        return;
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Cache the rendered page as data URL
      const imageDataUrl = canvas.toDataURL('image/png');
      const pageData: PageData = {
        pageNumber: pageNum,
        imageDataUrl,
        width: viewport.width,
        height: viewport.height,
      };

      setPageCache(prev => new Map(prev).set(pageNum, pageData));
      
      console.log(`Page ${pageNum} rendered successfully`);
    } catch (err: any) {
      console.error(`Error rendering page ${pageNum}:`, err);
      setError(`Failed to render page ${pageNum}`);
    } finally {
      setRenderingPage(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSavePage = () => {
    const cachedPage = pageCache.get(currentPage);
    if (cachedPage && onSavePage) {
      onSavePage(currentPage, cachedPage.imageDataUrl);
    }
  };

  const handleThumbnailClick = (pageNum: number) => {
    setCurrentPage(pageNum);
    setShowThumbnails(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const isPageSaved = savedPages.includes(currentPage);
  const cachedPage = pageCache.get(currentPage);

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
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>
              {catalogueTitle}
            </Text>
            <Text style={styles.pageInfo}>
              {currentPage} / {totalPages}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowThumbnails(!showThumbnails)} 
            style={styles.headerButton}
          >
            <Ionicons name="grid-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>جاري تحميل الكتالوج...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.errorTitle}>فشل تحميل PDF</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.errorButton}
            >
              <Text style={styles.errorButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PDF Content */}
        {!loading && !error && pdfDoc && (
          <>
            {/* Canvas Container */}
            <ScrollView
              style={styles.canvasContainer}
              contentContainerStyle={styles.canvasContentContainer}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={true}
            >
              <View style={styles.canvasWrapper}>
                {cachedPage ? (
                  <img 
                    src={cachedPage.imageDataUrl} 
                    alt={`Page ${currentPage}`}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                ) : (
                  <View style={styles.renderingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.renderingText}>جاري تحميل الصفحة...</Text>
                  </View>
                )}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
              </View>
            </ScrollView>

            {/* Bottom Toolbar */}
            <View style={styles.toolbar}>
              {/* Navigation */}
              <View style={styles.toolbarSection}>
                <TouchableOpacity
                  style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
                  onPress={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
                    size={24}
                    color={currentPage === 1 ? colors.gray[400] : colors.white}
                  />
                </TouchableOpacity>
                
                <Text style={styles.pageIndicator}>
                  {currentPage} / {totalPages}
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentPage === totalPages && styles.navButtonDisabled,
                  ]}
                  onPress={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={24}
                    color={currentPage === totalPages ? colors.gray[400] : colors.white}
                  />
                </TouchableOpacity>
              </View>

              {/* Zoom Controls */}
              <View style={styles.toolbarSection}>
                <TouchableOpacity
                  style={styles.zoomButton}
                  onPress={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <Ionicons name="remove" size={20} color={colors.white} />
                </TouchableOpacity>
                
                <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
                
                <TouchableOpacity
                  style={styles.zoomButton}
                  onPress={handleZoomIn}
                  disabled={zoomLevel >= 3}
                >
                  <Ionicons name="add" size={20} color={colors.white} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.zoomButton}
                  onPress={handleZoomReset}
                >
                  <Ionicons name="refresh" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>

              {/* Save Button */}
              {onSavePage && (
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    isPageSaved && styles.saveButtonActive,
                  ]}
                  onPress={handleSavePage}
                  disabled={!cachedPage || isPageSaved}
                >
                  <Ionicons
                    name={isPageSaved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isPageSaved ? colors.white : colors.primary}
                  />
                  <Text
                    style={[
                      styles.saveButtonText,
                      isPageSaved && styles.saveButtonTextActive,
                    ]}
                  >
                    {isPageSaved ? 'تم الحفظ' : 'حفظ'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Thumbnail Strip */}
            {showThumbnails && (
              <View style={styles.thumbnailOverlay}>
                <View style={styles.thumbnailContainer}>
                  <View style={styles.thumbnailHeader}>
                    <Text style={styles.thumbnailTitle}>جميع الصفحات</Text>
                    <TouchableOpacity onPress={() => setShowThumbnails(false)}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.thumbnailScroll}>
                    <View style={styles.thumbnailGrid}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <TouchableOpacity
                          key={pageNum}
                          style={[
                            styles.thumbnailItem,
                            pageNum === currentPage && styles.thumbnailItemActive,
                          ]}
                          onPress={() => handleThumbnailClick(pageNum)}
                        >
                          <View style={styles.thumbnailPlaceholder}>
                            <Ionicons name="document-outline" size={32} color={colors.gray[400]} />
                            <Text style={styles.thumbnailNumber}>{pageNum}</Text>
                          </View>
                          {savedPages.includes(pageNum) && (
                            <View style={styles.thumbnailBadge}>
                              <Ionicons name="bookmark" size={12} color={colors.white} />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}
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
  headerButton: {
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
  },
  pageInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  canvasContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  canvasWrapper: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    minHeight: 400,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renderingOverlay: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  renderingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  toolbar: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.9)',
    gap: spacing.sm,
  },
  toolbarSection: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    minWidth: 60,
    textAlign: 'center',
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  saveButtonTextActive: {
    color: colors.white,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: '90%',
    maxWidth: 600,
    height: '80%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  thumbnailHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  thumbnailTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  thumbnailScroll: {
    flex: 1,
  },
  thumbnailGrid: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  thumbnailItem: {
    width: 100,
    height: 140,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailItemActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  thumbnailBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
});

export default PDFPageViewer;
