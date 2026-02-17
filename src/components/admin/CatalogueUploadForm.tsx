// src/components/admin/CatalogueUploadForm.tsx - DISABLED VERSION
// This version does NOT request camera or file permissions

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface CatalogueUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// 🔒 DISABLED COMPONENT - No camera or file access
export const CatalogueUploadForm: React.FC<CatalogueUploadFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إضافة كتالوج جديد</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Disabled Notice */}
      <View style={styles.disabledContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.gray[400]} />
        </View>

        <Text style={styles.disabledTitle}>ميزة الإدارة غير متاحة</Text>

        <Text style={styles.disabledText}>
          هذه النسخة من التطبيق مخصصة للمستخدمين فقط ولا تحتوي على ميزات الإدارة.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            للوصول إلى ميزات رفع الكتالوجات، يرجى استخدام تطبيق الإدارة الخاص.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
        >
          <Text style={styles.closeButtonText}>إغلاق</Text>
        </TouchableOpacity>
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
  disabledContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xl * 3,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  disabledTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  disabledText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    maxWidth: 400,
  },
  infoBox: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    maxWidth: 400,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.primary,
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  closeButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
});