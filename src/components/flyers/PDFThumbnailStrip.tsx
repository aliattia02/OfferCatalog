import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

interface PDFThumbnailStripProps {
  totalPages: number;
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  thumbnails?: { [key: number]: string }; // Page number to thumbnail URI map
  savedPageNumbers?: number[];
}

export const PDFThumbnailStrip: React.FC<PDFThumbnailStripProps> = ({
  totalPages,
  currentPage,
  onPageSelect,
  thumbnails = {},
  savedPageNumbers = [],
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1;
          const isCurrentPage = currentPage === index;
          const isSaved = savedPageNumbers.includes(pageNumber);
          const thumbnailUri = thumbnails[pageNumber];

          return (
            <TouchableOpacity
              key={pageNumber}
              style={[
                styles.thumbnail,
                isCurrentPage && styles.thumbnailActive,
              ]}
              onPress={() => onPageSelect(index)}
              activeOpacity={0.7}
            >
              {thumbnailUri ? (
                <Image
                  source={{ uri: thumbnailUri }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailPlaceholderText}>
                    {pageNumber}
                  </Text>
                </View>
              )}
              {isSaved && (
                <View style={styles.savedBadge}>
                  <Text style={styles.savedBadgeText}>✓</Text>
                </View>
              )}
              <Text style={styles.pageNumber}>{pageNumber}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray[300],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  savedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 2,
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
  },
});

export default PDFThumbnailStrip;
