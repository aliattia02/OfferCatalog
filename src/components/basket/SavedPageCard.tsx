import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatDate } from '../../utils/helpers';
import { useLocalized } from '../../hooks';
import type { BasketItem } from '../../types';

interface SavedPageCardProps {
  item: BasketItem;
  onRemove: () => void;
  onViewPage: () => void;
}

export const SavedPageCard: React.FC<SavedPageCardProps> = ({
  item,
  onRemove,
  onViewPage,
}) => {
  const { language } = useLocalized();

  if (!item.cataloguePage) return null;

  const { cataloguePage, storeName, offerEndDate } = item;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onViewPage}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: cataloguePage.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Ionicons name="bookmark" size={16} color={colors.primary} />
            <Text style={styles.badge}>صفحة محفوظة</Text>
          </View>
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>
          {cataloguePage.catalogueTitle}
        </Text>
        
        <Text style={styles.storeName}>{storeName}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="document-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>صفحة {cataloguePage.pageNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {cataloguePage.offerIds.length} عرض
            </Text>
          </View>
        </View>
        
        <View style={styles.expiryContainer}>
          <Ionicons name="time-outline" size={14} color={colors.warning} />
          <Text style={styles.expiryText}>
            ينتهي {formatDate(offerEndDate, language)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...shadows.sm,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  image: {
    width: 80,
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  badgeContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badge: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  removeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginBottom: spacing.xs,
  },
  storeName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  expiryContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
});

export default SavedPageCard;
