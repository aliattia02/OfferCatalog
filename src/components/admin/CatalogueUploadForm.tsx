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
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import {
  uploadCataloguePDF,
  createCatalogue,
  CatalogueMetadata,
  UploadProgress,
} from '../../services/adminService';

interface CatalogueUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
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
  const [uploadProgress, setUploadProgress] = useState(0);

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
      Alert.alert('خطأ', 'فشل اختيار الملف');
    }
  };

  const validateForm = (): boolean => {
    if (!titleAr.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال العنوان بالعربية');
      return false;
    }
    if (!titleEn.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال العنوان بالإنجليزية');
      return false;
    }
    if (!storeId.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال معرف المتجر');
      return false;
    }
    if (!storeName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المتجر');
      return false;
    }
    if (!startDate.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال تاريخ البداية');
      return false;
    }
    if (!endDate.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال تاريخ النهاية');
      return false;
    }
    if (!selectedFile) {
      Alert.alert('خطأ', 'يرجى اختيار ملف PDF');
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
      setUploadProgress(0);

      // Upload PDF to Firebase Storage
      const filename = `${storeId}_${Date.now()}.pdf`;
      const pdfUrl = await uploadCataloguePDF(
        selectedFile.uri,
        filename,
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage);
        }
      );

      // Create catalogue entry in Firestore
      const metadata: CatalogueMetadata = {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        storeId: storeId.trim(),
        storeName: storeName.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
      };

      await createCatalogue(metadata, pdfUrl);

      Alert.alert('نجح', 'تم رفع الكتالوج بنجاح', [
        {
          text: 'موافق',
          onPress: onSuccess,
        },
      ]);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('خطأ', 'فشل رفع الكتالوج: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إضافة كتالوج جديد</Text>
        <TouchableOpacity onPress={onCancel} disabled={uploading}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
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
            placeholder="2025-12-23"
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
            placeholder="2025-12-29"
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
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
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
              <Text style={styles.uploadButtonText}>رفع الكتالوج</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    ...shadows.md,
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
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
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
