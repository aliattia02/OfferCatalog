// src/components/admin/CatalogueOfferManager.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { 
  getCatalogueOffers, 
  addCatalogueOffer, 
  updateCatalogueOffer,
  deleteCatalogueOffer,
  CatalogueOffer 
} from '../../services/catalogueOfferService';

interface CatalogueOfferManagerProps {
  catalogueId: string;
  totalPages: number;
  onClose: () => void;
}

export const CatalogueOfferManager: React.FC<CatalogueOfferManagerProps> = ({
  catalogueId,
  totalPages,
  onClose,
}) => {
  const [offers, setOffers] = useState<CatalogueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<CatalogueOffer | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    offerPrice: '',
    originalPrice: '',
    unit: '',
    pageNumber: '1',
    categoryId: 'general',
    imageUrl: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOffers();
  }, [catalogueId]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await getCatalogueOffers(catalogueId);
      setOffers(data.sort((a, b) => a.pageNumber - b.pageNumber));
    } catch (error: any) {
      showAlert('خطأ', 'فشل تحميل العروض: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      showAlert('خطأ', 'فشل اختيار الصورة');
    }
  };

  const resetForm = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      offerPrice: '',
      originalPrice: '',
      unit: '',
      pageNumber: '1',
      categoryId: 'general',
      imageUrl: '',
    });
    setSelectedImage(null);
    setEditingOffer(null);
    setShowForm(false);
  };

  const handleEdit = (offer: CatalogueOffer) => {
    setEditingOffer(offer);
    setFormData({
      nameAr: offer.nameAr,
      nameEn: offer.nameEn,
      descriptionAr: offer.descriptionAr || '',
      descriptionEn: offer.descriptionEn || '',
      offerPrice: offer.offerPrice.toString(),
      originalPrice: offer.originalPrice?.toString() || '',
      unit: offer.unit || '',
      pageNumber: offer.pageNumber.toString(),
      categoryId: offer.categoryId,
      imageUrl: offer.imageUrl,
    });
    setSelectedImage(offer.imageUrl);
    setShowForm(true);
  };

  const handleDelete = async (offer: CatalogueOffer) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`هل أنت متأكد من حذف العرض "${offer.nameAr}"؟`)
      : await new Promise(resolve => {
          Alert.alert(
            'تأكيد الحذف',
            `هل أنت متأكد من حذف العرض "${offer.nameAr}"؟`,
            [
              { text: 'إلغاء', style: 'cancel', onPress: () => resolve(false) },
              { text: 'حذف', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      await deleteCatalogueOffer(catalogueId, offer.id, offer.imageUrl);
      showAlert('نجح', 'تم حذف العرض بنجاح');
      loadOffers();
    } catch (error: any) {
      showAlert('خطأ', 'فشل حذف العرض: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.nameAr.trim() || !formData.nameEn.trim()) {
      showAlert('خطأ', 'يرجى إدخال اسم العرض بالعربية والإنجليزية');
      return;
    }
    if (!formData.offerPrice || isNaN(Number(formData.offerPrice))) {
      showAlert('خطأ', 'يرجى إدخال سعر العرض');
      return;
    }
    if (!selectedImage && !editingOffer) {
      showAlert('خطأ', 'يرجى اختيار صورة للعرض');
      return;
    }

    try {
      setSubmitting(true);

      const offerData = {
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn.trim(),
        descriptionAr: formData.descriptionAr.trim(),
        descriptionEn: formData.descriptionEn.trim(),
        offerPrice: Number(formData.offerPrice),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        unit: formData.unit.trim() || undefined,
        pageNumber: Number(formData.pageNumber),
        categoryId: formData.categoryId,
        imageUrl: selectedImage || formData.imageUrl,
      };

      // Convert image to blob if it's a new local file
      let imageBlob: Blob | undefined;
      if (selectedImage && selectedImage.startsWith('file://')) {
        const response = await fetch(selectedImage);
        imageBlob = await response.blob();
      }

      if (editingOffer) {
        await updateCatalogueOffer(catalogueId, editingOffer.id, offerData, imageBlob);
        showAlert('نجح', 'تم تحديث العرض بنجاح');
      } else {
        await addCatalogueOffer(catalogueId, offerData as any, imageBlob);
        showAlert('نجح', 'تم إضافة العرض بنجاح');
      }

      resetForm();
      loadOffers();
    } catch (error: any) {
      showAlert('خطأ', 'فشل حفظ العرض: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل العروض...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>إدارة عروض الكتالوج</Text>
          <Text style={styles.subtitle}>
            الكتالوج: {catalogueId} | {offers.length} عرض
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {showForm ? (
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>
            {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
          </Text>

          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            {selectedImage ? (
              <img src={selectedImage} style={styles.previewImage} alt="Preview" />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="image-outline" size={48} color={colors.gray[400]} />
                <Text style={styles.imagePickerText}>اختر صورة العرض</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="الاسم (عربي) *"
            value={formData.nameAr}
            onChangeText={text => setFormData({ ...formData, nameAr: text })}
            placeholderTextColor={colors.gray[400]}
          />

          <TextInput
            style={styles.input}
            placeholder="Name (English) *"
            value={formData.nameEn}
            onChangeText={text => setFormData({ ...formData, nameEn: text })}
            placeholderTextColor={colors.gray[400]}
          />

          <TextInput
            style={styles.input}
            placeholder="الوصف (عربي)"
            value={formData.descriptionAr}
            onChangeText={text => setFormData({ ...formData, descriptionAr: text })}
            placeholderTextColor={colors.gray[400]}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Description (English)"
            value={formData.descriptionEn}
            onChangeText={text => setFormData({ ...formData, descriptionEn: text })}
            placeholderTextColor={colors.gray[400]}
            multiline
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="سعر العرض *"
              value={formData.offerPrice}
              onChangeText={text => setFormData({ ...formData, offerPrice: text })}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray[400]}
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="السعر الأصلي"
              value={formData.originalPrice}
              onChangeText={text => setFormData({ ...formData, originalPrice: text })}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="الوحدة (كجم، لتر...)"
              value={formData.unit}
              onChangeText={text => setFormData({ ...formData, unit: text })}
              placeholderTextColor={colors.gray[400]}
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder={`رقم الصفحة (1-${totalPages})`}
              value={formData.pageNumber}
              onChangeText={text => setFormData({ ...formData, pageNumber: text })}
              keyboardType="number-pad"
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={resetForm}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingOffer ? 'تحديث' : 'إضافة'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add-circle" size={24} color={colors.white} />
            <Text style={styles.addButtonText}>إضافة عرض جديد</Text>
          </TouchableOpacity>

          <ScrollView style={styles.offersList} showsVerticalScrollIndicator={false}>
            {offers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={64} color={colors.gray[300]} />
                <Text style={styles.emptyText}>لا توجد عروض في هذا الكتالوج</Text>
              </View>
            ) : (
              offers.map(offer => (
                <View key={offer.id} style={styles.offerCard}>
                  <img src={offer.imageUrl} style={styles.offerImage} alt={offer.nameAr} />
                  
                  <View style={styles.offerContent}>
                    <Text style={styles.offerName}>{offer.nameAr}</Text>
                    <Text style={styles.offerNameEn}>{offer.nameEn}</Text>
                    
                    <View style={styles.offerDetails}>
                      <Text style={styles.offerPrice}>
                        {offer.offerPrice} جنيه
                      </Text>
                      {offer.originalPrice && (
                        <Text style={styles.offerOriginalPrice}>
                          {offer.originalPrice} جنيه
                        </Text>
                      )}
                    </View>

                    <View style={styles.offerMeta}>
                      <View style={styles.pageTag}>
                        <Ionicons name="document-outline" size={14} color={colors.primary} />
                        <Text style={styles.pageNumber}>صفحة {offer.pageNumber}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.offerActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(offer)}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(offer)}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  closeButton: {
    padding: spacing.sm,
  },
  addButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  form: {
    flex: 1,
    padding: spacing.md,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  imagePicker: {
    height: 200,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    marginBottom: spacing.md,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.gray[400],
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  row: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  actions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  cancelButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  offersList: {
    flex: 1,
    padding: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  offerCard: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  offerImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    objectFit: 'cover',
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  offerContent: {
    flex: 1,
  },
  offerName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  offerNameEn: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  offerDetails: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  offerPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  offerOriginalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  offerMeta: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    marginTop: spacing.xs,
  },
  pageTag: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  pageNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  offerActions: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
});