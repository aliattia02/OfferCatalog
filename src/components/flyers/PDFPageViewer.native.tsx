import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
  I18nManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { PDFThumbnailStrip } from './PDFThumbnailStrip';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef<any>(null);

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setLoading(false);
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleError = (error: any) => {
    console.error('PDF Error:', error);
    Alert.alert('خطأ', 'فشل تحميل ملف PDF');
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSavePage = () => {
    const pageNumber = currentPage;

    if (savedPageNumbers.includes(pageNumber)) {
      Alert.alert('تنبيه', 'تم حفظ هذه الصفحة مسبقاً');
      return;
    }

    // For native, we'll use a placeholder image URI
    // In a production app, you'd capture the actual page view here
    const pageImageUri = `pdf://${catalogueId}/page/${pageNumber}`;
    
    onSavePage(pageNumber, pageImageUri);
  };

  const isPageSaved = savedPageNumbers.includes(currentPage);

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

        {/* PDF Viewer */}
        <View style={styles.pdfContainer}>
          <Pdf
            ref={pdfRef}
            source={{ uri: pdfUrl, cache: true }}
            page={currentPage}
            horizontal={false}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            style={styles.pdf}
            enablePaging={true}
            spacing={0}
          />
        </View>

        {/* Navigation Controls */}
        {!loading && totalPages > 0 && (
          <>
            <View style={styles.navigationContainer}>
              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentPage === 1 && styles.navButtonDisabled,
                  ]}
                  onPress={handlePrevPage}
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
              currentPage={currentPage - 1} // Adjust for 0-based indexing
              onPageSelect={(pageIndex) => setCurrentPage(pageIndex + 1)}
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
    ...Platform.select({
      ios: {
        paddingTop: spacing.xl,
      },
    }),
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
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    backgroundColor: colors.gray[100],
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
