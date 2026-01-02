import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log('=== PDF VIEWER DEBUG ===');
      console.log('Modal opened');
      console.log('PDF URL:', pdfUrl);
      console.log('Catalogue:', catalogueTitle);

      // Test if PDF is accessible
      fetch(pdfUrl, { method: 'HEAD' })
        .then(response => {
          console.log('PDF fetch status:', response.status);
          console.log('Content-Type:', response.headers.get('content-type'));
          console.log('Content-Length:', response.headers.get('content-length'));

          if (!response.ok) {
            setPdfError(`HTTP ${response.status}: ${response.statusText}`);
          }
        })
        .catch(error => {
          console.error('PDF fetch error:', error);
          setPdfError(error.message);
        });

      console.log('======================');
    }
  }, [visible, pdfUrl]);

  if (!visible) return null;

  const handleIframeLoad = () => {
    console.log('✅ PDF iframe loaded successfully');
    setPdfLoaded(true);
  };

  const handleIframeError = (error: any) => {
    console.error('❌ PDF iframe error:', error);
    setPdfError('Failed to load PDF in iframe');
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
            {__DEV__ && (
              <Text style={styles.debugUrl} numberOfLines={1}>
                {pdfUrl}
              </Text>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugBanner}>
            <Text style={styles.debugText}>
              🐛 PDF Status: {pdfLoaded ? '✅ Loaded' : '⏳ Loading'}
              {pdfError && ` | ❌ Error: ${pdfError}`}
            </Text>
            <TouchableOpacity
              onPress={() => {
                console.log('Opening PDF in new tab:', pdfUrl);
                window.open(pdfUrl, '_blank');
              }}
              style={styles.debugButton}
            >
              <Text style={styles.debugButtonText}>
                🔗 Open in New Tab (for testing)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Display */}
        {pdfError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.errorTitle}>فشل تحميل PDF</Text>
            <Text style={styles.errorMessage}>{pdfError}</Text>
            <Text style={styles.errorUrl}>المسار: {pdfUrl}</Text>
            <TouchableOpacity
              onPress={() => window.open(pdfUrl, '_blank')}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>فتح في نافذة جديدة</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Web PDF Viewer using iframe */}
        <View style={styles.pdfContainer}>
          <iframe
            src={pdfUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={catalogueTitle}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </View>

        {/* Loading Overlay */}
        {!pdfLoaded && !pdfError && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>جاري تحميل الكتالوج...</Text>
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
  debugUrl: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  placeholder: {
    width: 44,
  },
  debugBanner: {
    backgroundColor: colors.warning,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  debugText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  debugButton: {
    backgroundColor: colors.white,
    padding: spacing.xs,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  debugButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
  },
  pdfContainer: {
    flex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 400,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    marginBottom: spacing.sm,
  },
  errorUrl: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
});

export default CataloguePDFViewer;