// src/components/flyers/SavePageButton.tsx - WITH BASKET LIMIT CHECK
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { useBasketLimit } from '../../hooks';

interface SavePageButtonProps {
  isSaved: boolean;
  onPress: () => void;
  style?: any;
}

export const SavePageButton: React.FC<SavePageButtonProps> = ({
  isSaved,
  onPress,
  style,
}) => {
  const { checkBasketLimit } = useBasketLimit();

  const handlePress = () => {
    // If already saved, just call onPress (to show "already saved" message)
    if (isSaved) {
      onPress();
      return;
    }

    // Check basket limit before saving
    if (!checkBasketLimit()) {
      return; // Alert already shown by hook
    }

    // Proceed with saving
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSaved && styles.buttonSaved,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isSaved ? 'bookmark' : 'bookmark-outline'}
        size={20}
        color={isSaved ? colors.white : colors.primary}
      />
      <Text style={[styles.buttonText, isSaved && styles.buttonTextSaved]}>
        {isSaved ? 'تم الحفظ' : 'حفظ الصفحة'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonSaved: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: I18nManager.isRTL ? 0 : spacing.xs,
    marginRight: I18nManager.isRTL ? spacing.xs : 0,
  },
  buttonTextSaved: {
    color: colors.white,
  },
});

export default SavePageButton;