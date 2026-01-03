// src/app/admin/dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  I18nManager,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import {
  getLocalCatalogues,
  createLocalCatalogue,
  deleteLocalCatalogue,
  generatePdfFilename,
  getUploadInstructions,
  checkPdfExists,
  LocalCatalogueMetadata,
} from '../../services/localAdminService';

export default function AdminDashboard() {
  const [catalogues, setCatalogues] = useState<LocalCatalogueMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Form state
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Instructions modal
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsText, setInstructionsText] = useState('');
  const [generatedFileName, setGeneratedFileName] = useState('');

  useEffect(() => {
    loadCatalogues();
  }, []);

  const loadCatalogues = async () => {
    try {
      setLoading(true);
      const data = await getLocalCatalogues();
      setCatalogues(data);
    } catch (error:  any) {
      Alert.alert('خطأ', 'فشل تحميل الكتالوجات:  ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCatalogues();
  };

  const resetForm = () => {
    setTitleAr('');
    setTitleEn('');
    setStoreId('');
    setStoreName('');
    setStartDate('');
    setEndDate('');
  };

  const validateForm = (): boolean => {
    if (! titleAr. trim()) {
      Alert.alert('خطأ', 'يرجى إدخال العنوان بالعربية');
      return false;
    }
    if (!titleEn.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال العنوان بالإنجليزية');
      return false;
    }
    if (!storeId. trim()) {
      Alert.alert('خطأ', 'يرجى إدخال معرف المتجر');
      return false;
    }
    if (!storeName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المتجر');
      return false;
    }
    if (!startDate.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال تاريخ البداية (YYYY-MM-DD)');
      return false;
    }
    if (!endDate.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال تاريخ النهاية (YYYY-MM-DD)');
      return false;
    }
    return true;
  };

  const handleCreateCatalogue = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const pdfFileName = generatePdfFilename(storeId. trim(), startDate.trim(), endDate.trim());

      // Create the catalogue entry
      await createLocalCatalogue(
        {
          titleAr:  titleAr.trim(),
          titleEn: titleEn. trim(),
          storeId:  storeId.trim(),
          storeName: storeName.trim(),
          startDate: startDate. trim(),
          endDate: endDate.trim(),
        },
        pdfFileName
      );

      // Show instructions for adding the PDF file
      const instructions = getUploadInstructions(pdfFileName);
      setInstructionsText(instructions);
      setGeneratedFileName(pdfFileName);
      setShowInstructions(true);

      // Reset form and reload
      resetForm();
      setShowUploadForm(false);
      loadCatalogues();

    } catch (error:  any) {
      Alert.alert('خطأ', 'فشل إنشاء الكتالوج: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (catalogue: LocalCatalogueMetadata) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف كتالوج "${catalogue.titleAr}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress:  async () => {
            try {
              await deleteLocalCatalogue(catalogue.id);
              Alert.alert('نجح', 'تم حذف الكتالوج\n\nلا تنسَ حذف ملف PDF من:\npublic/catalogues/' + catalogue.pdfFileName);
              loadCatalogues();
            } catch (error:  any) {
              Alert.alert('خطأ', 'فشل حذف الكتالوج: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleCheckPdf = async (catalogue: LocalCatalogueMetadata) => {
    const exists = await checkPdfExists(catalogue.pdfFileName);
    if (exists) {
      Alert.alert('✅ موجود', `ملف PDF موجود:\n${catalogue.pdfFileName}`);
    } else {
      Alert.alert(
        '❌ غير موجود',
        `ملف PDF غير موجود!\n\nيرجى نسخ الملف إلى:\npublic/catalogues/${catalogue.pdfFileName}`
      );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles. loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل الكتالوجات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Instructions Modal */}
      <Modal
        visible={showInstructions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 تعليمات إضافة PDF</Text>
              <TouchableOpacity onPress={() => setShowInstructions(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>الخطوة 1: انسخ ملف PDF</Text>
                <Text style={styles.instructionText}>
                  انسخ ملف PDF الخاص بالكتالوج إلى المجلد التالي في مشروعك:
                </Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>public/catalogues/</Text>
                </View>
              </View>

              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>الخطوة 2: أعد تسمية الملف</Text>
                <Text style={styles. instructionText}>
                  تأكد من أن اسم الملف هو بالضبط:
                </Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeTextHighlight}>{generatedFileName}</Text>
                </View>
              </View>

              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>الخطوة 3: أعد تشغيل التطبيق</Text>
                <Text style={styles.instructionText}>
                  أعد تشغيل خادم التطوير لتحديث الملفات:
                </Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>npm start</Text>
                </View>
              </View>

              <View style={[styles.instructionBox, styles. warningBox]}>
                <Text style={styles.warningTitle}>⚠️ ملاحظة مهمة</Text>
                <Text style={styles.warningText}>
                  لإضافة الكتالوج بشكل دائم، أضف اسم الملف أيضاً إلى:
                </Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>src/data/catalogueRegistry.ts</Text>
                </View>
                <Text style={styles.warningText}>
                  في مصفوفة PDF_FILES
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.modalButtonText}>فهمت</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showUploadForm ?  (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>إضافة كتالوج جديد</Text>
            <Text style={styles.formSubtitle}>
              أدخل بيانات الكتالوج ثم انسخ ملف PDF يدوياً
            </Text>

            {/* Title Arabic */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>العنوان (عربي) *</Text>
              <TextInput
                style={styles.input}
                value={titleAr}
                onChangeText={setTitleAr}
                placeholder="مثال: عروض كازيون ديسمبر"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Title English */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>العنوان (إنجليزي) *</Text>
              <TextInput
                style={styles.input}
                value={titleEn}
                onChangeText={setTitleEn}
                placeholder="Example: Kazyon December Offers"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Store ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>معرف المتجر * (بالإنجليزية، بدون مسافات)</Text>
              <TextInput
                style={styles.input}
                value={storeId}
                onChangeText={setStoreId}
                placeholder="مثال: kazyon أو carrefour"
                placeholderTextColor={colors.gray[400]}
                autoCapitalize="none"
              />
            </View>

            {/* Store Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم المتجر (عربي) *</Text>
              <TextInput
                style={styles.input}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="مثال: كازيون"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>تاريخ البداية * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="مثال:  2026-01-01"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* End Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>تاريخ النهاية * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="مثال: 2026-01-15"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Preview filename */}
            {storeId && startDate && endDate && (
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>اسم ملف PDF المطلوب: </Text>
                <Text style={styles.previewText}>
                  {generatePdfFilename(storeId, startDate, endDate)}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  setShowUploadForm(false);
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleCreateCatalogue}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>إنشاء الكتالوج</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>الكتالوجات المحلية</Text>
              <Text style={styles.headerSubtitle}>
                {catalogues.length} {catalogues.length === 1 ? 'كتالوج' : 'كتالوجات'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowUploadForm(true)}
            >
              <Ionicons name="add" size={24} color={colors.white} />
              <Text style={styles.uploadButtonText}>إضافة كتالوج</Text>
            </TouchableOpacity>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles. infoBannerText}>
              وضع التطوير المحلي - الكتالوجات تُحفظ في المتصفح وتحتاج لنسخ ملفات PDF يدوياً
            </Text>
          </View>

          {/* Catalogues List */}
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {catalogues.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={80} color={colors.gray[300]} />
                <Text style={styles.emptyText}>لا توجد كتالوجات حتى الآن</Text>
                <Text style={styles.emptySubtext}>
                  اضغط على "إضافة كتالوج" لإنشاء كتالوج جديد
                </Text>
              </View>
            ) : (
              catalogues.map((catalogue) => (
                <View key={catalogue. id} style={styles.catalogueCard}>
                  <View style={styles.catalogueHeader}>
                    <View style={styles.catalogueInfo}>
                      <Ionicons name="document-text" size={24} color={colors.primary} />
                      <View style={styles.catalogueTitles}>
                        <Text style={styles.catalogueTitle}>{catalogue.titleAr}</Text>
                        <Text style={styles.catalogueSubtitle}>{catalogue.titleEn}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(catalogue)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles. catalogueMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{catalogue.storeName} ({catalogue.storeId})</Text>
                    </View>
                    <View style={styles. metaItem}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles. metaText}>
                        {formatDate(catalogue.startDate)} - {formatDate(catalogue.endDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles. catalogueFile}>
                    <View style={styles.fileInfo}>
                      <Ionicons name="document" size={16} color={colors.gray[500]} />
                      <Text style={styles.fileName}>{catalogue.pdfFileName}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.checkButton}
                      onPress={() => handleCheckPdf(catalogue)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                      <Text style={styles.checkButtonText}>تحقق</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
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
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' :  'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth:  1,
    borderBottomColor: colors.gray[200],
  },
  headerInfo:  {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors. text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: I18nManager. isRTL ? 'right' : 'left',
  },
  uploadButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' :  'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical:  spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoBannerText:  {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    textAlign: I18nManager. isRTL ? 'right' : 'left',
  },
  listContainer: {
    flex: 1,
    padding: spacing.md,
  },
  emptyContainer: {
    flex:  1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors. text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize:  typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  catalogueCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing. md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  catalogueHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' :  'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom:  spacing.sm,
  },
  catalogueInfo: {
    flexDirection:  I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  catalogueTitles: {
    flex: 1,
  },
  catalogueTitle: {
    fontSize: typography.fontSize. md,
    fontWeight: '600',
    color: colors.text,
    textAlign: I18nManager. isRTL ? 'right' : 'left',
  },
  catalogueSubtitle: {
    fontSize: typography. fontSize.sm,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  catalogueMeta: {
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection:  I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  catalogueFile: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' :  'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  fileInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing. xs,
    flex: 1,
  },
  fileName: {
    fontSize:  typography.fontSize.xs,
    color: colors.gray[600],
    fontFamily: 'monospace',
  },
  checkButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.xs,
  },
  checkButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: spacing.xxl,
  },
  // Form styles
  formContainer: {
    flex: 1,
    padding: spacing.md,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  formTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom:  spacing.xs,
  },
  formSubtitle: {
    fontSize:  typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    backgroundColor: colors.gray[50],
  },
  previewBox: {
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  previewLabel: {
    fontSize: typography. fontSize.sm,
    color: colors.primary,
    marginBottom: spacing. xs,
    textAlign: I18nManager. isRTL ? 'right' : 'left',
  },
  previewText: {
    fontSize: typography.fontSize. md,
    color: colors. primary,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  formActions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding:  spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize. md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding:  spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled:  {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize:  typography.fontSize.md,
    color: colors.white,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' :  'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors. gray[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding:  spacing.md,
  },
  instructionBox: {
    marginBottom: spacing.lg,
  },
  instructionTitle: {
    fontSize: typography. fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing. xs,
    textAlign: I18nManager. isRTL ? 'right' : 'left',
  },
  instructionText: {
    fontSize: typography.fontSize. sm,
    color: colors. textSecondary,
    marginBottom: spacing.sm,
    textAlign: I18nManager. isRTL ? 'right' : 'left',
  },
  codeBox: {
    backgroundColor:  colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  codeText: {
    fontSize: typography. fontSize.sm,
    fontFamily: 'monospace',
    color: colors.text,
    textAlign: 'center',
  },
  codeTextHighlight: {
    fontSize: typography.fontSize.md,
    fontFamily: 'monospace',
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor:  '#FFF3E0',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  warningTitle: {
    fontSize:  typography.fontSize.md,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: spacing.xs,
    textAlign: I18nManager. isRTL ? 'right' : 'left',
  },
  warningText: {
    fontSize: typography.fontSize. sm,
    color: '#E65100',
    marginBottom:  spacing.sm,
    textAlign: I18nManager.isRTL ? 'right' :  'left',
  },
  modalButton: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.white,
    fontSize: typography.fontSize. md,
    fontWeight: '600',
  },
});