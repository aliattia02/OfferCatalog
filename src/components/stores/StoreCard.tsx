import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useLocalized } from '../../hooks';
import type { Store } from '../../types';

interface StoreCardProps {
  store: Store;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { getName } = useLocalized();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: store.logo }} style={styles.logo} resizeMode="contain" />
      
      <View style={styles.content}>
        <Text style={styles.name}>{getName(store)}</Text>
        <View style={styles.branchesContainer}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.branchesText}>
            {store.branches.length} فروع في الزقازيق
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        {onToggleFavorite && (
          <TouchableOpacity style={styles.favoriteButton} onPress={onToggleFavorite}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.primary : colors.gray[400]}
            />
          </TouchableOpacity>
        )}
        <Ionicons
          name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
          size={24}
          color={colors.gray[400]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  branchesContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  branchesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  actions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: spacing.xs,
    marginRight: I18nManager.isRTL ? 0 : spacing.sm,
    marginLeft: I18nManager.isRTL ? spacing.sm : 0,
  },
});

export default StoreCard;
