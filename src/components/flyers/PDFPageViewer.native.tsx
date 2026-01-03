import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import type { PDFPageViewerProps } from '../../types';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  
  const pdfRef = useRef<any>(null);

  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    console.log(`PDF loaded: ${numberOfPages} pages`);
    setTotalPages(numberOfPages);
    setLoading(false);
  };

  const handlePageChanged = (page: number, numberOfPages: number) => {
    setCurrentPage(page);
  };

  const handleError = (error: any) => {
    console.error('PDF Load Error:', error);
    setLoading(false);
    Alert.alert(
      'خطأ في التحميل',
      'فشل تحميل ملف PDF. يرجى المحاولة مرة أخرى.',
      [{ text: 'موافق', onPress: onClose }]
    );
  };

  const handleSavePage = () => {
    if (onSavePage) {
      // For native, we'll save the page number and URL reference
      // The actual page image would need to be captured differently
      // For now, we'll use a placeholder approach
      onSavePage(currentPage, `${pdfUrl}#page=${currentPage}`);
      Alert.alert('نجح', 'تم حفظ الصفحة في السلة');
    }
  };

  const handleThumbnailClick = (pageNum: number) => {
    if (pdfRef.current) {
      pdfRef.current.setPage(pageNum);
    }
    setShowThumbnails(false);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && pdfRef.current) {
      pdfRef.current.setPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && pdfRef.current) {
      pdfRef.current.setPage(currentPage + 1);
    }
  };

  const isPageSaved = savedPages.includes(currentPage);

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
            {totalPages > 0 && (
              <Text style={styles.pageInfo}>
                {currentPage} / {totalPages}
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowThumbnails(!showThumbnails)} 
            style={styles.headerButton}
          >
            <Ionicons name="grid-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* PDF Viewer */}
        <View style={styles.pdfContainer}>
          <Pdf
            ref={pdfRef}
            source={{ uri: pdfUrl, cache: true }}
            style={styles.pdf}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            trustAllCerts={false}
            enablePaging
            horizontal
            spacing={10}
            page={currentPage}
            renderActivityIndicator={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>جاري تحميل الكتالوج...</Text>
              </View>
            )}
          />
        </View>

        {/* Bottom Toolbar */}
        {!loading && totalPages > 0 && (
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

            {/* Save Button */}
            {onSavePage && (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isPageSaved && styles.saveButtonActive,
                ]}
                onPress={handleSavePage}
                disabled={isPageSaved}
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
        )}

        {/* Thumbnail Strip */}
        {showThumbnails && totalPages > 0 && (
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
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  loadingText: {
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
