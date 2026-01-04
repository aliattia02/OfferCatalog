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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { getAllCatalogues, deleteCatalogue } from '../../services/adminService';
import { Catalogue } from '../../types';
import { CatalogueUploadForm } from '../../components/admin/CatalogueUploadForm';
import { CatalogueListItem } from '../../components/admin/CatalogueListItem';

export default function AdminDashboard() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    loadCatalogues();
  }, []);

  const loadCatalogues = async () => {
    try {
      setLoading(true);
      const data = await getAllCatalogues();
      setCatalogues(data);
    } catch (error: any) {
      Alert.alert('خطأ', 'فشل تحميل الكتالوجات: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCatalogues();
  };

  const handleDelete = async (catalogue: Catalogue) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف كتالوج "${catalogue.titleAr}"؟`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCatalogue(catalogue.id, catalogue.pdfUrl || '');
              Alert.alert('نجح', 'تم حذف الكتالوج بنجاح');
              loadCatalogues();
            } catch (error: any) {
              Alert.alert('خطأ', 'فشل حذف الكتالوج: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    loadCatalogues();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل الكتالوجات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showUploadForm ? (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <CatalogueUploadForm
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUploadForm(false)}
          />
        </ScrollView>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>الكتالوجات</Text>
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
                  اضغط على "إضافة كتالوج" لرفع كتالوج جديد
                </Text>
              </View>
            ) : (
              catalogues.map((catalogue) => (
                <CatalogueListItem
                  key={catalogue.id}
                  catalogue={catalogue}
                  onDelete={() => handleDelete(catalogue)}
                />
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
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  uploadButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  uploadButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flex: 1,
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bottomPadding: {
    height: spacing.xl,
  },
});