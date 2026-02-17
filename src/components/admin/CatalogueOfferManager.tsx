// src/components/admin/CatalogueOfferManager.tsx - DISABLED VERSION
// This version does NOT request camera or photo library permissions

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface CatalogueOfferManagerProps {
  catalogueId: string;
  totalPages: number;
  onClose: () => void;
}

// 🔒 DISABLED COMPONENT - No camera or file access
export const CatalogueOfferManager: React.FC<CatalogueOfferManagerProps> = ({
  catalogueId,
  totalPages,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>إدارة عروض الكتالوج</Text>
          <Text style={styles.subtitle}>
            الكتالوج: {catalogueId}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
          هذه النسخة من التطبيق مخصصة للمستخدمين فقط ولا تحتوي على ميزات إدارة العروض.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            للوصول إلى ميزات إدارة العروض، يرجى استخدام تطبيق الإدارة الخاص.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>إغلاق</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
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
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  closeButton: {
    padding: spacing.sm,
  },
  disabledContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
  closeButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
});