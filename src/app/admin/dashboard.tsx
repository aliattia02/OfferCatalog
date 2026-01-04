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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { getAllCatalogues, deleteCatalogue } from '../../services/adminService';
import { refreshCatalogues, setCataloguesCache } from '../../data/catalogueRegistry';
import { Catalogue } from '../../types';
import { CatalogueUploadForm } from '../../components/admin/CatalogueUploadForm';
import { CatalogueListItem } from '../../components/admin/CatalogueListItem';
import { useAppSelector } from '../../store/hooks';

export default function AdminDashboard() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Get admin status
  const { isAdmin } = useAppSelector((state) => state.auth);

  useEffect(() => {
    loadCatalogues();
  }, []);

  const loadCatalogues = async () => {
    try {
      console.log('📄 [Admin] Loading catalogues...');
      setLoading(true);
      const data = await getAllCatalogues();
      setCatalogues(data);
      console.log(`✅ [Admin] Loaded ${data.length} catalogues`);
    } catch (error: any) {
      console.error('❌ [Admin] Error loading catalogues:', error);

      if (Platform.OS === 'web') {
        alert('خطأ: فشل تحميل الكتالوجات - ' + error.message);
      } else {
        Alert.alert('خطأ', 'فشل تحميل الكتالوجات: ' + error.message);
      }
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
    // Check if user is admin (for production security)
    if (!__DEV__ && !isAdmin) {
      if (Platform.OS === 'web') {
        alert('خطأ: غير مصرح لك بحذف الكتالوجات');
      } else {
        Alert.alert('خطأ', 'غير مصرح لك بحذف الكتالوجات');
      }
      return;
    }

    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `هل أنت متأكد من حذف كتالوج "${catalogue.titleAr}"؟\n\n` +
        'هذا الإجراء لا يمكن التراجع عنه.'
      );

      if (!confirmed) {
        console.log('🔴 [Admin] User cancelled delete');
        return;
      }

      // Perform delete
      await performDelete(catalogue);
    } else {
      // Native Alert
      Alert.alert(
        'تأكيد الحذف',
        `هل أنت متأكد من حذف كتالوج "${catalogue.titleAr}"؟`,
        [
          {
            text: 'إلغاء',
            style: 'cancel',
            onPress: () => console.log('🔴 [Admin] User cancelled delete'),
          },
          {
            text: 'حذف',
            style: 'destructive',
            onPress: () => performDelete(catalogue),
          },
        ]
      );
    }
  };

  const performDelete = async (catalogue: Catalogue) => {
    try {
      console.log(`🗑️ [Admin] Deleting catalogue: ${catalogue.id}`);
      await deleteCatalogue(catalogue.id, catalogue.pdfUrl || '');

      if (Platform.OS === 'web') {
        alert('✅ تم حذف الكتالوج بنجاح');
      } else {
        Alert.alert('✅ نجح', 'تم حذف الكتالوج بنجاح');
      }

      await loadCatalogues();
      // Also refresh the cache
      await refreshCatalogues();
    } catch (error: any) {
      console.error('❌ [Admin] Error deleting catalogue:', error);

      if (Platform.OS === 'web') {
        alert('❌ خطأ: فشل حذف الكتالوج - ' + (error.message || 'حدث خطأ غير متوقع'));
      } else {
        Alert.alert('❌ خطأ', 'فشل حذف الكتالوج: ' + (error.message || 'حدث خطأ غير متوقع'));
      }
    }
  };

  const handleUploadSuccess = async () => {
    console.log('✅ [Admin] Upload successful, refreshing catalogues...');
    setShowUploadForm(false);

    // Reload catalogues from Firestore
    await loadCatalogues();

    // Also refresh the registry cache
    const freshCatalogues = await refreshCatalogues();
    console.log(`✅ [Admin] Catalogues refreshed: ${freshCatalogues.length} items`);
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
              {!__DEV__ && !isAdmin && (
                <View style={styles.warningBadge}>
                  <Ionicons name="warning" size={14} color={colors.warning} />
                  <Text style={styles.warningText}>وضع القراءة فقط</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowUploadForm(true)}
            >
              <Ionicons name="add" size={24} color={colors.white} />
              <Text style={styles.uploadButtonText}>إضافة كتالوج</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Info Banner */}
          {__DEV__ && (
            <View style={styles.devBanner}>
              <Ionicons name="code-slash" size={20} color={colors.warning} />
              <Text style={styles.devBannerText}>
                وضع المطور: يمكنك حذف الكتالوجات بدون قيود
              </Text>
            </View>
          )}

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
                  canDelete={__DEV__ || isAdmin}
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
  warningBadge: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start',
    gap: spacing.xs,
  },
  warningText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    fontWeight: '600',
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
  devBanner: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    gap: spacing.sm,
  },
  devBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: '600',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
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