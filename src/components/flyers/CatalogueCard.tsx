// 🔧 FIXED: CatalogueCard with date formatting (no year)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CachedImage } from '../common';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useLocalized } from '../../hooks';
import type { Catalogue, Store } from '../../types';

interface CatalogueCardProps {
  catalogue: Catalogue;
  store: Store;
  onPress: () => void;
}

// 🔧 NEW: Helper to format date without year
const formatDateNoYear = (dateStr: string, language: string = 'ar'): string => {
  try {
    const date = new Date(dateStr);
    
    const monthNames = language === 'ar' 
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    
    if (language === 'ar') {
      return `${day} ${month}`;
    } else {
      return `${month} ${day}`;
    }
  } catch (error) {
    return dateStr;
  }
};

// 🔧 NEW: Format date range without year
const formatDateRangeNoYear = (startDate: string, endDate: string, language: string = 'ar'): string => {
  const start = formatDateNoYear(startDate, language);
  const end = formatDateNoYear(endDate, language);
  
  if (language === 'ar') {
    return `${start} - ${end}`;
  } else {
    return `${start} - ${end}`;
  }
};

export const CatalogueCard: React.FC<CatalogueCardProps> = ({
  catalogue,
  store,
  onPress,
}) => {
  const { getName, getTitle, language } = useLocalized();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <CachedImage source={catalogue.coverImage} style={styles.coverImage} contentFit="cover" />
      
      <View style={styles.overlay}>
        <View style={styles.storeInfo}>
          <CachedImage 
            source={store.logo} 
            style={styles.storeLogo} 
            contentFit="contain" 
          />
          <Text style={styles.storeName}>{getName(store)}</Text>
        </View>
        
        <View style={styles.catalogueInfo}>
          <Text style={styles.title}>{getTitle(catalogue)}</Text>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={colors.white} />
            <Text style={styles.dateText}>
              {formatDateRangeNoYear(catalogue.startDate, catalogue.endDate, language)}
            </Text>
          </View>
        </View>
        
        <View style={styles.pagesInfo}>
          <Ionicons name="document-text-outline" size={16} color={colors.white} />
          <Text style={styles.pagesText}>{catalogue.pages.length} صفحات</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    marginBottom: spacing.md,
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  storeInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    marginRight: I18nManager.isRTL ? 0 : spacing.sm,
    marginLeft: I18nManager.isRTL ? spacing.sm : 0,
  },
  storeName: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  catalogueInfo: {
    alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
  },
  title: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  dateContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  dateText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  pagesInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    alignSelf: I18nManager.isRTL ? 'flex-start' : 'flex-end',
  },
  pagesText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
});

export default CatalogueCard;