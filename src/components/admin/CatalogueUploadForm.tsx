// src/components/admin/CatalogueUploadForm.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  I18nManager,
  Platform,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';
import { pdfConverter } from '../../utils/pdfToImageConverter';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';

interface CatalogueUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface UploadProgress {
  stage: string;
  current: number;
  total: number;
  percentage: number;
}

export const CatalogueUploadForm: React.FC<CatalogueUploadFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    stage: '',
    current: 0,
    total: 0,
    percentage: 0,
  });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showAlert('خطأ', 'فشل اختيار الملف');
    }
  };

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'موافق', onPress: onOk }] : undefined);
    }
  };

  const validateForm = (): boolean => {
    if (!titleAr.trim()) {
      showAlert('خطأ', 'يرجى إدخال العنوان بالعربية');
      return false;
    }
    if (!titleEn.trim()) {
      showAlert('خطأ', 'يرجى إدخال العنوان بالإنجليزية');
      return false;
    }
    if (!storeId.trim()) {
      showAlert('خطأ', 'يرجى إدخال معرف المتجر');
      return false;
    }
    if (!storeName.trim()) {
      showAlert('خطأ', 'يرجى إدخال اسم المتجر');
      return false;
    }
    if (!startDate.trim()) {
      showAlert('خطأ', 'يرجى إدخال تاريخ البداية');
      return false;
    }
    if (!endDate.trim()) {
      showAlert('خطأ', 'يرجى إدخال تاريخ النهاية');
      return false;
    }
    if (!selectedFile) {
      showAlert('خطأ', 'يرجى اختيار ملف PDF');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateForm() || !selectedFile) {
      return;
    }

    try {
      setUploading(true);

      // Generate catalogue ID
      const catalogueId = `${storeId}_${Date.now()}`;

      console.log('📤 Starting upload process...');

      // STEP 1: Upload PDF to Firebase Storage
      setProgress({
        stage: 'جاري رفع ملف PDF...',
        current: 0,
        total: 4,
        percentage: 0,
      });

      const pdfBlob = await fetch(selectedFile.uri).then(r => r.blob());
      const pdfRef = ref(storage, `catalogues/${catalogueId}.pdf`);
      await uploadBytes(pdfRef, pdfBlob);
      const pdfUrl = await getDownloadURL(pdfRef);

      console.log('✅ PDF uploaded:', pdfUrl);

      // STEP 2: Convert PDF to images
      setProgress({
        stage: 'جاري قراءة معلومات PDF...',
        current: 1,
        total: 4,
        percentage: 25,
      });

      const pdfInfo = await pdfConverter.getPDFInfo(pdfUrl);
      console.log(`📄 PDF has ${pdfInfo.numPages} pages`);

      setProgress({
        stage: 'جاري تحويل الصفحات إلى صور...',
        current: 1,
        total: 4,
        percentage: 25,
      });

      const images = await pdfConverter.convertAllPages(
        pdfUrl,
        2.0,
        (current, total) => {
          const percentage = 25 + (current / total) * 25; // 25-50%
          setProgress({
            stage: `تحويل الصفحة ${current} من ${total}...`,
            current: 1,
            total: 4,
            percentage,
          });
        }
      );

      console.log(`✅ Converted ${images.length} pages to images`);

      // STEP 3: Upload images to Firebase Storage
      setProgress({
        stage: 'جاري رفع صور الصفحات...',
        current: 2,
        total: 4,
        percentage: 50,
      });

      const uploadedPages = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const storageRef = ref(
          storage,
          `catalogue-pages/${catalogueId}/page-${image.pageNumber}.jpg`
        );

        const percentage = 50 + ((i + 1) / images.length) * 25; // 50-75%
        setProgress({
          stage: `رفع الصفحة ${i + 1} من ${images.length}...`,
          current: 2,
          total: 4,
          percentage,
        });

        // Upload base64 image
        await uploadString(storageRef, image.imageDataUrl, 'data_url');
        const imageUrl = await getDownloadURL(storageRef);

        uploadedPages.push({
          pageNumber: image.pageNumber,
          imageUrl,
          offers: [], // Empty initially
        });

        console.log(`Uploaded page ${i + 1}/${images.length}`);
      }

      // STEP 4: Generate cover image (use first page as cover)
      setProgress({
        stage: 'جاري إنشاء صورة الغلاف...',
        current: 3,
        total: 4,
        percentage: 75,
      });

      const coverRef = ref(storage, `catalogue-covers/${catalogueId}.jpg`);
      await uploadString(coverRef, images[0].imageDataUrl, 'data_url');
      const coverImageUrl = await getDownloadURL(coverRef);

      console.log('✅ Cover image created');

      // STEP 5: Create Firestore document
      setProgress({
        stage: 'جاري حفظ البيانات...',
        current: 4,
        total: 4,
        percentage: 90,
      });

      const catalogueData = {
        id: catalogueId,
        storeId: storeId.trim(),
        storeName: storeName.trim(),
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        coverImage: coverImageUrl,
        pdfUrl: pdfUrl,
        pages: uploadedPages,
        totalPages: images.length,
        pdfProcessed: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'catalogues'), catalogueData);

      console.log('✅ Catalogue created in Firestore');

      setProgress({
        stage: 'تمت العملية بنجاح!',
        current: 4,
        total: 4,
        percentage: 100,
      });

      // Show success alert
      showAlert(
        '✅ نجح',
        `تم رفع الكتالوج بنجاح!\n${images.length} صفحة تم تحويلها ورفعها`,
        onSuccess
      );
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      showAlert('❌ خطأ', 'فشل رفع الكتالوج: ' + (error.message || 'حدث خطأ غير متوقع'));
    } finally {
      setUploading(false);
      setProgress({
        stage: '',
        current: 0,
        total: 0,
        percentage: 0,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إضافة كتالوج جديد</Text>
        <TouchableOpacity onPress={onCancel} disabled={uploading}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Enhanced Notice */}
      <View style={styles.noticeBox}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <View style={styles.noticeTextContainer}>
          <Text style={styles.noticeTitle}>معالجة تلقائية</Text>
          <Text style={styles.noticeText}>
            سيتم تلقائياً تحويل ملف PDF إلى صور وحفظها في Firebase Storage. قد تستغرق العملية عدة دقائق حسب حجم الملف.
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        {/* Title (Arabic) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>العنوان (عربي) *</Text>
          <TextInput
            style={styles.input}
            value={titleAr}
            onChangeText={setTitleAr}
            placeholder="كتالوج كازيون 23-29 ديسمبر"
            placeholderTextColor={colors.gray[400]}
            editable={!uploading}
          />
        </View>

        {/* Title (English) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>العنوان (إنجليزي) *</Text>
          <TextInput
            style={styles.input}
            value={titleEn}
            onChangeText={setTitleEn}
            placeholder="Kazyon Catalogue Dec 23-29"
            placeholderTextColor={colors.gray[400]}
            editable={!uploading}
          />
        </View>

        {/* Store ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>معرف المتجر *</Text>
          <TextInput
            style={styles.input}
            value={storeId}
            onChangeText={setStoreId}
            placeholder="kazyon"
            placeholderTextColor={colors.gray[400]}
            autoCapitalize="none"
            editable={!uploading}
          />
        </View>

        {/* Store Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>اسم المتجر *</Text>
          <TextInput
            style={styles.input}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="كازيون"
            placeholderTextColor={colors.gray[400]}
            editable={!uploading}
          />
        </View>

        {/* Start Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>تاريخ البداية *</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2026-01-05"
            placeholderTextColor={colors.gray[400]}
            editable={!uploading}
          />
        </View>

        {/* End Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>تاريخ النهاية *</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2026-02-02"
            placeholderTextColor={colors.gray[400]}
            editable={!uploading}
          />
        </View>

        {/* File Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ملف PDF *</Text>
          <TouchableOpacity
            style={styles.filePickerButton}
            onPress={handlePickDocument}
            disabled={uploading}
          >
            <Ionicons name="document-attach" size={24} color={colors.primary} />
            <Text style={styles.filePickerText}>
              {selectedFile ? selectedFile.name : 'اختر ملف PDF'}
            </Text>
          </TouchableOpacity>
          {selectedFile && (
            <Text style={styles.fileSizeText}>
              الحجم: {(selectedFile.size! / 1024 / 1024).toFixed(2)} MB
            </Text>
          )}
        </View>

        {/* Upload Progress */}
        {uploading && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stageText}>{progress.stage}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress.percentage)}%</Text>
            {progress.total > 0 && (
              <Text style={styles.progressStepText}>
                الخطوة {progress.current} من {progress.total}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={uploading}
          >
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.uploadButton, uploading && styles.buttonDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
                <Text style={styles.uploadButtonText}>رفع ومعالجة</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  noticeBox: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  noticeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    lineHeight: 20,
  },
  form: {
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filePickerButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.sm,
  },
  filePickerText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  fileSizeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  progressContainer: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  stageText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    fontWeight: 'bold',
  },
  progressStepText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  cancelButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  uploadButton: {
    backgroundColor: colors.primary,
  },
  uploadButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});