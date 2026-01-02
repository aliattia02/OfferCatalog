import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { colors, spacing, typography } from '../../constants/theme';

interface CataloguePDFViewerProps {
  pdfUrl: string;
  catalogueTitle: string;
  visible: boolean;
  onClose: () => void;
}

export const CataloguePDFViewer: React.FC<CataloguePDFViewerProps> = ({
  pdfUrl,
  catalogueTitle,
  visible,
  onClose,
}) => {
  const [numPages, setNumPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);

  if (!visible) return null;

  const handleLoadComplete = (numberOfPages: number) => {
    setNumPages(numberOfPages);
  };

  const handleError = (error: any) => {
    console.error('PDF Load Error:', error);
    Alert.alert(
      'خطأ في التحميل',
      'فشل تحميل ملف PDF. يرجى المحاولة مرة أخرى.',
      [{ text: 'موافق', onPress: onClose }]
    );
  };

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
            {numPages > 0 && (
              <Text style={styles.pageInfo}>
                {currentPage} / {numPages}
              </Text>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* PDF Viewer */}
        <View style={styles.pdfContainer}>
          <Pdf
            source={{ uri: pdfUrl, cache: true }}
            style={styles.pdf}
            onLoadComplete={handleLoadComplete}
            onPageChanged={(page) => setCurrentPage(page)}
            onError={handleError}
            trustAllCerts={false}
            enablePaging
            spacing={10}
            renderActivityIndicator={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>جاري تحميل الكتالوج...</Text>
              </View>
            )}
          />
        </View>
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
  },
  pageInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
});

export default CataloguePDFViewer;